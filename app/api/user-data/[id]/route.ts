import { handle, type Ctx } from "@/lib/api";
import { getRepo } from "@/lib/repo-server";

export const dynamic = "force-dynamic";

export function GET(_req: Request, { params }: Ctx<{ id: string }>) {
  return handle(async () => getRepo().userData.get((await params).id));
}
