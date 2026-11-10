import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { PlantSearch } from "@/components/layout/plant-search";
import { HTML_LANG, LOCALES, localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import "@/styles/globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

const AUTHOR = "Wenping Guo";
const ISSUE_EMAIL = "guovin+CropClock@gmail.com";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: "CropClock", template: "%s | CropClock" },
    description: t.siteDescription,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale, t } = await getI18n();

  return (
    <html lang={HTML_LANG[locale]} className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6">
            <div className="flex items-baseline gap-4">
              <Link href={localePath(locale, "/")} className="font-display text-2xl font-semibold text-leaf-dark">
                CropClock
              </Link>
              <p className="hidden text-sm text-muted lg:block">{t.siteTagline}</p>
            </div>
            {/* Its own row on phones; beside the language switcher from sm up. */}
            <PlantSearch locale={locale} className="order-last basis-full sm:order-none sm:ml-auto sm:basis-64 lg:basis-80" />
            <LanguageSwitcher current={locale} label={t.language} />
          </div>
        </header>
        {children}
        <footer className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-muted sm:grid-cols-[1fr_auto] sm:gap-12 sm:px-6">
            <div className="max-w-2xl">
              <p className="font-display text-base font-semibold text-ink">CropClock</p>
              <p className="mt-1 leading-relaxed">{t.about}</p>
              <p className="mt-3">{t.madeBy(AUTHOR)}</p>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 sm:flex-col sm:items-end">
              <li>
                <a
                  href={`mailto:${ISSUE_EMAIL}?subject=${encodeURIComponent(t.reportIssueSubject)}`}
                  className="hover:text-ink hover:underline"
                >
                  {t.reportIssue}
                </a>
              </li>
              <li>
                <Link href={localePath(locale, "/credits")} className="hover:text-ink hover:underline">
                  {t.imageCredits}
                </Link>
              </li>
            </ul>
          </div>
        </footer>
      </body>
    </html>
  );
}
