import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { IMAGE_KINDS } from "@/db/schema";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { getImageCredits } from "@/server/plants";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.imageCredits };
}

export default async function CreditsPage() {
  const { t } = await getI18n();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">{t.imageCredits}</h1>
      <p className="mt-3 text-muted">{t.creditsIntro}</p>
      <Suspense fallback={null}>
        <CreditList />
      </Suspense>
    </main>
  );
}

async function CreditList() {
  const { locale, t } = await getI18n();
  const rows = await getImageCredits(locale);
  if (rows.length === 0) return <p className="mt-6 text-muted">{t.creditsNone}</p>;

  return (
    <dl className="mt-6 divide-y divide-line border-y border-line">
      {rows.map((row) => (
        <div key={row.slug} className="py-4">
          <dt className="font-medium">
            <Link href={localePath(locale, `/plants/${row.slug}`)} className="hover:underline">
              {row.name}
            </Link>
          </dt>
          {IMAGE_KINDS.map((kind) => {
            const credit = row.imageCredits[kind];
            if (!credit) return null;
            return (
              <dd key={kind} className="mt-1 text-sm text-muted">
                {t.images[kind]}
                {t.colon}
                <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
                  {credit.author}
                </a>
                , {credit.license}
              </dd>
            );
          })}
        </div>
      ))}
    </dl>
  );
}
