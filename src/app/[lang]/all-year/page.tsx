import type { Metadata } from "next";
import { Suspense } from "react";
import { GridSkeleton, PlantGrid } from "@/components/plants/plant-grid";
import { PlantTabs } from "@/components/plants/plant-tabs";
import { getI18n } from "@/i18n/server";
import { getAllYearPlants } from "@/server/plants";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.tabs.allYear, description: t.allYearIntro };
}

export default async function AllYearPage() {
  const { locale, t } = await getI18n();
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <PlantTabs current="allYear" locale={locale} t={t} />
      <h1 className="mt-8 font-display text-3xl font-semibold sm:text-4xl">{t.allYearHeading}</h1>
      <p className="mt-2 text-muted">{t.allYearIntro}</p>
      <Suspense fallback={<GridSkeleton />}>
        <AllYearPlants />
      </Suspense>
    </main>
  );
}

async function AllYearPlants() {
  const { locale, t } = await getI18n();
  const plants = await getAllYearPlants(locale);
  if (plants.length === 0) return <p className="mt-6 text-muted">{t.noAllYear}</p>;
  return <PlantGrid plants={plants} locale={locale} t={t} hide="allYear" />;
}
