// @implemented
// @screen W05
import { getRepo } from "@/lib/repo-server";
import { ProfileView } from "./_components/profile-view";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <ProfileView initial={await getRepo().profile.get()} />;
}
