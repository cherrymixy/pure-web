import { z } from "zod";
import { body, handle } from "@/lib/api";
import { getRepo } from "@/lib/repo-server";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => getRepo().profile.get());
}

/** Email can't be edited (W05). */
export function PATCH(req: Request) {
  return handle(async () =>
    getRepo().profile.update(await body(req, z.object({ name: z.string().min(1).max(20), company: z.string().max(60) }).partial())),
  );
}
