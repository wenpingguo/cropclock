"use client";

import type { MouseEvent } from "react";
import { LOCALE_NAMES, LOCALES, localePath, splitLocale, type Locale } from "@/i18n/config";

/**
 * Links to the current page in each language. The target is worked out from
 * the browser URL when clicked, since the server can't see it behind the
 * proxy rewrite. Without JavaScript the links still go to each home page.
 */
export function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  function switchTo(event: MouseEvent<HTMLAnchorElement>, locale: Locale) {
    event.preventDefault();
    const { path } = splitLocale(window.location.pathname);
    // /en/... tells the proxy to remember English and drop the prefix.
    const target = locale === "en" ? `/en${path === "/" ? "" : path}` : localePath(locale, path);
    window.location.assign(target + window.location.search);
  }

  return (
    <nav aria-label={label} className="flex items-center gap-1 text-sm">
      {LOCALES.map((locale) =>
        locale === current ? (
          <span
            key={locale}
            aria-current="true"
            lang={locale}
            className="rounded-full bg-leaf-soft px-3 py-1 font-medium text-leaf-dark"
          >
            {LOCALE_NAMES[locale]}
          </span>
        ) : (
          <a
            key={locale}
            href={locale === "en" ? "/en" : localePath(locale, "/")}
            hrefLang={locale}
            lang={locale}
            onClick={(event) => switchTo(event, locale)}
            className="rounded-full px-3 py-1 text-muted hover:bg-leaf-soft hover:text-ink"
          >
            {LOCALE_NAMES[locale]}
          </a>
        ),
      )}
    </nav>
  );
}
