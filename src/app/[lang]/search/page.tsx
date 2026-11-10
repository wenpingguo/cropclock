import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PlantGrid } from "@/components/plants/plant-grid";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { searchPlants } from "@/server/plants";
import { normaliseQuery } from "@/lib/search";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.search.title, robots: { index: false } };
}

export default function SearchPage({ searchParams }: PageProps<"/[lang]/search">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <Suspense fallback={null}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/[lang]/search">, "searchParams">) {
  const query = normaliseQuery((await searchParams).q);
  const { locale, t } = await getI18n();
  const plants = await searchPlants(query, locale);

  // One clear answer: go straight to that plant.
  if (plants.length === 1 || plants[0]?.exact) {
    redirect(localePath(locale, `/plants/${plants[0].slug}`));
  }

  if (!query) {
    return (
      <>
        <h1 className="font-display text-3xl font-semibold">{t.search.title}</h1>
        <p className="mt-3 text-muted">{t.search.prompt}</p>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-3xl font-semibold">{t.search.heading(query)}</h1>
      {plants.length > 0 ? (
        <PlantGrid plants={plants} locale={locale} t={t} />
      ) : (
        <p className="mt-3 text-muted">{t.search.noResults(query)}</p>
      )}
    </>
  );
}
