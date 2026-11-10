"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { imageUrl } from "@/lib/image-url";
import { MAX_QUERY_LENGTH, normaliseQuery, SUGGESTION_LIMIT, type PlantSuggestion } from "@/lib/search";

/**
 * Header search box. Suggestions appear as you type; picking one opens that
 * plant. Enter opens the results page, or the plant itself when there is
 * only one match. Without JavaScript the form still submits to /search.
 */
export function PlantSearch({ locale, className = "" }: { locale: Locale; className?: string }) {
  const t = getDictionary(locale).search;
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlantSuggestion[]>([]);
  const [resultsFor, setResultsFor] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const pointer = useRef({ x: -1, y: -1 });

  // Highlight on real pointer movement only, so a list that appears under a
  // resting cursor doesn't steal the keyboard selection.
  function hover(event: PointerEvent, index: number) {
    const { clientX: x, clientY: y } = event;
    if (x === pointer.current.x && y === pointer.current.y) return;
    pointer.current = { x, y };
    setActive(index);
  }

  const trimmed = normaliseQuery(query);
  const searchPath = localePath(locale, "/search");
  const showSeeAll = results.length >= SUGGESTION_LIMIT;
  const optionCount = results.length + (showSeeAll ? 1 : 0);
  const expanded = open && trimmed !== "" && resultsFor !== "";

  useEffect(() => {
    if (!trimmed) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: trimmed, lang: locale });
        const response = await fetch(`/api/plants/search?${params}`, { signal: controller.signal });
        if (!response.ok) return;
        setResults(await response.json());
        setResultsFor(trimmed);
        setActive(-1);
      } catch {
        // Aborted by newer typing, or offline: keep the last suggestions.
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, locale]);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    setResultsFor("");
    (document.activeElement as HTMLElement | null)?.blur();
    router.push(href);
  }

  function choose(index: number) {
    if (index < results.length) navigate(localePath(locale, `/plants/${results[index].slug}`));
    else navigate(`${searchPath}?${new URLSearchParams({ q: trimmed })}`);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmed) return;
    if (active >= 0 && expanded) return choose(active);
    // Suggestions already answer this query: skip the results page.
    if (resultsFor === trimmed && (results.length === 1 || results[0]?.exact)) return choose(0);
    navigate(`${searchPath}?${new URLSearchParams({ q: trimmed })}`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (optionCount === 0) return;
      event.preventDefault();
      setOpen(true);
      // Positions run -1 (the text box) to optionCount - 1, wrapping round.
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => ((current + 1 + step + optionCount + 1) % (optionCount + 1)) - 1);
    } else if (event.key === "Escape") {
      // Chrome clears search inputs on Escape; close the list first instead.
      event.preventDefault();
      if (expanded) setOpen(false);
      else setQuery("");
      setActive(-1);
    }
  }

  const optionId = (index: number) => `${id}-option-${index}`;
  const announce = resultsFor === trimmed && trimmed ? t.suggestions(results.length) : "";

  return (
    <form role="search" action={searchPath} onSubmit={onSubmit} className={`relative ${className}`}>
      <label htmlFor={`${id}-input`} className="sr-only">
        {t.label}
      </label>
      {/* The focus ring goes on the rounded field, not the bare input inside it. */}
      <div className="flex items-center rounded-full border border-line bg-card focus-within:border-leaf focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-leaf">
        <svg aria-hidden viewBox="0 0 20 20" className="ml-3 h-4 w-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="m13 13 4 4" strokeLinecap="round" />
        </svg>
        <input
          id={`${id}-input`}
          name="q"
          type="search"
          role="combobox"
          autoComplete="off"
          enterKeyHint="search"
          maxLength={MAX_QUERY_LENGTH}
          placeholder={t.placeholder}
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (!normaliseQuery(event.target.value)) {
              setResults([]);
              setResultsFor("");
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className="w-full min-w-0 bg-transparent py-2 pl-2 pr-4 text-sm outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        <button type="submit" className="sr-only">
          {t.submit}
        </button>
      </div>

      <div
        className={`absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-line bg-card shadow-lg ${expanded ? "" : "hidden"}`}
      >
        <ul id={listId} role="listbox" aria-label={t.label}>
          {results.map((plant, index) => (
            <li
              key={plant.slug}
              id={optionId(index)}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => event.preventDefault()}
              onPointerMove={(event) => hover(event, index)}
              onClick={() => choose(index)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${index === active ? "bg-leaf-soft" : ""}`}
            >
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-leaf-soft">
                {plant.imageAdult ? (
                  <Image src={imageUrl(plant.imageAdult)} alt="" fill sizes="36px" className="object-cover" />
                ) : (
                  <span aria-hidden className="flex h-full items-center justify-center font-display text-leaf">
                    {plant.name.charAt(0)}
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{plant.name}</span>
                {plant.otherName && (
                  <span lang="en" className="block truncate text-xs text-muted">
                    {plant.otherName}
                  </span>
                )}
              </span>
            </li>
          ))}
          {showSeeAll && (
            <li
              id={optionId(results.length)}
              role="option"
              aria-selected={active === results.length}
              onMouseDown={(event) => event.preventDefault()}
              onPointerMove={(event) => hover(event, results.length)}
              onClick={() => choose(results.length)}
              className={`cursor-pointer border-t border-line px-3 py-2 text-sm text-leaf ${active === results.length ? "bg-leaf-soft" : ""}`}
            >
              {t.seeAll(trimmed)}
            </li>
          )}
        </ul>
        {results.length === 0 && <p className="px-3 py-2 text-sm text-muted">{t.suggestions(0)}</p>}
      </div>
      <p role="status" className="sr-only">
        {announce}
      </p>
    </form>
  );
}
