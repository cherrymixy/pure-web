"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GuidelineSearchItem } from "@/data/guideline";
import { searchGuideline } from "@/lib/ui/guideline-search";
import { Icon } from "../icons/icon";

// Lab style (same as the section-page rail): small header, nav rows 15 / sub rows 14, current = #eef1f4 + ink medium.
const HEAD = "px-[var(--space-12)] pb-[6px] text-[12px] font-medium text-[var(--home-ink-3)]";

export interface TocItem {
  id: string;
  label: string;
}

/** Search (808:1580) + On this page (808:1277…1283): the search looks through the whole guideline (results replace the list while typing); links jump to sections, the one in view is bold. */
export interface TocPage {
  label: string;
  href: string;
  current?: boolean;
}

/** pages: sibling documents (Face 808:1657…1665) — the current one is bold and lists this page's sections under it. */
export function DocToc({
  title,
  searchLabel,
  emptyLabel,
  resultsLabel,
  items,
  pages,
  index,
}: {
  title: string;
  searchLabel: string;
  emptyLabel: string;
  resultsLabel: string;
  items: TocItem[];
  pages?: TocPage[];
  index: GuidelineSearchItem[];
}) {
  const [active, setActive] = useState(items[0]?.id);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onScroll = () => {
      // Last anchor whose top has passed the top fifth of the viewport.
      let current = items[0]?.id;
      for (const it of items) {
        const el = document.getElementById(it.id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight / 5) current = it.id;
      }
      // At the bottom of the page the last sections can't reach the threshold.
      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) current = items[items.length - 1]?.id;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  const results = useMemo(() => searchGuideline(index, q), [index, q]);
  const tocLink = (it: TocItem, sub: boolean) => (
    <a
      key={it.id}
      href={`#${it.id}`}
      aria-current={it.id === active ? "location" : undefined}
      className={`rounded-[10px] px-[var(--space-12)] py-[7px] hover:bg-[var(--home-nav-on)] ${
        it.id === active ? "bg-[var(--home-nav-on)] font-medium text-[var(--home-ink)]" : "text-[var(--home-ink-2)]"
      }`}
    >
      {it.label}
    </a>
  );
  return (
    <div className="flex flex-col gap-[var(--space-16)] leading-normal">
      <label className="flex h-[44px] items-center gap-[10px] rounded-[var(--radius-sm)] bg-[var(--home-glass)] px-[var(--space-16)]">
        <Icon name="search-18" size={18} className="shrink-0 text-[var(--home-ink-3)]" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQ("")}
          placeholder={searchLabel}
          aria-label={searchLabel}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--home-ink)] outline-none placeholder:text-[var(--home-ink-3)]"
        />
      </label>
      {results ? (
        <nav aria-label={resultsLabel} className="flex flex-col gap-[2px] text-[15px]">
          <p className={HEAD}>{resultsLabel}</p>
          {results.map((r) => (
            <Link key={r.href} href={r.href} onClick={() => setQ("")} className="flex flex-col gap-[2px] rounded-[10px] px-[var(--space-12)] py-[7px] hover:bg-[var(--home-nav-on)]">
              <span className="text-[var(--home-ink)]">{r.title}</span>
              {r.section && <span className="text-[12px] text-[var(--home-ink-3)]">{r.section}</span>}
            </Link>
          ))}
          {!results.length && <span className="px-[var(--space-12)] text-[14px] text-[var(--home-ink-3)]">{emptyLabel}</span>}
        </nav>
      ) : pages ? (
        <nav aria-label={title} className="flex flex-col gap-[2px] text-[15px]">
          {pages.map((p) =>
            p.current ? (
              <div key={p.href} className="flex flex-col gap-[2px]">
                <a href="#top" aria-current="page" className="rounded-[10px] px-[var(--space-12)] py-[7px] font-medium text-[var(--home-ink)] hover:bg-[var(--home-nav-on)]">{p.label}</a>
                <div className="ml-[21px] flex flex-col gap-[2px] border-l border-[var(--home-line)] pl-[var(--space-8)] text-[14px]">{items.map((it) => tocLink(it, true))}</div>
              </div>
            ) : (
              <Link key={p.href} href={p.href} className="rounded-[10px] px-[var(--space-12)] py-[7px] text-[var(--home-ink-2)] hover:bg-[var(--home-nav-on)]">{p.label}</Link>
            ),
          )}
        </nav>
      ) : (
        <nav aria-label={title} className="flex flex-col gap-[2px] text-[15px]">
          <p className={HEAD}>{title}</p>
          {items.map((it) => tocLink(it, false))}
        </nav>
      )}
    </div>
  );
}
