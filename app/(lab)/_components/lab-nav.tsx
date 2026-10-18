"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, Suspense } from "react";
import { STRINGS } from "@/data/strings";
import { tabOf, type CommunityTab } from "@/data/community";
import { GuidelineTree } from "@/components/ui/guideline/guideline-tree";

const ITEMS = [
  { href: "/lab", label: STRINGS.sidebar.lab },
  { href: "/lab/guideline", label: STRINGS.sidebar.guideline },
  { href: "/lab/community", label: STRINGS.sidebar.community },
];

// Lab is active for /lab and every project / new-project route; the others by prefix.
function activeHref(path: string) {
  if (path.startsWith("/lab/guideline")) return "/lab/guideline";
  if (path.startsWith("/lab/community")) return "/lab/community";
  if (path.startsWith("/lab/profile")) return null;
  return "/lab";
}

/** docPaths: guideline routes on the component-page template — they nest the guideline tree under Guideline (Figma 808:1583). */
export function LabNav({ docPaths = [] }: { docPaths?: string[] }) {
  const path = usePathname() ?? "/lab";
  const active = activeHref(path);
  const tree = docPaths.includes(path);
  return (
    <nav className={`flex flex-col gap-[11px] ${tree ? "-mr-[var(--space-12)] min-h-0 overflow-y-auto pr-[var(--space-12)]" : ""}`}>
      {ITEMS.map((item) => {
        const on = item.href === active;
        return (
          <Fragment key={item.href}>
            <Link
              href={item.href}
              aria-current={on ? "page" : undefined}
              className={`rounded-[var(--radius-xs)] p-[var(--space-12)] text-[20px] leading-[26px] text-[var(--text-link)] ${
                on ? "bg-[var(--sage-50)] font-semibold" : "font-normal hover:bg-[var(--neutral-50)]"
              }`}
            >
              {item.label}
            </Link>
            {tree && item.href === "/lab/guideline" && <GuidelineTree base="/lab/guideline" current={path} />}
          </Fragment>
        );
      })}
      {path === "/lab/community" && (
        <Suspense>
          <CommunitySubNav />
        </Suspense>
      )}
    </nav>
  );
}

// Community sub-nav (Figma 943:1612 "Side nav"): All · Popular · Recently, 15 medium, selected on #dfe5e7 radius 10.
function CommunitySubNav() {
  const tab = tabOf(useSearchParams().get("tab"));
  return (
    <div className="mt-[5px] flex flex-col gap-[var(--space-4)] px-[22px] py-[var(--space-12)]" role="group" aria-label={STRINGS.community.title}>
      {(Object.keys(STRINGS.community.tabs) as CommunityTab[]).map((t) => (
        <Link
          key={t}
          href={t === "all" ? "/lab/community" : `/lab/community?tab=${t}`}
          aria-current={t === tab ? "page" : undefined}
          className={`rounded-[10px] px-[11px] py-[var(--space-8)] text-[15px] font-medium leading-[22.5px] text-[var(--text-primary)] ${
            t === tab ? "bg-[var(--community-subnav-selected)]" : "hover:bg-[var(--neutral-50)]"
          }`}
        >
          {STRINGS.community.tabs[t]}
        </Link>
      ))}
    </div>
  );
}
