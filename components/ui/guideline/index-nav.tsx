"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GuidelineSearchItem } from "@/data/guideline";
import { STRINGS } from "@/data/strings";
import { searchGuideline } from "@/lib/ui/guideline-search";
import { Icon } from "../icons/icon";

const G = STRINGS.guideline;
const ROW = "flex w-full flex-col gap-[2px] rounded-[10px] px-[var(--space-12)] py-[9px] text-[15px] leading-normal";

/** Right rail of the Lab-style section page: guideline search (results replace the list) + the section list, current one selected. */
export function IndexNav({ pages, index }: { pages: { label: string; href: string; current?: boolean }[]; index: GuidelineSearchItem[] }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => searchGuideline(index, q), [index, q]);
  return (
    <div className="flex flex-col gap-[var(--space-16)]">
      <label className="flex h-[44px] items-center gap-[10px] rounded-[var(--radius-sm)] bg-[var(--home-glass)] px-[var(--space-16)]">
        <Icon name="search-18" size={18} className="shrink-0 text-[var(--home-ink-3)]" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQ("")}
          placeholder={G.searchPlaceholder}
          aria-label={G.search}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--home-ink)] outline-none placeholder:text-[var(--home-ink-3)]"
        />
      </label>
      <nav aria-label={results ? G.searchResults : G.sections} className="flex flex-col gap-[2px]">
        <p className="px-[var(--space-12)] pb-[6px] text-[12px] font-medium text-[var(--home-ink-3)]">{results ? G.searchResults : G.sections}</p>
        {results ? (
          <>
            {results.map((r) => (
              <Link key={r.href} href={r.href} onClick={() => setQ("")} className={`${ROW} hover:bg-[var(--home-nav-on)]`}>
                <span className="text-[var(--home-ink)]">{r.title}</span>
                {r.section && <span className="text-[12px] text-[var(--home-ink-3)]">{r.section}</span>}
              </Link>
            ))}
            {!results.length && <span className="px-[var(--space-12)] text-[14px] text-[var(--home-ink-3)]">{G.noMatch}</span>}
          </>
        ) : (
          pages.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              aria-current={p.current ? "page" : undefined}
              className={`${ROW} ${p.current ? "bg-[var(--home-nav-on)] font-medium text-[var(--home-ink)]" : "text-[var(--home-ink-2)] hover:bg-[var(--home-nav-on)]"}`}
            >
              {p.label}
            </Link>
          ))
        )}
      </nav>
    </div>
  );
}
