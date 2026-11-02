"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LIBRARY as L } from "@/data/library";
import { WAVEFORM_SRC, communityCard } from "@/data/community";
import { SIMREADY_ASSETS, SIMREADY_BASE, SIMREADY_CREDIT } from "@/data/simready-assets";
import { STRINGS, fmt } from "@/data/strings";
import type { UserDataMotion } from "@/lib/models";
import { api } from "@/lib/ui/api";
import { Icon } from "@/components/ui/icons/icon";
import { Loading } from "@/components/ui/states";
import { motionSeconds, usesLabel } from "@/app/(lab)/lab/community/_components/community-browser";

const U = STRINGS.community;

// Library tab (Figma 451:1595, panel 430 wide, content x 21 · 376 wide):
// Community — 2×2 motion cards (182×226, gaps 12 — user review, Figma 169×210 / 31·20) with a ‹ › pager pill; 3D Asset — 115 round tiles, 3 per row, gaps 15.
// Saved expressions show up in Community too (User Data, uploaded), so clicking a card attaches it as a reference.
// Clicking an asset tile drops it into the scene next to the robot.
export function LibraryPanel({
  attached,
  onAttach,
  onPlaceAsset,
  onResetScene,
}: {
  attached: string[];
  onAttach: (motion: UserDataMotion) => void;
  /** 3D Asset tile: drop it into the scene (Library L3) */
  onPlaceAsset: (assetId: string) => void;
  /** 3D Asset header: clear every placed object (asks first) */
  onResetScene: () => void;
}) {
  const [items, setItems] = useState<UserDataMotion[] | null>(null);
  const [page, setPage] = useState(0);
  // 3D assets: 3 × 3 per page once there are 10 or more, ‹ › like Community
  const [assetPage, setAssetPage] = useState(0);
  const assetPages = SIMREADY_ASSETS.length >= 10 ? Math.ceil(SIMREADY_ASSETS.length / L.assetPageSize) : 1;
  const assetsShown = assetPages > 1 ? SIMREADY_ASSETS.slice(assetPage * L.assetPageSize, (assetPage + 1) * L.assetPageSize) : SIMREADY_ASSETS;

  useEffect(() => {
    api<UserDataMotion[]>("/api/user-data?tab=popular").then(setItems, () => setItems([]));
  }, []);

  if (!items) return <Loading label={STRINGS.common.loading} />;
  const pages = Math.max(1, Math.ceil(items.length / L.pageSize));
  const shown = items.slice(page * L.pageSize, (page + 1) * L.pageSize);

  return (
    <div className="ml-[2px] flex w-[376px] flex-col">
      <SectionHeader label={L.community}>
        <Link href="/lab/community" aria-label={L.openCommunity} className="text-[var(--library-section)]">
          <Icon name="square-top-down" size={16} />
        </Link>
      </SectionHeader>

      {shown.length === 0 ? (
        <p className="mt-[var(--space-24)] text-[14px] leading-[18px] text-[var(--text-tertiary)]">{L.empty}</p>
      ) : (
        <div className="mt-[16px] grid grid-cols-[182px_182px] gap-x-[12px] gap-y-[12px]">
          {shown.map((m) => (
            <MotionCard key={m.id} motion={m} selected={attached.includes(m.id)} onClick={() => onAttach(m)} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-[16px] flex w-[376px] justify-center">
          <div className="flex h-[36px] w-[66px] overflow-hidden rounded-[18px] bg-[var(--library-pager)] text-[var(--library-pager-icon)]">
            <PagerButton label={L.prev} disabled={page === 0} onClick={() => setPage((p) => p - 1)} flip />
            <PagerButton label={L.next} disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} />
          </div>
        </div>
      )}

      <div className="mt-[27px]">
        <SectionHeader label={L.assets}>
          <button type="button" onClick={onResetScene} aria-label={L.resetScene} title={L.resetScene} className="text-[var(--library-section)] hover:text-[var(--text-primary)]">
            <Icon name="replay" size={16} />
          </button>
        </SectionHeader>
      </div>
      <div className="ml-[12px] mt-[24px] grid grid-cols-[115px_115px_115px] gap-[15px]">
        {assetsShown.map((a) => (
          <button
            key={a.id}
            type="button"
            title={fmt(L.place, { name: a.name })}
            aria-label={fmt(L.place, { name: a.name })}
            onClick={() => onPlaceAsset(a.id)}
            className="flex size-[115px] items-center justify-center overflow-hidden rounded-full bg-[var(--library-asset)] transition-transform duration-[var(--motion-base)] ease-[var(--ease-standard)] hover:scale-[1.05] focus-visible:scale-[1.05]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${SIMREADY_BASE}/${a.id}/thumb.png`} alt="" className="size-[88px] object-contain" />
          </button>
        ))}
      </div>
      {assetPages > 1 && (
        <div className="mt-[16px] flex w-[376px] justify-center">
          <div className="flex h-[36px] w-[66px] overflow-hidden rounded-[18px] bg-[var(--library-pager)] text-[var(--library-pager-icon)]">
            <PagerButton label={L.prev} disabled={assetPage === 0} onClick={() => setAssetPage((p) => p - 1)} flip />
            <PagerButton label={L.next} disabled={assetPage >= assetPages - 1} onClick={() => setAssetPage((p) => p + 1)} />
          </div>
        </div>
      )}
      {/* CC BY 4.0 asks for attribution where the assets are used */}
      <p className="ml-[12px] mt-[var(--space-16)] text-[12px] leading-[15px] text-[var(--text-tertiary)]">{SIMREADY_CREDIT}</p>
    </div>
  );
}

// Section row (451:1849 / 451:1855): widget 16 · 5 · label Medium 16 #6f6d6e, ↗ 16 at the right.
function SectionHeader({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex h-[16px] items-center justify-between">
      <span className="flex items-center gap-[5px] text-[16px] font-medium leading-none text-[var(--library-section)]">
        <Icon name="widget" size={16} />
        {label}
      </span>
      {children}
    </div>
  );
}

function PagerButton({ label, disabled, onClick, flip }: { label: string; disabled: boolean; onClick: () => void; flip?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      // Each button fills its half of the pill (icon 12 in from the edge, as in Figma), so the whole pill is clickable
      className={`flex h-full flex-1 items-center ${flip ? "justify-end pr-[12px]" : "justify-start pl-[12px]"} hover:bg-[var(--neutral-150)] disabled:opacity-40 disabled:hover:bg-transparent`}
    >
      <Icon name="pager-chevron" size={9} className={flip ? "rotate-180" : undefined} />
    </button>
  );
}

// Card (Motion/Greet 451:1610, enlarged after review): 182×226, gradient #edeef0 → #f3f4f6, r 12; name SemiBold 15 + uses 12
// at 16,14; face · sound icons 14 top right; art box at y 34; waveform 132 wide at 12,203; duration 10 at the right.
// Hover only = sage gradient, 1.04× and 4 higher, sound on (no lasting selected look; clicking toggles the reference).
function MotionCard({ motion: m, selected, onClick }: { motion: UserDataMotion; selected: boolean; onClick: () => void }) {
  const card = communityCard(m);
  return (
    <button
      type="button"
      onClick={(e) => {
        // Mouse clicks shouldn't leave the focus (lift) style behind once it's toggled off
        e.currentTarget.blur();
        onClick();
      }}
      aria-pressed={selected}
      data-testid="library-card"
      className="group relative h-[226px] w-[182px] overflow-hidden rounded-[12px] bg-[linear-gradient(to_bottom,var(--community-card-top),var(--community-card-bottom))] text-left transition-transform duration-[var(--motion-base)] ease-[var(--ease-standard)] hover:z-10 hover:-translate-y-[4px] hover:scale-[1.04] hover:bg-[linear-gradient(to_bottom,var(--community-card-selected)_39.85%,var(--community-card-selected-end))] focus-visible:z-10 focus-visible:-translate-y-[4px] focus-visible:scale-[1.04]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={card.art} alt="" aria-hidden className="pointer-events-none absolute left-1/2 top-[34px] h-[170px] w-[176px] max-w-none -translate-x-1/2" />
      <div className="absolute left-[16px] right-[52px] top-[14px] flex flex-col">
        <span className="truncate text-[15px] font-semibold leading-[19px] tracking-[-0.3px] text-[var(--library-card-title)]">{m.name}</span>
        <span className="text-[12px] leading-[17px] tracking-[-0.24px] text-[var(--neutral-1000)] opacity-50">{usesLabel(m.uses)}</span>
      </div>
      <div className="absolute right-[15px] top-[15px] flex items-center gap-[9px] text-[var(--neutral-600)]">
        <Icon name="inbox-in" size={14} />
        {card.wave && (
          <>
            <Icon name="volume-cross" size={14} label={U.noSound} className="group-hover:hidden" />
            <Icon name="volume-loud" size={14} label={U.sound} className="hidden group-hover:block" />
          </>
        )}
      </div>
      <div className="absolute left-[12px] top-[203px] flex h-[11px] w-[132px] items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={WAVEFORM_SRC[card.wave ?? "flat"]} alt="" aria-hidden className="block w-full -scale-x-100" />
      </div>
      <span className="absolute right-[14px] top-[199px] text-[10px] leading-[17px] tracking-[-0.2px] text-[var(--neutral-1000)] opacity-50">{motionSeconds(m)}</span>
    </button>
  );
}
