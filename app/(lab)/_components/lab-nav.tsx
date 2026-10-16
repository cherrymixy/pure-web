"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STRINGS } from "@/data/strings";

const ITEMS = [
  { href: "/lab", label: STRINGS.sidebar.lab },
  { href: "/lab/guideline", label: STRINGS.sidebar.guideline },
  { href: "/lab/user-data", label: STRINGS.sidebar.userData },
];

// Lab is active for /lab and every project / new-project route; the others by prefix.
function activeHref(path: string) {
  if (path.startsWith("/lab/guideline")) return "/lab/guideline";
  if (path.startsWith("/lab/user-data")) return "/lab/user-data";
  if (path.startsWith("/lab/profile")) return null;
  return "/lab";
}

export function LabNav() {
  const active = activeHref(usePathname() ?? "/lab");
  return (
    <nav className="flex flex-col gap-[11px]">
      {ITEMS.map((item) => {
        const on = item.href === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={on ? "page" : undefined}
            className={`rounded-[var(--radius-xs)] p-[var(--space-12)] text-[20px] leading-[26px] text-[var(--text-link)] ${
              on ? "bg-[var(--sage-50)] font-semibold" : "font-normal hover:bg-[var(--neutral-50)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
