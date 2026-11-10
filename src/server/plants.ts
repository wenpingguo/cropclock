import "server-only";
import { arrayContains, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { plants } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { escapeLike } from "@/lib/search";

// Popularity is deliberately left out of every public select: it orders
// results but never leaves the server.

/** Matches plants that can be sown in every month. */
const sownAllYear = sql<boolean>`${plants.sowingMonths} @> '{1,2,3,4,5,6,7,8,9,10,11,12}'::integer[]`;

/** What a plant card needs, including the facts behind its badges. */
const cardColumns = {
  slug: plants.slug,
  name: plants.name,
  nameZh: plants.nameZh,
  imageAdult: plants.imageAdult,
  harvestWeeksMin: plants.harvestWeeksMin,
  harvestWeeksMax: plants.harvestWeeksMax,
  lifeCycle: plants.lifeCycle,
  allYear: sownAllYear,
};

async function getPlantCards(where: SQL, locale: Locale) {
  await connection();
  const rows = await db
    .select(cardColumns)
    .from(plants)
    .where(where)
    .orderBy(desc(plants.popularity), asc(plants.name));

  return rows.map(({ nameZh, ...plant }) => ({
    ...plant,
    name: (locale === "zh" && nameZh) || plant.name,
  }));
}

/** Plants that can be sown in a month, most popular first. */
export function getPlantsForMonth(month: number, locale: Locale) {
  return getPlantCards(arrayContains(plants.sowingMonths, [month]), locale);
}

/** Plants that can be sown in every month, most popular first. */
export function getAllYearPlants(locale: Locale) {
  return getPlantCards(sownAllYear, locale);
}

/** Plants that keep growing for more than one year, most popular first. */
export function getPerennialPlants(locale: Locale) {
  return getPlantCards(eq(plants.lifeCycle, "perennial"), locale);
}

export async function getPlantBySlug(slug: string, locale: Locale) {
  await connection();
  const [plant] = await db
    .select({
      id: plants.id,
      slug: plants.slug,
      name: plants.name,
      nameZh: plants.nameZh,
      imageAdult: plants.imageAdult,
      imageSeed: plants.imageSeed,
      imageBaby: plants.imageBaby,
      imageCredits: plants.imageCredits,
      sowingMonths: plants.sowingMonths,
      harvestWeeksMin: plants.harvestWeeksMin,
      harvestWeeksMax: plants.harvestWeeksMax,
      soilType: plants.soilType,
      soilTypeZh: plants.soilTypeZh,
      phMin: plants.phMin,
      phMax: plants.phMax,
      sunlight: plants.sunlight,
      sunlightZh: plants.sunlightZh,
      watering: plants.watering,
      wateringZh: plants.wateringZh,
      spacing: plants.spacing,
      spacingZh: plants.spacingZh,
      companionPlants: plants.companionPlants,
      companionPlantsZh: plants.companionPlantsZh,
      frostTolerance: plants.frostTolerance,
      lifeCycle: plants.lifeCycle,
      lifespanYearsMin: plants.lifespanYearsMin,
      lifespanYearsMax: plants.lifespanYearsMax,
    })
    .from(plants)
    .where(eq(plants.slug, slug))
    .limit(1);
  if (!plant) return null;

  const { nameZh, soilTypeZh, sunlightZh, wateringZh, spacingZh, companionPlantsZh, ...english } =
    plant;
  if (locale !== "zh") return english;
  return {
    ...english,
    name: nameZh || english.name,
    soilType: soilTypeZh || english.soilType,
    sunlight: sunlightZh || english.sunlight,
    watering: wateringZh || english.watering,
    spacing: spacingZh || english.spacing,
    companionPlants: companionPlantsZh?.length ? companionPlantsZh : english.companionPlants,
  };
}

/**
 * Plants whose English or Chinese name contains the query, whichever
 * language the page is in. Exact names come first, then names that start
 * with the query, then names with a word that starts with it ("be" finds
 * Broad Beans before Cucumber), then the most popular.
 */
export async function searchPlants(query: string, locale: Locale, limit = 24) {
  await connection();
  if (!query) return [];
  const contains = `%${escapeLike(query)}%`;
  const startsWith = `${escapeLike(query)}%`;
  const wordStartsWith = `% ${escapeLike(query)}%`;
  const rank = sql`case
    when lower(${plants.name}) = lower(${query}) or ${plants.nameZh} = ${query} then 0
    when ${plants.name} ilike ${startsWith} or ${plants.nameZh} ilike ${startsWith} then 1
    when ${plants.name} ilike ${wordStartsWith} then 2
    else 3 end`;

  const rows = await db
    .select({ ...cardColumns, exact: sql<boolean>`${rank} = 0` })
    .from(plants)
    .where(or(ilike(plants.name, contains), ilike(plants.nameZh, contains)))
    .orderBy(rank, desc(plants.popularity), asc(plants.name))
    .limit(limit);

  return rows.map(({ nameZh, ...plant }) => ({
    ...plant,
    name: (locale === "zh" && nameZh) || plant.name,
    // In Chinese, the English name helps confirm the right plant.
    otherName: locale === "zh" && nameZh ? plant.name : null,
  }));
}

/** Every credited image, for the image credits page. */
export async function getImageCredits(locale: Locale) {
  await connection();
  const rows = await db
    .select({
      slug: plants.slug,
      name: plants.name,
      nameZh: plants.nameZh,
      imageCredits: plants.imageCredits,
    })
    .from(plants)
    .orderBy(asc(plants.name));
  return rows
    .filter((row) => Object.keys(row.imageCredits).length > 0)
    .map(({ nameZh, ...row }) => ({ ...row, name: (locale === "zh" && nameZh) || row.name }));
}

/** Adds one view in a single statement, so concurrent views are never lost. */
export async function recordPlantView(slug: string): Promise<boolean> {
  const updated = await db
    .update(plants)
    .set({ popularity: sql`${plants.popularity} + 1`, updatedAt: sql`${plants.updatedAt}` })
    .where(eq(plants.slug, slug))
    .returning({ id: plants.id });
  return updated.length > 0;
}
