import { connection } from "next/server";
import { Suspense } from "react";
import { MonthSwitcher } from "@/components/plants/month-switcher";
import { GridSkeleton, PlantGrid } from "@/components/plants/plant-grid";
import { PlantTabs } from "@/components/plants/plant-tabs";
import { getI18n } from "@/i18n/server";
import { parseMonth, sydneyMonth } from "@/lib/months";
import { getPlantsForMonth } from "@/server/plants";

export default async function HomePage({ searchParams }: PageProps<"/[lang]">) {
  const { locale, t } = await getI18n();
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <PlantTabs current="months" locale={locale} t={t} />
      <Suspense fallback={<GridSkeleton className="mt-32" />}>
        <MonthView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function MonthView({ searchParams }: Pick<PageProps<"/[lang]">, "searchParams">) {
  const { month: monthParam } = await searchParams;
  await connection();
  const { locale, t } = await getI18n();
  const month = parseMonth(monthParam) ?? sydneyMonth();
  const plants = await getPlantsForMonth(month, locale);
  const monthLabel = t.months[month - 1];

  return (
    <>
      <div className="mt-6">
        <MonthSwitcher month={month} locale={locale} t={t} />
      </div>
      <h1 className="mt-8 font-display text-3xl font-semibold sm:text-4xl">{t.sowHeading(monthLabel)}</h1>
      {plants.length > 0 ? (
        <PlantGrid plants={plants} locale={locale} t={t} />
      ) : (
        <p className="mt-6 text-muted">{t.noPlants(monthLabel)}</p>
      )}
    </>
  );
}
