import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { shiftMonth } from "@/lib/months";

const arrow =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-card text-lg hover:border-leaf";

export function MonthSwitcher({ month, locale, t }: { month: number; locale: Locale; t: Dictionary }) {
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const href = (value: number) => `${localePath(locale, "/")}?month=${value}`;

  return (
    <nav aria-label={t.chooseMonth} className="flex items-center gap-2">
      <Link href={href(previous)} className={arrow} aria-label={t.previousMonth(t.months[previous - 1])}>
        ←
      </Link>
      <ul className="grid min-w-0 flex-1 grid-cols-6 gap-1 lg:flex lg:justify-between">
        {t.months.map((name, index) => {
          const value = index + 1;
          const current = value === month;
          return (
            <li key={value}>
              <Link
                href={href(value)}
                aria-label={name}
                aria-current={current ? "page" : undefined}
                className={`block whitespace-nowrap rounded-full px-1 py-1.5 text-center text-sm font-medium lg:px-3 lg:py-2 ${
                  current ? "bg-leaf text-white" : "text-muted hover:bg-leaf-soft hover:text-ink"
                }`}
              >
                {t.shortMonths[index]}
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href={href(next)} className={arrow} aria-label={t.nextMonth(t.months[next - 1])}>
        →
      </Link>
    </nav>
  );
}
