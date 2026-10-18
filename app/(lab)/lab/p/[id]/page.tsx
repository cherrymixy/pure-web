// @implemented
// @screen W02D·W02E
import { notFound, redirect } from "next/navigation";
import { PURE_DEFAULT_SIGNATURE } from "@/data/signature";
import { isRepoError } from "@/lib/repo";
import { FLAGS } from "@/lib/env";
import { getRepo } from "@/lib/repo-server";
import { Editor } from "./_components/editor";

export const dynamic = "force-dynamic";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ref?: string }> }) {
  const { id } = await params;
  const { ref } = await searchParams;
  const repo = getRepo();
  const project = await repo.projects.get(id).catch((err) => {
    if (isRepoError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  });
  if (!project.structure) redirect(`/lab/p/${id}/${project.status === "analyzing" ? "analyzing" : "structure"}`);
  const [expressions, signature, settings, incoming] = await Promise.all([
    repo.expressions.listByProject(id),
    repo.signatures.current(id),
    repo.settings.get(),
    // Community → "Bring to Lab" lands here with ?ref=<motion id>.
    ref ? repo.userData.get(ref).then((m) => ({ id: m.id, name: m.name }), () => null) : null,
  ]);
  return (
    <Editor
      project={project}
      structure={project.structure}
      signature={signature ?? PURE_DEFAULT_SIGNATURE}
      initialExpression={expressions[0] ?? null}
      settings={settings}
      incomingReference={incoming}
      directClip={!!settings.directClip || FLAGS.directClip}
    />
  );
}
