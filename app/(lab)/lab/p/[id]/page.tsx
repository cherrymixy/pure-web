// @implemented
// @screen W02D·W02E
import { notFound, redirect } from "next/navigation";
import { PURE_DEFAULT_SIGNATURE } from "@/data/signature";
import { RepoError } from "@/lib/repo";
import { getRepo } from "@/lib/repo-server";
import { Editor } from "./_components/editor";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const repo = getRepo();
  const project = await repo.projects.get(id).catch((err) => {
    if (err instanceof RepoError && err.code === "NOT_FOUND") notFound();
    throw err;
  });
  if (!project.structure) redirect(`/lab/p/${id}/${project.status === "analyzing" ? "analyzing" : "structure"}`);
  const [expressions, signature, settings] = await Promise.all([repo.expressions.listByProject(id), repo.signatures.current(id), repo.settings.get()]);
  return (
    <Editor
      project={project}
      structure={project.structure}
      signature={signature ?? PURE_DEFAULT_SIGNATURE}
      initialExpression={expressions[0] ?? null}
      settings={settings}
    />
  );
}
