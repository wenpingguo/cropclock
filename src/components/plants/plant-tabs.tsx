import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export type PlantTab = "months" | "allYear" | "perennials";

const TABS: { id: PlantTab; path: string }[] = [
  { id: "months", path: "/" },
  { id: "allYear", path: "/all-year" },
  { id: "perennials", path: "/perennials" },
];

/** The ways to browse the guide: by sowing month, all-year plants, or perennials. */
export function PlantTabs({ current, locale, t }: { current: PlantTab; locale: Locale; t: Dictionary }) {
  return (
    <nav aria-label={t.browse} className="border-b border-line">
      <ul className="-mb-px flex gap-6 overflow-x-auto">
        {TABS.map(({ id, path }) => {
          const active = id === current;
          return (
            <li key={id}>
              <Link
                href={localePath(locale, path)}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap border-b-2 pb-3 font-medium ${
                  active ? "border-leaf text-leaf-dark" : "border-transparent text-muted hover:border-line hover:text-ink"
                }`}
              >
                {t.tabs[id]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
