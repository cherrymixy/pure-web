"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { STRINGS } from "@/data/strings";
import { GuidelineTree } from "@/components/ui/guideline/guideline-tree";
import { Icon, type IconName } from "@/components/ui/icons/icon";
import { RobotArtLayers } from "@/components/ui/robot-art";
import { useFavourites } from "./favourites-context";
import type { RobotArt } from "@/data/lab-showcase";

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/lab", label: STRINGS.sidebar.lab, icon: "nav-lab" },
  { href: "/lab/guideline", label: STRINGS.sidebar.guideline, icon: "nav-guideline" },
  { href: "/lab/user-data", label: STRINGS.sidebar.userData, icon: "nav-user-data" },
];

// Lab is active for /lab and every project / new-project route; the others by prefix. The community list is User Data.
function activeHref(path: string) {
  for (const prefix of ["/lab/guideline", "/lab/user-data"]) if (path.startsWith(prefix)) return prefix;
  if (path === "/lab/community") return "/lab/user-data";
  if (path.startsWith("/lab/profile") || path.startsWith("/lab/community")) return null;
  return "/lab";
}

// Nav row (Figma 1095:6568): px 12 py 11, gap 12, radius 10, icon 20, 17px; selected = bg #eef1f4, ink medium.
const ROW = "flex w-full items-center gap-[var(--space-12)] overflow-clip rounded-[10px] px-[var(--space-12)] py-[11px] text-[17px] leading-normal";

/** docPaths: guideline routes on the component-page template — they nest the guideline tree under Guideline (Figma 808:1583).
 *  collapsed: icon-only rail (labels, trees and sub-lists hidden). */
export function LabNav({ docPaths = [], collapsed = false }: { docPaths?: string[]; collapsed?: boolean }) {
  const path = usePathname() ?? "/lab";
  const active = activeHref(path);
  const tree = !collapsed && docPaths.includes(path);
  return (
    <nav className="flex shrink-0 flex-col gap-[6px]">
      {ITEMS.map((item) => {
        const on = item.href === active;
        return (
          <Fragment key={item.href}>
            <Link
              href={item.href}
              aria-current={on ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={`${ROW} ${on ? "bg-[var(--home-nav-on)] font-medium text-[var(--home-ink)]" : "font-normal text-[var(--home-ink-2)] hover:bg-[var(--home-nav-on)]"}`}
            >
              <Icon name={item.icon} size={20} className="shrink-0" />
              {!collapsed && item.label}
            </Link>
            {tree && item.href === "/lab/guideline" && <GuidelineTree base="/lab/guideline" current={path} />}
          </Fragment>
        );
      })}
    </nav>
  );
}

export type FavouriteItem = { id: string; name: string; art: RobotArt };

// Favourites (Figma 1095:6593 / 1104:1009): 14 medium #9aa1a6 header (p 12), rows px 12 py 8 — 30 avatar on #eef1f4 radius 8, 16 name.
// Live: follows the stars on the Lab cards (FavouritesProvider).
export function Favourites({ items }: { items: FavouriteItem[] }) {
  const { stars } = useFavourites();
  const shown = items.filter((f) => stars.has(f.id));
  if (shown.length === 0) return null;
  return (
    <div className="flex flex-col gap-[6px]">
      <p className="p-[var(--space-12)] text-[14px] font-medium leading-normal text-[var(--home-ink-3)]">{STRINGS.sidebar.favourites}</p>
      <ul className="flex flex-col gap-[6px]">
        {shown.map((f) => (
          <li key={f.id}>
            <Link href={`/lab/p/${f.id}`} className="flex items-center gap-[var(--space-12)] rounded-[10px] px-[var(--space-12)] py-[var(--space-8)] hover:bg-[var(--home-nav-on)]">
              <span className="relative size-[30px] shrink-0 overflow-clip rounded-[var(--radius-xs)] bg-[var(--home-nav-on)]">
                <RobotArtLayers art={f.art} />
              </span>
              <span className="truncate text-[16px] leading-normal text-[var(--home-ink)]">{f.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
