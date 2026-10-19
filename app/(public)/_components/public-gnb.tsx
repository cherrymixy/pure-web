/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { LANDING } from "@/data/landing";

const N = LANDING.nav;

// Pre-login GNB for /guideline = the landing's floating Top Bar (W00-1 901:6918 header) at ×2:
// 88 high pill, 1px neutral/0 stroke, bg/surface, px 40, logo 30, nav 20 text/link gap 52, Try PURE 150×56 radius md.
// Right padding 22 = landing 11 ×2 (concentric 16 + 6 by user review).
// Bar inset 48 from the window edges (landing 24 ×2) and Sign in ↔ Try PURE gap 40 (user review: Figma 48 read too wide), matching the landing bar at ×2.
// Section links go back to the landing; "Guideline" is this page. Every entry still leads into the lab.
export function PublicGnb() {
  return (
    <div className="sticky top-0 z-20 px-[var(--space-48)] pt-[var(--space-16)]">
      <header className="flex h-[88px] items-center justify-between rounded-[var(--radius-full)] border border-[var(--neutral-0)] bg-[var(--bg-surface)] pl-[var(--space-40)] pr-[22px]">
        <div className="flex w-[260px] items-center">
          <Link href="/" aria-label={N.logoAlt}>
            <img src="/figma/landing/logo-mark.svg" alt={N.logoAlt} width={30} height={30} className="block" />
          </Link>
        </div>
        <nav className="flex items-center gap-[52px] whitespace-nowrap text-[20px] leading-[1.26] text-[var(--text-link)]">
          {N.items.map((n) =>
            n.href === "#guideline" ? (
              <Link key={n.href} href="/guideline" aria-current="page" className="font-medium text-[var(--text-primary)]">
                {n.label}
              </Link>
            ) : (
              <Link key={n.href} href={`/${n.href}`}>
                {n.label}
              </Link>
            ),
          )}
        </nav>
        <div className="flex items-center gap-[var(--space-40)]">
          <Link href="/lab" className="text-[20px] leading-[1.26] text-[var(--text-link)]">{N.signIn}</Link>
          <Link href="/lab" className="flex h-[56px] w-[150px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--neutral-300)] text-[20px] font-medium leading-[1.26] text-[var(--sage-900)]">
            {N.tryPure}
          </Link>
        </div>
      </header>
    </div>
  );
}
