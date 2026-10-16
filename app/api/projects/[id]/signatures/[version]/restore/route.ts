import { handle, type Ctx } from "@/lib/api";
import { RepoError } from "@/lib/repo";
import { getRepo } from "@/lib/repo-server";

export function POST(_req: Request, { params }: Ctx<{ id: string; version: string }>) {
  return handle(async () => {
    const { id, version } = await params;
    const v = Number(version);
    if (!Number.isInteger(v) || v < 1) throw new RepoError("VALIDATION", "Version must be a positive integer");
    return getRepo().signatures.restore(id, v);
  });
}
