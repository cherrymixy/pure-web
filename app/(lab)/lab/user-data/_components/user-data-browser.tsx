"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COMPONENTS } from "@/data/components";
import { referenceSetFor } from "@/data/reference-sets";
import { STRINGS, fmt } from "@/data/strings";
import { USER_DATA_CATEGORIES, type UserDataMotion } from "@/lib/models";
import { api } from "@/lib/ui/api";
import { Chip, FIELD_BOX, FIELD_INPUT } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icons/icon";
import { EmptyState, Loading } from "@/components/ui/states";

const U = STRINGS.userData;
type Tab = "all" | "popular" | "recent" | "uploaded";

/** Card art: the face image of the reference set for the motion's first behavior (data/reference-sets.ts). */
export function motionFace(m: UserDataMotion): string | undefined {
  const first = m.preview.steps[0]?.behavior;
  return first ? referenceSetFor(first)?.items.find((it) => it.channel === "face")?.file : undefined;
}

export const behaviorLabel = (id: string) => COMPONENTS.find((c) => c.id === id)?.label ?? id;

// W04-1~3: browse motions (tabs, categories, search), cards → detail, no results.
// No Figma frame: lab-home language (W02A-1 ×2 paddings, 3-col cards 30 gap, radius 2xl) with DS Chip / Text Field.
export function UserDataBrowser() {
  const [tab, setTab] = useState<Tab>("all");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<UserDataMotion[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ tab, ...(category ? { category } : {}), ...(q.trim() ? { q: q.trim() } : {}) });
    const timer = setTimeout(() => api<UserDataMotion[]>(`/api/user-data?${params}`).then(setItems, () => setItems([])), 150);
    return () => clearTimeout(timer);
  }, [tab, category, q]);

  return (
    <div className="flex flex-col gap-[29px] pb-[var(--space-32)] pl-[33px] pr-[var(--space-32)] pt-[49px]">
      <h1 className="sr-only">{U.title}</h1>
      <div className="flex flex-col gap-[var(--space-16)]">
        <header className="flex h-[56px] items-center justify-between gap-[var(--space-24)]">
          <div className="flex items-center gap-[var(--space-8)]" role="group" aria-label={U.title}>
            {(Object.keys(U.tabs) as Tab[]).map((t) => (
              <Chip key={t} selected={tab === t} onClick={() => setTab(t)}>
                {U.tabs[t]}
              </Chip>
            ))}
          </div>
          <label className={`${FIELD_BOX} w-[400px] bg-[var(--bg-surface)]`}>
            <Icon name="search" size={20} className="shrink-0 text-[var(--icon-secondary)]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={U.search} aria-label={U.search} className={FIELD_INPUT} />
          </label>
        </header>
        <div className="flex flex-wrap items-center gap-[var(--space-8)]" role="group" aria-label="Category">
          <Chip size="S" selected={category === ""} onClick={() => setCategory("")}>
            {U.allCategories}
          </Chip>
          {USER_DATA_CATEGORIES.map((c) => (
            <Chip key={c} size="S" selected={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      {items === null ? (
        <Loading label={STRINGS.common.loading} />
      ) : items.length === 0 ? (
        <EmptyState icon="search" title={U.noResults} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(498px,1fr))] gap-[30px]">
          {items.map((m) => (
            <MotionCard key={m.id} motion={m} />
          ))}
        </div>
      )}
    </div>
  );
}

// Card: lab-home ProjectCard frame (1px neutral/300, radius 2xl, title 24 semibold sage/800, meta 18 neutral/700, sage/50 pill).
function MotionCard({ motion: m }: { motion: UserDataMotion }) {
  const face = motionFace(m);
  const steps = m.preview.steps.map((s) => behaviorLabel(s.behavior)).join(" → ");
  return (
    <Link
      href={`/lab/user-data/${m.id}`}
      data-testid="motion-card"
      className="flex flex-col gap-[var(--space-24)] overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--neutral-300)] bg-[var(--bg-surface)] p-[var(--space-24)] pt-[31px] hover:border-[var(--neutral-500)]"
    >
      <div className="flex items-start justify-between gap-[var(--space-12)] px-[var(--space-8)]">
        <div className="flex min-w-0 flex-col gap-[6px]">
          <span className="truncate text-[24px] font-semibold leading-[30px] text-[var(--sage-800)]">{m.name}</span>
          <span className="text-[18px] leading-[22px] text-[var(--neutral-700)]">{fmt(U.uses, { n: m.uses })}</span>
        </div>
        <Icon name="running-round" size={25} label={STRINGS.editor.tabs.motion} className="shrink-0 text-[var(--neutral-400)]" />
      </div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-canvas)]">
        {face ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={face} alt="" aria-hidden className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-[var(--icon-secondary)]">
            <Icon name="motion" size={48} />
          </span>
        )}
      </div>
      <div className="flex items-center gap-[var(--space-8)] px-[var(--space-8)]">
        <span className="rounded-[var(--radius-lg)] bg-[var(--sage-50)] px-[var(--space-16)] py-[var(--space-12)] text-[18px] leading-[22px] text-[var(--text-primary)]">{m.category}</span>
        {m.preview.steps.length > 1 && <span className="min-w-0 truncate text-[16px] leading-[20px] text-[var(--text-secondary)]">{steps}</span>}
        {m.source === "user" && (
          <span className="rounded-[var(--radius-lg)] border border-[var(--neutral-300)] px-[var(--space-16)] py-[11px] text-[18px] leading-[22px] text-[var(--text-link)]">{U.tabs.uploaded}</span>
        )}
      </div>
    </Link>
  );
}
