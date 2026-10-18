"use client";

import { useEffect, useState } from "react";

export interface TocItem {
  id: string;
  label: string;
  level: 0 | 1;
}

/** "On this page" (Figma W03-4 목차 550:2884): anchors to page sections, the one in view is highlighted. */
export function DocToc({ title, items }: { title: string; items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id);

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

  return (
    <nav aria-label={title} className="flex flex-col gap-[var(--space-12)] text-[14px] leading-normal">
      <span className="font-medium text-[var(--text-tertiary)]">{title}</span>
      {items.map((it) => (
        <a
          key={it.id}
          href={`#${it.id}`}
          aria-current={it.id === active ? "location" : undefined}
          className={`w-fit hover:text-[var(--text-primary)] ${it.level ? "pl-[var(--space-16)]" : ""} ${
            it.id === active ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
          }`}
        >
          {it.label}
        </a>
      ))}
    </nav>
  );
}
