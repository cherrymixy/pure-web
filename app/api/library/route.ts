import { z } from "zod";
import { body, handle } from "@/lib/api";
import { getRepo } from "@/lib/repo-server";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => getRepo().library.list());
}

export function POST(req: Request) {
  return handle(async () => {
    const { expressionId, name } = await body(req, z.object({ expressionId: z.string(), name: z.string().min(1).optional() }));
    return getRepo().library.save(expressionId, name);
  });
}
