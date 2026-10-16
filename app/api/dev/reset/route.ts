import { handle } from "@/lib/api";
import { getRepo } from "@/lib/repo-server";

/** Reset demo data: seed DB, empty uploads. */
export function POST() {
  return handle(async () => {
    await getRepo().dev.reset();
    return { ok: true };
  });
}
