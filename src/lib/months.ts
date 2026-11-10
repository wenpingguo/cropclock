export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const WEEKS_PER_MONTH = 52 / 12;

/** English month name, for the English-only admin dashboard. */
export function monthName(month: number): string {
  return MONTHS[month - 1];
}

/** The next (+1) or previous (-1) month, wrapping around the year. */
export function shiftMonth(month: number, by: number): number {
  return ((month - 1 + by + 12) % 12) + 1;
}

/** The calendar month in Sydney, regardless of the server's time zone. */
export function sydneyMonth(date: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney",
      month: "numeric",
    }).format(date),
  );
}

/** True when a plant can be sown in every month of the year. */
export function isAllYear(sowingMonths: readonly number[]): boolean {
  return new Set(sowingMonths.filter((m) => m >= 1 && m <= 12)).size === 12;
}

/** A month from a query string value, or null if it isn't one. */
export function parseMonth(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{1,2}$/.test(value)) return null;
  const month = Number(value);
  return month >= 1 && month <= 12 ? month : null;
}

/** Every month a crop could be ready, given its sowing months and harvest range. */
export function harvestMonths(
  sowingMonths: number[],
  weeksMin: number,
  weeksMax: number,
): number[] {
  const first = Math.round(weeksMin / WEEKS_PER_MONTH);
  const last = Math.round(weeksMax / WEEKS_PER_MONTH);
  const months = new Set<number>();
  for (const sown of sowingMonths) {
    for (let offset = first; offset <= last; offset++) {
      months.add(((sown - 1 + offset) % 12) + 1);
    }
  }
  return [...months].sort((a, b) => a - b);
}
