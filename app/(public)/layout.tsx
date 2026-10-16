import Link from "next/link";

// Pre-login GNB shell (temporary text; visuals in STEP 22).
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-8 py-4">
        <Link href="/" className="font-semibold">PURE</Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/guideline">Guideline</Link>
          <Link href="/lab">Sign in</Link>
          <Link href="/lab" className="rounded border border-neutral-900 px-3 py-1">Try PURE</Link>
        </nav>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
