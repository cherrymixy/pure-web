import { handle, type Ctx } from "@/lib/api";
import { getRepo } from "@/lib/repo-server";

export function POST(_req: Request, { params }: Ctx<{ id: string }>) {
  return handle(async () => getRepo().userData.markUsed((await params).id));
}
