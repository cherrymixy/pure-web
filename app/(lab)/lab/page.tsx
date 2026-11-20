// @implemented
// @screen W02A-1~3 (home v2: Figma 1095:6556)
import { getRepo } from "@/lib/repo-server";
import { LabHome } from "./_components/lab-home";

export const dynamic = "force-dynamic";

export default async function Page() {
  const profile = await getRepo().profile.get();
  return <LabHome author={profile.name} />;
}
