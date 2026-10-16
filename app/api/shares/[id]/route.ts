import { handle, type Ctx } from "@/lib/api";
import { getRepo } from "@/lib/repo-server";
import { shareView } from "@/lib/share-view";

export const dynamic = "force-dynamic";

export function GET(_req: Request, { params }: Ctx<{ id: string }>) {
  return handle(async () => shareView(getRepo(), (await params).id, false));
}
