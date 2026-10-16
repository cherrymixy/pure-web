import { handle, type Ctx } from "@/lib/api";
import { getRepo } from "@/lib/repo-server";

export function DELETE(_req: Request, { params }: Ctx<{ id: string }>) {
  return handle(async () => {
    await getRepo().library.delete((await params).id);
    return { ok: true };
  });
}
