import type { Metadata } from "next";
import { Suspense } from "react";
import { GridSkeleton, PlantGrid } from "@/components/plants/plant-grid";
import { PlantTabs } from "@/components/plants/plant-tabs";
import { getI18n } from "@/i18n/server";
import { getPerennialPlants } from "@/server/plants";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.tabs.perennials, description: t.perennialsIntro };
}

export default async function PerennialsPage() {
  const { locale, t } = await getI18n();
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <PlantTabs current="perennials" locale={locale} t={t} />
      <h1 className="mt-8 font-display text-3xl font-semibold sm:text-4xl">{t.perennialsHeading}</h1>
      <p className="mt-2 text-muted">{t.perennialsIntro}</p>
      <Suspense fallback={<GridSkeleton />}>
        <PerennialPlants />
      </Suspense>
    </main>
  );
}

async function PerennialPlants() {
  const { locale, t } = await getI18n();
  const plants = await getPerennialPlants(locale);
  if (plants.length === 0) return <p className="mt-6 text-muted">{t.noPerennials}</p>;
  return <PlantGrid plants={plants} locale={locale} t={t} hide="perennial" />;
}
