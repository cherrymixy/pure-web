import { body, handle, type Ctx } from "@/lib/api";
import { ExpressionInputSchema } from "@/lib/models";
import { getRepo } from "@/lib/repo-server";

export const dynamic = "force-dynamic";
type P = Ctx<{ id: string }>;

export function GET(_req: Request, { params }: P) {
  return handle(async () => getRepo().expressions.listByProject((await params).id));
}

export function POST(req: Request, { params }: P) {
  return handle(async () => getRepo().expressions.create((await params).id, await body(req, ExpressionInputSchema)));
}
