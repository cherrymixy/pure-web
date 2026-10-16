import { z } from "zod";
import { body, handle, type Ctx } from "@/lib/api";
import { getRepo } from "@/lib/repo-server";
import { shareView } from "@/lib/share-view";

export function POST(req: Request, { params }: Ctx<{ id: string }>) {
  return handle(async () => {
    const { id } = await params;
    const { password } = await body(req, z.object({ password: z.string() }));
    const repo = getRepo();
    await repo.shares.unlock(id, password);
    return shareView(repo, id, true);
  });
}
