import Link from "next/link";
import { STRINGS } from "@/data/strings";

// Pre-login GNB for /guideline (the landing has its own floating Top Bar). Every entry leads into the lab.
export function PublicGnb() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-200 bg-white px-8 py-4">
      <Link href="/" className="font-semibold">{STRINGS.brand.name}</Link>
      <nav className="flex items-center gap-6 text-sm">
        <Link href="/guideline">{STRINGS.gnb.guideline}</Link>
        <Link href="/lab">{STRINGS.gnb.signIn}</Link>
        <Link href="/lab" className="rounded border border-neutral-900 px-3 py-1">{STRINGS.gnb.tryPure}</Link>
      </nav>
    </header>
  );
}
