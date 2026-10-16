import Link from "next/link";
import { STRINGS } from "@/data/strings";

// Pre-login GNB: every entry leads into the lab (always signed in as SeungA).
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-200 bg-white px-8 py-4">
        <Link href="/" className="font-semibold">{STRINGS.brand.name}</Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/guideline">{STRINGS.gnb.guideline}</Link>
          <Link href="/lab">{STRINGS.gnb.signIn}</Link>
          <Link href="/lab" className="rounded border border-neutral-900 px-3 py-1">{STRINGS.gnb.tryPure}</Link>
        </nav>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
