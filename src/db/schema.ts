import { sql } from "drizzle-orm";
import {
  check,
  customType,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const IMAGE_KINDS = ["adult", "seed", "baby"] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

/** Attribution for a third-party image: who made it, its licence and where it came from. */
export type ImageCredit = { author: string; license: string; sourceUrl: string };
export type ImageCredits = Partial<Record<ImageKind, ImageCredit>>;

export const frostTolerance = pgEnum("frost_tolerance", [
  "none",
  "light",
  "hardy",
]);

// How the plant is grown in a home garden: replanted each season, or kept for years.
export const lifeCycle = pgEnum("life_cycle", ["annual", "perennial"]);

export const plants = pgTable(
  "plants",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    // Chinese translations. Null falls back to the English value.
    nameZh: text("name_zh"),
    soilTypeZh: text("soil_type_zh"),
    sunlightZh: text("sunlight_zh"),
    wateringZh: text("watering_zh"),
    spacingZh: text("spacing_zh"),
    companionPlantsZh: text("companion_plants_zh").array(),

    // Paths relative to the upload store. Null until an image is uploaded.
    imageAdult: text("image_adult"),
    imageSeed: text("image_seed"),
    imageBaby: text("image_baby"),
    imageCredits: jsonb("image_credits").$type<ImageCredits>().notNull().default({}),

    // Months 1-12 in which the plant can be sown in Sydney.
    sowingMonths: integer("sowing_months").array().notNull(),
    harvestWeeksMin: integer("harvest_weeks_min").notNull(),
    harvestWeeksMax: integer("harvest_weeks_max").notNull(),

    soilType: text("soil_type").notNull(),
    phMin: numeric("ph_min", { precision: 3, scale: 1, mode: "number" }).notNull(),
    phMax: numeric("ph_max", { precision: 3, scale: 1, mode: "number" }).notNull(),
    sunlight: text("sunlight").notNull(),
    watering: text("watering").notNull(),
    spacing: text("spacing").notNull(),
    companionPlants: text("companion_plants").array().notNull().default(sql`'{}'`),
    frostTolerance: frostTolerance("frost_tolerance").notNull(),
    lifeCycle: lifeCycle("life_cycle").notNull().default("annual"),
    // How many years a perennial stays productive. Null for annuals or when unknown.
    lifespanYearsMin: integer("lifespan_years_min"),
    lifespanYearsMax: integer("lifespan_years_max"),

    // Never select this in public queries: it stays server-side and admin-only.
    popularity: integer("popularity").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("plants_sowing_months_idx").using("gin", t.sowingMonths),
    index("plants_popularity_idx").on(t.popularity.desc()),
    check(
      "plants_sowing_months_valid",
      sql`cardinality(${t.sowingMonths}) > 0 AND ${t.sowingMonths} <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]`,
    ),
    check(
      "plants_harvest_weeks_valid",
      sql`${t.harvestWeeksMin} > 0 AND ${t.harvestWeeksMin} <= ${t.harvestWeeksMax}`,
    ),
    check(
      "plants_lifespan_valid",
      sql`(${t.lifespanYearsMin} IS NULL AND ${t.lifespanYearsMax} IS NULL) OR (${t.lifeCycle} = 'perennial' AND ${t.lifespanYearsMin} >= 1 AND ${t.lifespanYearsMin} <= ${t.lifespanYearsMax})`,
    ),
    check(
      "plants_ph_valid",
      sql`${t.phMin} >= 0 AND ${t.phMax} <= 14 AND ${t.phMin} <= ${t.phMax}`,
    ),
  ],
);

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

// Plant photos live in the database, so the app needs no persistent disk.
// Plants refer to an image by its name, e.g. "3f2c…e1.jpg".
export const images = pgTable("images", {
  name: text("name").primaryKey(),
  contentType: text("content_type").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Plant = typeof plants.$inferSelect;
export type NewPlant = typeof plants.$inferInsert;
export type FrostTolerance = (typeof frostTolerance.enumValues)[number];
export type LifeCycle = (typeof lifeCycle.enumValues)[number];
