import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, localePath, splitLocale } from "@/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * English pages have no prefix and Chinese pages live under /zh. Internally
 * every page is served from app/[lang], so unprefixed paths are rewritten to
 * /en. The last language a visitor chose is remembered in a cookie.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { locale, path } = splitLocale(pathname);
  const isAdmin = path === "/admin" || path.startsWith("/admin/");

  // The admin dashboard is English only.
  if (isAdmin) {
    if (locale) return redirect(request, path + search);
    return NextResponse.rewrite(new URL(`/${DEFAULT_LOCALE}${pathname}${search}`, request.url));
  }

  // An explicit /en/... link means "switch to English": drop the prefix.
  if (locale === DEFAULT_LOCALE) {
    return remember(redirect(request, path + search), DEFAULT_LOCALE);
  }

  if (locale) return remember(NextResponse.next(), locale);

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved) && saved !== DEFAULT_LOCALE) {
    return redirect(request, localePath(saved, pathname) + search);
  }
  return NextResponse.rewrite(new URL(`/${DEFAULT_LOCALE}${pathname}${search}`, request.url));
}

function redirect(request: NextRequest, to: string) {
  return NextResponse.redirect(new URL(to, request.url));
}

function remember(response: NextResponse, locale: string) {
  response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  return response;
}

export const config = {
  // Skip API routes, uploaded images, Next.js internals and files such as favicon.ico.
  matcher: ["/((?!api|uploads|_next|.*\\..*).*)"],
};
