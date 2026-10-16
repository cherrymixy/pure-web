import { handle } from "@/lib/api";
import { getRepo } from "@/lib/repo-server";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => getRepo().dev.dump());
}
