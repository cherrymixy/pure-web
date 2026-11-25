"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { STRINGS } from "@/data/strings";
import { Icon } from "@/components/ui/icons/icon";
import { Favourites, LabNav, type FavouriteItem } from "./lab-nav";
import { UserMenu } from "./user-menu";

// Post-login sidebar (Figma 1095:6558): 288 wide at (26, 24), radius 20, p 24, #fbfbfc with a right hairline —
// brand row · nav · Favourites · user card. The brand-row button collapses it to an icon rail (68 = 12 + 44 row + 12).
export function LabSidebar({ docPaths, favourites, name, email }: { docPaths: string[]; favourites: FavouriteItem[]; name: string; email: string }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    // Same on-screen size on every lab page: undo the page zoom, apply the fitted frame zoom.
    <div className="sticky top-0 shrink-0 py-[24px] pl-[26px]" style={{ zoom: "var(--sidebar-zoom)", height: "calc(100vh / var(--frame-zoom))" }}>
      <aside
        className={`flex h-full flex-col gap-[6px] overflow-clip rounded-[var(--radius-lg)] border-r border-[var(--home-line)] bg-[var(--home-sidebar)] py-[var(--space-24)] transition-[width,padding] duration-[var(--motion-base)] ease-[var(--ease-standard)] motion-reduce:transition-none ${collapsed ? "w-[68px] px-[var(--space-12)]" : "w-[288px] px-[var(--space-24)]"}`}
      >
        <div className={`flex w-full shrink-0 items-center gap-[10px] py-[var(--space-4)] ${collapsed ? "justify-center" : ""}`}>
          {!collapsed && (
            <>
              <Link href="/lab" aria-label={STRINGS.sidebar.lab} className="flex rounded-[6px]">
                <img src="/figma/lab/home/logo.svg" alt={STRINGS.brand.name} width={83.791} height={19.106} className="h-[19.106px] w-[83.791px]" />
              </Link>
              <span className="flex-1" />
            </>
          )}
          <button
            type="button"
            aria-label={collapsed ? STRINGS.sidebar.expand : STRINGS.sidebar.collapse}
            aria-expanded={!collapsed}
            title={collapsed ? STRINGS.sidebar.expand : STRINGS.sidebar.collapse}
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-[var(--radius-xs)] text-[var(--home-ink-3)] hover:text-[var(--home-ink)]"
          >
            <Icon name="sidebar-collapse" size={20} className={collapsed ? "-scale-x-100" : ""} />
          </button>
        </div>
        <div className="h-[18px] shrink-0" />
        {/* Nav, guideline tree and Favourites scroll together (no visible scrollbar); the user card stays pinned below. */}
        <div className="flex min-h-0 flex-1 flex-col gap-[25px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <LabNav docPaths={docPaths} collapsed={collapsed} />
          {!collapsed && <Favourites items={favourites} />}
        </div>
        <div className="shrink-0">
          <UserMenu name={name} email={email} compact={collapsed} />
        </div>
      </aside>
    </div>
  );
}
