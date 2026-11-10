import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { IMAGE_KINDS, images, plants, type ImageCredit, type ImageCredits, type ImageKind } from "@/db/schema";
import { seedPlants } from "./plants";
import { CARE_TEXT_ZH, PLANT_NAMES_ZH } from "./translations-zh";
import { slugify } from "@/lib/slug";

process.loadEnvFile(".env");

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(sql);

const SEED_IMAGE_DIR = path.resolve("database/seed/images");
const COLUMNS = { adult: "imageAdult", seed: "imageSeed", baby: "imageBaby" } as const;

type SeedImage = ImageCredit & { file: string };
type SeedImageManifest = Record<string, Partial<Record<ImageKind, SeedImage>>>;

export function translate(plant: (typeof seedPlants)[number]) {
  const zh = (text: string) => CARE_TEXT_ZH[text] ?? null;
  return {
    nameZh: PLANT_NAMES_ZH[plant.name] ?? null,
    soilTypeZh: zh(plant.soilType),
    sunlightZh: zh(plant.sunlight),
    wateringZh: zh(plant.watering),
    spacingZh: zh(plant.spacing),
    companionPlantsZh: (plant.companionPlants ?? []).map((name) => PLANT_NAMES_ZH[name] ?? name),
  };
}

async function loadManifest(): Promise<SeedImageManifest> {
  try {
    return JSON.parse(await readFile(path.join(SEED_IMAGE_DIR, "manifest.json"), "utf8"));
  } catch {
    return {};
  }
}

async function main() {
  // New plants are inserted; existing ones keep their admin edits and view counts.
  const inserted = await db
    .insert(plants)
    .values(seedPlants.map((plant) => ({ ...plant, ...translate(plant), slug: slugify(plant.name) })))
    .onConflictDoNothing({ target: plants.slug })
    .returning({ id: plants.id });
  console.log(`Added ${inserted.length} of ${seedPlants.length} plants.`);

  const manifest = await loadManifest();
  let translated = 0;
  let imagesAdded = 0;

  for (const plant of seedPlants) {
    const slug = slugify(plant.name);
    const [row] = await db.select().from(plants).where(eq(plants.slug, slug)).limit(1);
    if (!row) continue;

    // Fill only blank fields, so translations or images an admin set are kept.
    const zh = translate(plant);
    const update: Partial<typeof plants.$inferInsert> = {};
    for (const key of Object.keys(zh) as (keyof typeof zh)[]) {
      if (row[key] === null && zh[key] !== null) Object.assign(update, { [key]: zh[key] });
    }
    if (Object.keys(update).length) translated++;

    const credits: ImageCredits = { ...row.imageCredits };
    for (const kind of IMAGE_KINDS) {
      const image = manifest[slug]?.[kind];
      if (!image || row[COLUMNS[kind]]) continue;
      // Seed images are already JPEGs sized for the site, so they are stored as they are.
      const name = `${randomUUID()}.jpg`;
      const data = await readFile(path.join(SEED_IMAGE_DIR, image.file));
      await db.insert(images).values({ name, contentType: "image/jpeg", data });
      update[COLUMNS[kind]] = name;
      credits[kind] = { author: image.author, license: image.license, sourceUrl: image.sourceUrl };
      imagesAdded++;
    }
    update.imageCredits = credits;

    await db.update(plants).set(update).where(eq(plants.id, row.id));
  }
  console.log(`Translated ${translated} plants and added ${imagesAdded} images.`);
}

main().finally(() => sql.end());
