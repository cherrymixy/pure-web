"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { COMMUNITY_PAGE_SIZE, WAVEFORM_SRC, communityCard, tabOf } from "@/data/community";
import { COMPONENTS } from "@/data/components";
import { ROBOT_TYPES } from "@/data/robot-types";
import { STRINGS, fmt } from "@/data/strings";
import type { RobotType, UserDataMotion } from "@/lib/models";
import { recipePlayer } from "@/lib/expression/sample";
import { api } from "@/lib/ui/api";
import { Icon } from "@/components/ui/icons/icon";
import { EmptyState, Loading } from "@/components/ui/states";

const U = STRINGS.community;

export const behaviorLabel = (id: string) => COMPONENTS.find((c) => c.id === id)?.label ?? id;

/** "4.8K uses" (Figma) — thousands compact, smaller numbers as they are. */
export const usesLabel = (n: number) => fmt(U.uses, { n: n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n });

/** One pass of the motion's preview recipe, "5.8s". */
export function motionSeconds(m: UserDataMotion): string {
  const d = recipePlayer(m.preview).duration;
  return Number.isFinite(d) ? `${d.toFixed(1)}s` : "∞";
}

// Community list (Figma 943:1134 "01 · Look around (selected)"): white 75% panel next to the lab sidebar —
// breadcrumb, tab title + count, search pill with robot type, 318×435 motion cards (auto-fill), More.
// The tab (All / Popular / Recently) is picked in the sidebar sub-nav (?tab=).
export function CommunityBrowser() {
  const tab = tabOf(useSearchParams().get("tab"));
  const [q, setQ] = useState("");
  const [robot, setRobot] = useState<RobotType>("joint-fixed");
  const [items, setItems] = useState<UserDataMotion[] | null>(null);
  const [shown, setShown] = useState(COMMUNITY_PAGE_SIZE);

  useEffect(() => {
    const params = new URLSearchParams({ tab, ...(q.trim() ? { q: q.trim() } : {}) });
    const timer = setTimeout(() => api<UserDataMotion[]>(`/api/user-data?${params}`).then(setItems, () => setItems([])), 150);
    return () => clearTimeout(timer);
  }, [tab, q]);

  useEffect(() => setShown(COMMUNITY_PAGE_SIZE), [tab, q, robot]);

  // Every community motion is recorded on PURE Desk (Joint Fixed); other robot types have none yet.
  const list = robot === "joint-fixed" ? items : [];
  const libraries = new Set(items?.map((m) => m.category)).size;

  return (
    <div className="flex min-h-[var(--app-vh)] py-[var(--space-32)] pl-[31px] pr-[var(--space-32)]">
      <section className="flex min-w-0 flex-1 flex-col rounded-[var(--radius-xl)] border border-[var(--bg-surface)] bg-[var(--community-panel)] pb-[var(--space-32)] pl-[69px] pr-[67px] pt-[62px]">
        <header className="flex flex-wrap items-end justify-between gap-[var(--space-24)] pl-[2px]">
          <div className="flex flex-col">
            <span className="text-[14px] font-medium leading-[21px] text-[var(--text-primary)]">{fmt(U.breadcrumb, { tab: U.tabs[tab] })}</span>
            <h1 className="mt-[26px] text-[60px] font-semibold leading-[43px] text-[var(--text-primary)]">{U.tabs[tab]}</h1>
            <p className="mt-[28px] text-[18px] leading-[27px] text-[var(--text-secondary)]">
              {fmt(U.summary, { n: list?.length ?? 0, m: libraries })}
            </p>
          </div>
          <div className="flex h-[64px] w-[851px] max-w-full items-center gap-[10px] rounded-[var(--radius-full)] bg-[var(--community-pill)] px-[var(--space-24)]">
            <Icon name="search" size={20} className="shrink-0 text-[var(--neutral-800)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={U.search}
              aria-label={U.search}
              className="min-w-0 flex-1 bg-transparent text-[16px] leading-[28px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
            />
            <label className="relative flex shrink-0 items-center gap-[15px] text-[var(--neutral-800)]">
              <Icon name="robot-arm" size={28} className="shrink-0" />
              <select
                value={robot}
                onChange={(e) => setRobot(e.target.value as RobotType)}
                aria-label={U.robotType}
                className="cursor-pointer appearance-none bg-transparent pr-[31px] text-[18.9px] leading-[28px] text-[var(--neutral-800)] outline-none"
              >
                {ROBOT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <Icon name="caret-up" size={14} className="pointer-events-none absolute right-0 rotate-180 text-[var(--text-tertiary)]" />
            </label>
          </div>
        </header>

        {list === null ? (
          <Loading label={STRINGS.common.loading} />
        ) : list.length === 0 ? (
          <EmptyState icon="search" title={items?.length ? U.noRobotType : U.noResults} />
        ) : (
          <>
            <div className="mt-[122px] grid grid-cols-[repeat(auto-fill,minmax(318px,1fr))] gap-x-[43px] gap-y-[40px]">
              {list.slice(0, shown).map((m) => (
                <MotionCard key={m.id} motion={m} />
              ))}
            </div>
            {list.length > shown && (
              <button
                type="button"
                onClick={() => setShown((n) => n + COMMUNITY_PAGE_SIZE)}
                className="mt-[62px] flex h-[59px] items-center gap-[10px] self-center rounded-[var(--radius-full)] bg-[var(--community-pill)] px-[30px] text-[18px] leading-[28px] text-[var(--neutral-800)] hover:bg-[var(--neutral-150)]"
              >
                <Icon name="chevron-down" size={24} />
                {U.more}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}

// Card (Motion/Greet 943:1136): 318×435, gradient #edeef0 → #f3f4f6; name 24 semibold + uses 18.6 at 30,27; face · sound icons
// top right; art box 318×308 at y 84; waveform 238 wide at 20,388 and duration at the right.
// Hover / focus = the selected state (Motion/Look around 943:1497): sage gradient, ~1.09× larger, sound on.
function MotionCard({ motion: m }: { motion: UserDataMotion }) {
  const card = communityCard(m);
  return (
    <Link
      href={`/lab/community/${m.id}`}
      data-testid="motion-card"
      className="group relative h-[435px] overflow-hidden rounded-[var(--radius-lg)] bg-[linear-gradient(to_bottom,var(--community-card-top),var(--community-card-bottom))] transition-transform duration-[var(--motion-base)] ease-[var(--ease-standard)] hover:z-10 hover:scale-[1.09] hover:bg-[linear-gradient(to_bottom,var(--community-card-selected)_39.85%,var(--community-card-selected-end))] focus-visible:z-10 focus-visible:scale-[1.09] focus-visible:bg-[linear-gradient(to_bottom,var(--community-card-selected)_39.85%,var(--community-card-selected-end))]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={card.art} alt="" aria-hidden className="pointer-events-none absolute left-1/2 top-[84px] h-[308px] w-[318px] max-w-none -translate-x-1/2" />
      <div className="absolute left-[30px] right-[90px] top-[27px] flex flex-col">
        <span className="truncate text-[24px] font-semibold leading-[30px] tracking-[-0.48px] text-[var(--neutral-800)]">{m.name}</span>
        <span className="text-[18.6px] leading-[32.5px] tracking-[-0.37px] text-[var(--neutral-1000)] opacity-50">{usesLabel(m.uses)}</span>
      </div>
      <div className="absolute right-[26px] top-[26px] flex items-center gap-[var(--space-16)] text-[var(--neutral-600)]">
        <Icon name="inbox-in" size={24} />
        {card.wave && (
          <>
            <Icon name="volume-cross" size={24} label={U.noSound} className="group-hover:hidden group-focus-visible:hidden" />
            <Icon name="volume-loud" size={24} label={U.sound} className="hidden group-hover:block group-focus-visible:block" />
          </>
        )}
      </div>
      <div className="absolute left-[20px] right-[60px] top-[388px] flex h-[20px] items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={WAVEFORM_SRC[card.wave ?? "flat"]} alt="" aria-hidden className="block w-[238px] max-w-full -scale-x-100" />
      </div>
      <span className="absolute right-[20px] top-[382px] text-[16px] leading-[32.5px] tracking-[-0.32px] text-[var(--neutral-1000)] opacity-50">{motionSeconds(m)}</span>
    </Link>
  );
}
