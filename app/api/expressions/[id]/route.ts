import { body, handle, type Ctx } from "@/lib/api";
import { ExpressionInputSchema } from "@/lib/models";
import { getRepo } from "@/lib/repo-server";

export const dynamic = "force-dynamic";
type P = Ctx<{ id: string }>;

export function GET(_req: Request, { params }: P) {
  return handle(async () => getRepo().expressions.get((await params).id));
}

export function PATCH(req: Request, { params }: P) {
  return handle(async () => getRepo().expressions.update((await params).id, await body(req, ExpressionInputSchema.partial())));
}

export function DELETE(_req: Request, { params }: P) {
  return handle(async () => {
    await getRepo().expressions.delete((await params).id);
    return { ok: true };
  });
}
