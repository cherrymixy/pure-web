import Link from "next/link";
import { STRINGS } from "@/data/strings";
import { getRepo } from "@/lib/repo-server";
import { UserMenu } from "./_components/user-menu";

export const dynamic = "force-dynamic";

// Post-login sidebar shell: user menu · Lab · Guideline · User Data.
export default async function LabLayout({ children }: { children: React.ReactNode }) {
  const profile = await getRepo().profile.get();
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-6 border-r border-neutral-200 p-6">
        <Link href="/lab" className="font-semibold">{STRINGS.brand.name}</Link>
        <UserMenu name={profile.name} email={profile.email} />
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/lab">{STRINGS.sidebar.lab}</Link>
          <Link href="/lab/guideline">{STRINGS.sidebar.guideline}</Link>
          <Link href="/lab/user-data">{STRINGS.sidebar.userData}</Link>
        </nav>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
