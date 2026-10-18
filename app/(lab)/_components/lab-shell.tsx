"use client";

import { usePathname } from "next/navigation";

/** Project setup and editor frames (Figma W02B-1 … W02F-4) and the community motion detail (943:1619) are full-bleed on
 *  bg/canvas; only the lab pages carry the sidebar. */
export function isFullBleed(pathname: string): boolean {
  return pathname.startsWith("/lab/new") || pathname.startsWith("/lab/p/") || pathname.startsWith("/lab/community/");
}

export function LabShell({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  if (isFullBleed(pathname)) {
    return <main className="flex min-h-[var(--app-vh)] min-w-0 flex-col bg-[var(--bg-canvas)]">{children}</main>;
  }
  return (
    <div className="flex min-h-[var(--app-vh)] bg-[var(--neutral-50)]">
      {sidebar}
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
