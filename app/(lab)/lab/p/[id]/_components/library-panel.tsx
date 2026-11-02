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
// Community — 2×2 motion cards (169×210, gaps 31 / 20) with a ‹ › pager pill; 3D Asset — 115 round tiles, 3 per row, gaps 15.
// Saved expressions show up in Community too (User Data, uploaded), so clicking a card attaches it as a reference.
// Clicking an asset tile drops it into the scene next to the robot.
export function LibraryPanel({
  attached,
  onAttach,
  onPlaceAsset,
}: {
  attached: string[];
  onAttach: (motion: UserDataMotion) => void;
  /** 3D Asset tile: drop it into the scene (Library L3) */
  onPlaceAsset: (assetId: string) => void;
}) {
  const [items, setItems] = useState<UserDataMotion[] | null>(null);
  const [page, setPage] = useState(0);

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
        <div className="ml-[8px] mt-[42px] grid grid-cols-[169px_169px] gap-x-[31px] gap-y-[20px]">
          {shown.map((m) => (
            <MotionCard key={m.id} motion={m} selected={attached.includes(m.id)} onClick={() => onAttach(m)} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="ml-[8px] mt-[20px] flex w-[369px] justify-center">
          <div className="flex h-[36px] w-[66px] items-center justify-center gap-[24px] rounded-[18px] bg-[var(--library-pager)] text-[var(--library-pager-icon)]">
            <PagerButton label={L.prev} disabled={page === 0} onClick={() => setPage((p) => p - 1)} flip />
            <PagerButton label={L.next} disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} />
          </div>
        </div>
      )}

      <div className="mt-[27px]">
        <SectionHeader label={L.assets}>
          <a href={L.assetsSource} target="_blank" rel="noreferrer" aria-label={L.openAssets} title={SIMREADY_CREDIT} className="text-[var(--library-section)]">
            <Icon name="square-top-down" size={16} />
          </a>
        </SectionHeader>
      </div>
      <div className="ml-[12px] mt-[24px] grid grid-cols-[115px_115px_115px] gap-[15px]">
        {SIMREADY_ASSETS.map((a) => (
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
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="flex h-[12px] w-[9px] items-center justify-center disabled:opacity-40">
      <Icon name="pager-chevron" size={9} className={flip ? "rotate-180" : undefined} />
    </button>
  );
}

// Card (Motion/Greet 451:1610): 169×210, gradient #edeef0 → #f3f4f6, r 11.463; name SemiBold 12.819 + uses 9.861 at 15.9,13.87;
// face · sound icons 12.724 top right (gap 8.5); art box at y 27; waveform 126 wide at 10.6,187; duration 8.483 at the right.
// Selected (Motion/Look around 451:1768, 185×229) = sage gradient, ~1.095× and 9.5 higher; hover shows the same.
function MotionCard({ motion: m, selected, onClick }: { motion: UserDataMotion; selected: boolean; onClick: () => void }) {
  const card = communityCard(m);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-testid="library-card"
      className={`group relative h-[210px] w-[169px] overflow-hidden rounded-[11.463px] text-left transition-transform duration-[var(--motion-base)] ease-[var(--ease-standard)] ${
        selected
          ? "z-10 -translate-y-[9.5px] scale-[1.095] bg-[linear-gradient(to_bottom,var(--community-card-selected)_39.85%,var(--community-card-selected-end))]"
          : "bg-[linear-gradient(to_bottom,var(--community-card-top),var(--community-card-bottom))] hover:z-10 hover:-translate-y-[9.5px] hover:scale-[1.095] hover:bg-[linear-gradient(to_bottom,var(--community-card-selected)_39.85%,var(--community-card-selected-end))] focus-visible:z-10 focus-visible:-translate-y-[9.5px] focus-visible:scale-[1.095]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={card.art} alt="" aria-hidden className="pointer-events-none absolute left-1/2 top-[27px] h-[163.7px] w-[169px] max-w-none -translate-x-1/2" />
      <div className="absolute left-[15.9px] right-[48px] top-[13.87px] flex flex-col">
        <span className="truncate text-[12.819px] font-semibold leading-[15.762px] tracking-[-0.2564px] text-[var(--library-card-title)]">{m.name}</span>
        <span className="text-[9.861px] leading-[17.257px] tracking-[-0.1972px] text-[var(--neutral-1000)] opacity-50">{usesLabel(m.uses)}</span>
      </div>
      <div className="absolute right-[14.2px] top-[13.34px] flex items-center gap-[8.5px] text-[var(--neutral-600)]">
        <Icon name="inbox-in" size={12.724} />
        {card.wave && (
          <Icon
            name={selected ? "volume-loud" : "volume-cross"}
            size={12.724}
            label={selected ? U.sound : U.noSound}
          />
        )}
      </div>
      <div className="absolute left-[10.6px] top-[187.19px] flex h-[10.604px] w-[126.183px] items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={WAVEFORM_SRC[card.wave ?? "flat"]} alt="" aria-hidden className="block w-full -scale-x-100" />
      </div>
      <span className="absolute left-[141.78px] top-[184px] text-[8.483px] leading-[17.257px] tracking-[-0.1697px] text-[var(--neutral-1000)] opacity-50">{motionSeconds(m)}</span>
    </button>
  );
}
