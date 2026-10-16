// @implemented
// @screen W04-2
import { notFound } from "next/navigation";
import { isRepoError } from "@/lib/repo";
import { getRepo } from "@/lib/repo-server";
import { MotionDetail } from "./_components/motion-detail";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getRepo();
  const motion = await repo.userData.get(id).catch((err) => {
    if (isRepoError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  });
  const projects = (await repo.projects.list()).filter((p) => p.structure).map((p) => ({ id: p.id, name: p.name, type: p.type }));
  return <MotionDetail motion={motion} projects={projects} />;
}
