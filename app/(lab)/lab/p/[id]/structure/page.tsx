// @implemented
// @screen W02B-4
import { notFound, redirect } from "next/navigation";
import { RepoError } from "@/lib/repo";
import { getRepo } from "@/lib/repo-server";
import { StructureEditor } from "./_components/structure-editor";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getRepo().projects.get(id).catch((err) => {
    if (err instanceof RepoError && err.code === "NOT_FOUND") notFound();
    throw err;
  });
  if (!project.structure) redirect(`/lab/p/${id}/analyzing`);
  return <StructureEditor projectId={id} name={project.name} initial={project.structure} />;
}
