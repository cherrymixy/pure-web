import { docPaths } from "@/data/guideline";
import { LAB_SHOWCASE } from "@/data/lab-showcase";
import { getRepo } from "@/lib/repo-server";
import { FavouritesProvider } from "./_components/favourites-context";
import type { FavouriteItem } from "./_components/lab-nav";
import { LabShell } from "./_components/lab-shell";
import { LabSidebar } from "./_components/lab-sidebar";

export const dynamic = "force-dynamic";

// Post-login shell (Figma 1095:6558). Setup and editor routes are full-bleed (LabShell).
// Every showcase project can be starred, so the sidebar gets them all and shows the starred ones (FavouritesProvider).
export default async function LabLayout({ children }: { children: React.ReactNode }) {
  const repo = getRepo();
  const [profile, projects] = await Promise.all([repo.profile.get(), repo.projects.list()]);
  const favourites: FavouriteItem[] = LAB_SHOWCASE.flatMap((c) => {
    const p = projects.find((x) => x.id === c.projectId);
    return p ? [{ id: p.id, name: p.name, art: c.fav ?? c.avatar }] : [];
  });
  return (
    <FavouritesProvider>
      <LabShell sidebar={<LabSidebar docPaths={docPaths("/lab/guideline")} favourites={favourites} name={profile.name} email={profile.email} />}>
        {children}
      </LabShell>
    </FavouritesProvider>
  );
}
