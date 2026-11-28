"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { COMMUNITY_PAGE_SIZE, WAVEFORM_SRC, communityCard, tabOf, type CommunityTab } from "@/data/community";
import { simBehaviorLabel } from "@/data/sim-behaviors";
import { ROBOT_TYPES } from "@/data/robot-types";
import { STRINGS, fmt } from "@/data/strings";
import type { RobotType, UserDataMotion } from "@/lib/models";
import { recipePlayer } from "@/lib/expression/sample";
import { api } from "@/lib/ui/api";
import { Icon } from "@/components/ui/icons/icon";
import { EmptyState, Loading } from "@/components/ui/states";
import { FilterMenu } from "../../_components/lab-home";

const U = STRINGS.community;

export const behaviorLabel = simBehaviorLabel;

/** "4.8K uses" (Figma) — thousands compact, smaller numbers as they are. */
export const usesLabel = (n: number) => fmt(U.uses, { n: n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n });

/** One pass of the motion's preview recipe, "5.8s". */
export function motionSeconds(m: UserDataMotion): string {
  const d = recipePlayer(m.preview).duration;
  return Number.isFinite(d) ? `${d.toFixed(1)}s` : "∞";
}

// Community list (User Data; cards from Figma 943:1134) in the Lab home v2 style (1095:6556): canvas + glow, title 60, glass
// filters (Show: All / Popular / Recently via ?tab=, Robot) and search, white hairline motion cards, five per row, More.
// The tab (All / Popular / Recently) is picked in the sidebar sub-nav (?tab=).
export function CommunityBrowser() {
  const router = useRouter();
  const tab = tabOf(useSearchParams().get("tab"));
  const [q, setQ] = useState("");
  const [robot, setRobot] = useState<RobotType>("joint-fixed");
  const [items, setItems] = useState<UserDataMotion[] | null>(null);
  const [shown, setShown] = useState(COMMUNITY_PAGE_SIZE);

  useEffect(() => {
    const params = new URLSearchParams({ tab, ...(q.trim() ? { q: q.trim() } : {}) });
    // A response for an older query that arrives late must not replace the newer one.
    let stale = false;
    const timer = setTimeout(() => api<UserDataMotion[]>(`/api/user-data?${params}`).then((r) => !stale && setItems(r), () => !stale && setItems([])), 150);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [tab, q]);

  useEffect(() => setShown(COMMUNITY_PAGE_SIZE), [tab, q, robot]);

  // Every community motion is recorded on PURE Desk (Joint Fixed); other robot types have none yet.
  const list = robot === "joint-fixed" ? items : [];

  return (
    <div data-fit-frame className="relative overflow-x-clip flex flex-col gap-[var(--space-40)] px-[var(--space-40)] py-[42px] leading-normal">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/lab/home/glow.svg" alt="" aria-hidden className="pointer-events-none absolute left-[26px] top-[-360px] h-[680px] w-[1360px] max-w-none" />

      <header className="relative flex flex-col gap-[var(--space-20)]">
        <div className="flex w-full items-center gap-[var(--space-12)]">
          <h1 className="text-[60px] font-semibold text-[var(--home-ink)]">{STRINGS.sidebar.userData}</h1>
        </div>
        <div className="flex w-full items-center gap-[var(--space-12)]">
          <label className="flex h-[44px] w-[420px] items-center gap-[10px] rounded-[var(--radius-sm)] bg-[var(--home-glass)] px-[var(--space-16)]">
            <Icon name="search-18" size={18} className="shrink-0 text-[var(--home-ink-3)]" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={U.search}
              aria-label={U.search}
              className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--home-ink)] outline-none placeholder:text-[var(--home-ink-3)]"
            />
          </label>
          <span className="flex-1" />
          <FilterMenu
            label={U.filters.tab}
            value={U.tabs[tab]}
            items={(Object.keys(U.tabs) as CommunityTab[]).map((t) => ({
              label: U.tabs[t],
              onSelect: () => router.replace(t === "all" ? "/lab/community" : `/lab/community?tab=${t}`, { scroll: false }),
            }))}
          />
          <FilterMenu
            label={U.filters.robot}
            value={ROBOT_TYPES.find((t) => t.id === robot)?.name ?? ""}
            items={ROBOT_TYPES.map((t) => ({ label: t.name, onSelect: () => setRobot(t.id) }))}
          />
        </div>
      </header>

      {list === null ? (
        <Loading label={STRINGS.common.loading} />
      ) : list.length === 0 ? (
        <EmptyState icon="search" title={items?.length ? U.noRobotType : U.noResults} />
      ) : (
        <>
          <div className="relative grid grid-cols-5 gap-x-[16.483px] gap-y-[22px]">
            {list.slice(0, shown).map((m) => (
              <MotionCard key={m.id} motion={m} />
            ))}
          </div>
          {list.length > shown && (
            <button
              type="button"
              onClick={() => setShown((n) => n + COMMUNITY_PAGE_SIZE)}
              className="flex h-[44px] items-center gap-[var(--space-8)] self-center rounded-[var(--radius-sm)] bg-[var(--home-glass)] px-[var(--space-20)] text-[15px] font-medium text-[var(--home-ink)] hover:bg-[var(--neutral-0)]"
            >
              <Icon name="chevron-down-16" size={16} />
              {U.more}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Card (Motion/Greet 943:1136), scaled to ~0.85 for five per row (user review): column-wide × 370, white with a hairline like the
// Lab cards (Figma gradient #edeef0 → #f3f4f6); name 20 semibold + uses 15 at 24,22; icons top right; art 270×262 at y 70;
// waveform at 18,330 and duration at the right.
// Hover / focus = the selected state (Motion/Look around 943:1497): sage gradient, ~1.09× larger, sound on.
function MotionCard({ motion: m }: { motion: UserDataMotion }) {
  const card = communityCard(m);
  return (
    <Link
      href={`/lab/community/${m.id}`}
      data-testid="motion-card"
      className="group relative h-[370px] min-w-0 overflow-hidden rounded-[var(--radius-lg)] border-[0.749px] border-[var(--home-line)] bg-[var(--neutral-0)] transition-transform duration-[var(--motion-base)] ease-[var(--ease-standard)] hover:z-10 hover:scale-[1.09] hover:bg-[linear-gradient(to_bottom,var(--community-card-selected)_39.85%,var(--community-card-selected-end))] focus-visible:z-10 focus-visible:scale-[1.09] focus-visible:bg-[linear-gradient(to_bottom,var(--community-card-selected)_39.85%,var(--community-card-selected-end))]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={card.art} alt="" aria-hidden className="pointer-events-none absolute left-1/2 top-[70px] h-[262px] w-[270px] max-w-none -translate-x-1/2" />
      <div className="absolute left-[24px] right-[76px] top-[22px] flex flex-col">
        <span className="truncate text-[20px] font-semibold leading-[26px] tracking-[-0.4px] text-[var(--neutral-800)]">{m.name}</span>
        <span className="text-[15px] leading-[26px] tracking-[-0.3px] text-[var(--neutral-1000)] opacity-50">{usesLabel(m.uses)}</span>
      </div>
      <div className="absolute right-[22px] top-[22px] flex items-center gap-[var(--space-12)] text-[var(--neutral-600)]">
        <Icon name="inbox-in" size={20} />
        {card.wave && (
          <>
            <Icon name="volume-cross" size={20} label={U.noSound} className="group-hover:hidden group-focus-visible:hidden" />
            <Icon name="volume-loud" size={20} label={U.sound} className="hidden group-hover:block group-focus-visible:block" />
          </>
        )}
      </div>
      <div className="absolute left-[18px] right-[56px] top-[330px] flex h-[20px] items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={WAVEFORM_SRC[card.wave ?? "flat"]} alt="" aria-hidden className="block w-[200px] max-w-full -scale-x-100" />
      </div>
      <span className="absolute right-[18px] top-[324px] text-[14px] leading-[32px] tracking-[-0.28px] text-[var(--neutral-1000)] opacity-50">{motionSeconds(m)}</span>
    </Link>
  );
}
