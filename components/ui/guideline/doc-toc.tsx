"use client";

import { useEffect, useState } from "react";

export interface TocItem {
  id: string;
  label: string;
}

/** Search (808:1580) + On this page (808:1277…1283): the search narrows the list, links jump to sections, the one in view is bold. */
export function DocToc({ title, searchLabel, emptyLabel, items }: { title: string; searchLabel: string; emptyLabel: string; items: TocItem[] }) {
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

  const shown = items.filter((it) => it.label.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="flex flex-col gap-[26px] leading-normal">
      <label className="flex items-center gap-[var(--space-12)] rounded-[var(--radius-full)] bg-[var(--neutral-200)] px-[var(--space-24)] py-[var(--space-12)]">
        <img src="/figma/guideline/icons/search.svg" alt="" width={19.92} height={19.92} className="shrink-0" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchLabel}
          aria-label={searchLabel}
          className="min-w-0 flex-1 bg-transparent text-[16px] text-[var(--text-primary)] outline-none placeholder:text-[var(--sage-500)] placeholder:opacity-50"
        />
      </label>
      <nav aria-label={title} className="flex flex-col gap-[14px] text-[16px]">
        {shown.map((it) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            aria-current={it.id === active ? "location" : undefined}
            className={`w-fit hover:text-[var(--text-primary)] ${it.id === active ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}`}
          >
            {it.label}
          </a>
        ))}
        {!shown.length && <span className="text-[var(--text-tertiary)]">{emptyLabel}</span>}
      </nav>
    </div>
  );
}
