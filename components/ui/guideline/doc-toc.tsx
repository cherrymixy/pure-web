"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GuidelineSearchItem } from "@/data/guideline";
import { searchGuideline } from "@/lib/ui/guideline-search";

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
      className={`w-fit hover:text-[var(--text-primary)] ${
        it.id === active ? (sub ? "font-semibold text-[var(--sage-200)]" : "font-semibold text-[var(--text-primary)]") : sub ? "font-light text-[var(--text-tertiary)]" : "text-[var(--text-tertiary)]"
      }`}
    >
      {sub ? `-${it.label}` : it.label}
    </a>
  );
  return (
    <div className="flex flex-col gap-[26px] leading-normal">
      <label className="flex items-center gap-[var(--space-12)] rounded-[var(--radius-full)] bg-[var(--neutral-200)] px-[var(--space-24)] py-[var(--space-12)]">
        <img src="/figma/guideline/icons/search.svg" alt="" width={19.92} height={19.92} className="shrink-0" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQ("")}
          placeholder={searchLabel}
          aria-label={searchLabel}
          className="min-w-0 flex-1 bg-transparent text-[16px] text-[var(--text-primary)] outline-none placeholder:text-[var(--sage-500)] placeholder:opacity-50"
        />
      </label>
      {results ? (
        <nav aria-label={resultsLabel} className="flex flex-col gap-[14px] text-[16px]">
          {results.map((r) => (
            <Link key={r.href} href={r.href} onClick={() => setQ("")} className="flex w-fit flex-col gap-[2px] hover:text-[var(--text-primary)]">
              <span className="text-[var(--text-primary)]">{r.title}</span>
              {r.section && <span className="text-[12px] text-[var(--text-tertiary)]">{r.section}</span>}
            </Link>
          ))}
          {!results.length && <span className="text-[var(--text-tertiary)]">{emptyLabel}</span>}
        </nav>
      ) : pages ? (
        <nav aria-label={title} className="flex flex-col gap-[14px] text-[16px]">
          {pages.map((p) =>
            p.current ? (
              <div key={p.href} className="flex flex-col gap-[14px]">
                <a href="#top" aria-current="page" className="w-fit font-semibold text-[var(--text-primary)]">{p.label}</a>
                <div className="flex flex-col gap-[7px] pl-[11px] text-[14px]">{items.map((it) => tocLink(it, true))}</div>
              </div>
            ) : (
              <Link key={p.href} href={p.href} className="w-fit text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">{p.label}</Link>
            ),
          )}
        </nav>
      ) : (
        <nav aria-label={title} className="flex flex-col gap-[14px] text-[16px]">
          {items.map((it) => tocLink(it, false))}
        </nav>
      )}
    </div>
  );
}
