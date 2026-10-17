import { getRepo } from "@/lib/repo-server";
import { LabNav } from "./_components/lab-nav";
import { LabShell } from "./_components/lab-shell";
import { UserMenu } from "./_components/user-menu";

export const dynamic = "force-dynamic";

// Post-login shell (Figma W02A-1 901:8324): floating white sidebar — user menu · Lab · Guideline · User Data.
// Figma 960 frame ×2: sidebar 268 wide, 32 inset, radius/xl. Setup and editor routes are full-bleed (LabShell).
export default async function LabLayout({ children }: { children: React.ReactNode }) {
  const profile = await getRepo().profile.get();
  return (
    <LabShell
      sidebar={
        <div className="sticky top-0 h-[var(--app-vh)] shrink-0 py-[var(--space-32)] pl-[var(--space-32)]">
          <aside className="flex h-full w-[268px] flex-col gap-[var(--space-36)] rounded-[var(--radius-xl)] bg-[var(--bg-surface)] p-[var(--space-20)]">
            <UserMenu name={profile.name} email={profile.email} />
            <LabNav />
          </aside>
        </div>
      }
    >
      {children}
    </LabShell>
  );
}
