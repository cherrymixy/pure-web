import Link from "next/link";

// Post-login sidebar shell (temporary text; user comes from data/ in STEP 4).
export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-neutral-200 p-6">
        <Link href="/lab/profile" className="text-sm">
          <div className="font-semibold">SeungA Jeon</div>
          <div className="text-neutral-500">SeungA@purebot.com</div>
        </Link>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/lab">Lab</Link>
          <Link href="/lab/guideline">Guideline</Link>
          <Link href="/lab/user-data">User Data</Link>
        </nav>
      </aside>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
