import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlantGallery, type GalleryImage } from "@/components/plants/plant-gallery";
import { ViewTracker } from "@/components/plants/view-tracker";
import { YearTimeline } from "@/components/plants/year-timeline";
import { IMAGE_KINDS } from "@/db/schema";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { harvestMonths } from "@/lib/months";
import { getPlantBySlug } from "@/server/plants";

export async function generateMetadata({ params }: PageProps<"/[lang]/plants/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { locale, t } = await getI18n();
  const plant = await getPlantBySlug(slug, locale);
  return { title: plant?.name ?? t.plantNotFound };
}

export default async function PlantPage({ params }: PageProps<"/[lang]/plants/[slug]">) {
  const { locale, t } = await getI18n();
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <Link href={localePath(locale, "/")} className="text-sm font-medium text-leaf hover:underline">
        {t.backToGuide}
      </Link>
      <Suspense fallback={<div className="mt-6 aspect-[4/3] max-w-xl animate-pulse rounded-lg bg-line/50" />}>
        <PlantDetail params={params} />
      </Suspense>
    </main>
  );
}

async function PlantDetail({ params }: Pick<PageProps<"/[lang]/plants/[slug]">, "params">) {
  const { slug } = await params;
  const { locale, t } = await getI18n();
  const plant = await getPlantBySlug(slug, locale);
  if (!plant) notFound();

  const files = { adult: plant.imageAdult, seed: plant.imageSeed, baby: plant.imageBaby };
  const images: GalleryImage[] = IMAGE_KINDS.flatMap((kind) => {
    const file = files[kind];
    return file ? [{ label: t.images[kind], file, credit: plant.imageCredits[kind] }] : [];
  });

  const care: [string, string][] = [
    [t.care.soilType, plant.soilType],
    [t.care.ph, `${plant.phMin.toFixed(1)}–${plant.phMax.toFixed(1)}`],
    [t.care.sunlight, plant.sunlight],
    [t.care.watering, plant.watering],
    [t.care.spacing, plant.spacing],
    [t.care.companions, plant.companionPlants.join(t.listSeparator) || t.noneListed],
    [t.care.frost, t.frost[plant.frostTolerance]],
    [
      t.care.lifeCycle,
      plant.lifeCycle === "perennial" && plant.lifespanYearsMin && plant.lifespanYearsMax
        ? t.lifespan(plant.lifespanYearsMin, plant.lifespanYearsMax)
        : t.lifeCycle[plant.lifeCycle],
    ],
  ];

  return (
    // grid-cols-1 caps the column at the screen width, so wide content scrolls instead of stretching the page.
    <article className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
      <ViewTracker slug={plant.slug} />
      <PlantGallery name={plant.name} images={images} photoLabel={`${t.photoBy}${t.colon}`} />
      <div>
        <h1 className="font-display text-4xl font-semibold">{plant.name}</h1>
        <p className="mt-2 text-muted">{t.readyIn(plant.harvestWeeksMin, plant.harvestWeeksMax)}</p>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold">{t.growthTimeline}</h2>
          <div className="mt-3">
            <YearTimeline
              sowing={plant.sowingMonths}
              harvest={harvestMonths(plant.sowingMonths, plant.harvestWeeksMin, plant.harvestWeeksMax)}
              t={t}
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold">{t.careInstructions}</h2>
          <dl className="mt-3 divide-y divide-line border-y border-line">
            {care.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
                <dt className="text-sm font-medium">{label}</dt>
                <dd className="text-sm text-muted">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </article>
  );
}
