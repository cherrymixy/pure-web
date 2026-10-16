import { z } from "zod";
import { handle } from "@/lib/api";
import { getRepo } from "@/lib/repo-server";

export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  tab: z.enum(["all", "popular", "recent", "uploaded"]).optional(),
  category: z.string().optional(),
  q: z.string().optional(),
});

export function GET(req: Request) {
  return handle(async () => {
    const query = QuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    return getRepo().userData.list(query);
  });
}
