/** One suggestion returned by GET /api/plants/search. */
export type PlantSuggestion = {
  slug: string;
  name: string;
  otherName: string | null;
  imageAdult: string | null;
  exact: boolean;
};

/** How many suggestions the header search box shows. */
export const SUGGESTION_LIMIT = 8;

/** Longest search text accepted; anything longer is cut off. */
export const MAX_QUERY_LENGTH = 50;

/** Trims and shortens what a visitor typed. Returns "" when there is nothing to search for. */
export function normaliseQuery(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH);
}

/** Escapes LIKE wildcards so "%" and "_" are matched literally. */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}
