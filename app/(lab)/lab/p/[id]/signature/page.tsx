// @implemented
// @screen W02C-1~3
import { notFound } from "next/navigation";
import { isRepoError } from "@/lib/repo";
import { getRepo } from "@/lib/repo-server";
import { SignatureStudio } from "./_components/signature-studio";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getRepo().projects.get(id).catch((err) => {
    if (isRepoError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  });
  return <SignatureStudio projectId={id} name={project.name} initialVersions={project.signatureHistory} initialCurrentId={project.signatureId ?? null} />;
}
