CREATE TYPE "public"."life_cycle" AS ENUM('annual', 'perennial');--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "life_cycle" "life_cycle" DEFAULT 'annual' NOT NULL;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "lifespan_years_min" integer;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "lifespan_years_max" integer;--> statement-breakpoint
ALTER TABLE "plants" ADD CONSTRAINT "plants_lifespan_valid" CHECK (("plants"."lifespan_years_min" IS NULL AND "plants"."lifespan_years_max" IS NULL) OR ("plants"."life_cycle" = 'perennial' AND "plants"."lifespan_years_min" >= 1 AND "plants"."lifespan_years_min" <= "plants"."lifespan_years_max"));--> statement-breakpoint
-- Mark the seeded perennials in databases seeded before this column existed.
-- Runs once, so later admin edits are never overwritten.
UPDATE "plants" SET "life_cycle" = 'perennial', "lifespan_years_min" = 3, "lifespan_years_max" = 4 WHERE "slug" = 'strawberry';--> statement-breakpoint
UPDATE "plants" SET "life_cycle" = 'perennial', "lifespan_years_min" = 3, "lifespan_years_max" = 5 WHERE "slug" IN ('chives', 'thyme');--> statement-breakpoint
UPDATE "plants" SET "life_cycle" = 'perennial', "lifespan_years_min" = 2, "lifespan_years_max" = 3 WHERE "slug" = 'chilli';
