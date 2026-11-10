import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { searchPlants } from "@/server/plants";
import { normaliseQuery, SUGGESTION_LIMIT, type PlantSuggestion } from "@/lib/search";

/** Suggestions for the header search box: GET /api/plants/search?q=tom&lang=en */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lang = params.get("lang");
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const results = await searchPlants(normaliseQuery(params.get("q")), locale, SUGGESTION_LIMIT);

  const body: PlantSuggestion[] = results.map(({ slug, name, otherName, imageAdult, exact }) => ({
    slug,
    name,
    otherName,
    imageAdult,
    exact,
  }));
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}
