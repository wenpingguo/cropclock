# CropClock

A month-by-month planting guide for Sydney gardens, with an admin dashboard for managing plants.

Built with Next.js, TypeScript, Tailwind CSS, Drizzle ORM and PostgreSQL.

## Requirements

- Node.js 22.12 or newer
- Docker, for the local PostgreSQL database

## Getting started

```sh
cp .env.example .env   # then set ADMIN_PASSWORD and SESSION_SECRET
npm install
npm run setup          # starts Postgres, applies migrations, seeds plants
npm run dev
```

- Site: <http://localhost:3000>
- Admin: <http://localhost:3000/admin>, using `ADMIN_PASSWORD` from `.env`

Postgres runs on port 5433. Plant images are stored in the database too (the `images` table), so the app needs no persistent disk.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Build and run for production |
| `npm test` | Run unit tests |
| `npm run lint` | Run ESLint |
| `npm run db:up` | Start Postgres |
| `npm run db:generate` | Create a migration after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Add starter plants, translations and images; fills only blank fields |

## Project structure

```text
database/                 Everything for setting up the database
  compose.yml             Local PostgreSQL (Docker)
  drizzle.config.ts       Migration tool settings
  migrations/             SQL migrations, generated from src/db/schema.ts
  seed/                   Starter plants, Chinese translations and seed images
scripts/                  Helper shell scripts
src/
  app/                    Pages and API routes (Next.js App Router)
    [lang]/               Public pages and admin, for each language
    api/                  JSON endpoints: search suggestions, view counts
    uploads/[name]/       Serves stored images at 256, 640 or 1200 px wide
  components/
    admin/                Admin forms and buttons
    layout/               Site header: search box, language switcher
    plants/               Plant cards, gallery, timeline, month switcher
  db/                     Database connection and schema
  i18n/                   Language settings and interface text (English, 中文)
  lib/                    Shared helpers used by both browser and server code
  server/                 Server-only code: queries, login sessions, image storage
    actions/              Server actions behind the admin forms
  styles/                 Global CSS and theme colours
  proxy.ts                Language routing (runs before every page request)
```

Next.js, TypeScript, ESLint, PostCSS and npm look for their config files in the project root, so those stay there.

## Languages

The public site is in English (default, no URL prefix) and Simplified Chinese (`/zh/...`). `src/proxy.ts` rewrites unprefixed URLs to the internal `app/[lang]` routes and remembers the visitor's last choice in a cookie. Interface text lives in `src/i18n/dictionaries.ts`.

Plant content has optional Chinese columns (`name_zh`, `soil_type_zh` and so on), editable in the admin form. Blank fields fall back to English. The admin dashboard itself is English only.

## Browsing tabs

The public pages have three tabs:

- **By month** (`/`): plants that can be sown in the chosen month.
- **All year round** (`/all-year`): plants whose sowing months cover all twelve months. There's no separate field for this; ticking every month in the admin form is enough. These plants also stay in every month's list, with an "All year" badge.
- **Perennials** (`/perennials`): plants whose `life_cycle` is `perennial`. They're badged "Perennial" in the other lists. The optional `lifespan_years_min` and `lifespan_years_max` columns record how many years a perennial stays productive. The plant page shows that range, and the database rejects it for annuals.

"Perennial" means how the plant is grown in a home garden, not its botany. Biennials like parsley and carrot, which are replanted each season, count as annual.

## Search

The search box in the header matches plant names in English and Chinese on either language's pages. Suggestions come from `GET /api/plants/search?q=…&lang=…`, and picking one opens that plant. Pressing Enter opens `/search?q=…`, which goes straight to the plant when there is only one match or an exact name match. Without JavaScript the box still submits to that page. Matching and ranking live in `searchPlants` in `src/server/plants.ts`.

## Plant images

Seeded plants use freely licensed photos from Wikimedia Commons, stored in `database/seed/images/` with their author, licence and source in `database/seed/images/manifest.json`. `npm run db:seed` loads them into the database for any plant that has no image yet, so it never replaces an image an admin uploaded.

Images are stored once, at most 1200 px, in the `images` table. `GET /uploads/<name>?w=256|640|1200` resizes on request with `sharp`, and responses are cached for a year by browsers and Vercel's CDN, since names are never reused. `src/lib/image-loader.ts` points `next/image` at those widths, so Vercel's paid Image Optimization isn't used. The admin form shrinks photos in the browser before upload to stay under Vercel's 4.5 MB request limit.

Each image's credit is shown under the photo and on the Image credits page (`/credits`). When uploading a photo you didn't take, fill in its credit fields in the admin form.

## How popularity works

Each plant has a `popularity` integer, set by an admin, that orders the home page. It goes up by 1 each time a detail page opens in a browser. `ViewTracker` sends the update as a client-side `POST`, so link prefetches and crawlers that don't run JavaScript aren't counted. Public queries never select the column.

## Deploying (Vercel + Neon)

The site runs on Vercel's free Hobby plan with a free Neon Postgres database. Neither needs a credit card, and both stop at their free limits instead of billing.

1. **Database.** Create a Neon project in the AWS Sydney region (`ap-southeast-2`) and copy its *pooled* connection string. From this folder, load the schema and starter data into it. A `DATABASE_URL` set on the command line takes precedence over `.env`:

   ```sh
   DATABASE_URL="postgres://…-pooler…/neondb?sslmode=require" npm run db:migrate
   DATABASE_URL="postgres://…-pooler…/neondb?sslmode=require" npm run db:seed
   ```

2. **App.** Import the GitHub repository into Vercel, then set these environment variables:
   - `DATABASE_URL`: the same pooled Neon connection string
   - `ADMIN_PASSWORD`: a strong password for `/admin`
   - `SESSION_SECRET`: a new random value (`openssl rand -hex 32`)

   `vercel.json` pins the app to Vercel's Sydney region (`syd1`), next to the database.

3. **Domain.** In the Vercel project, add `cropclock.<your-domain>` and create the CNAME record Vercel shows at your DNS provider.

Every push to `main` then deploys automatically. To add plants later, edit `database/seed/plants.ts` and rerun `db:seed` against Neon, or use `/admin` on the live site.
