import { z } from "zod";
import { body, handle, type Ctx } from "@/lib/api";
import { TEAM_ROLES } from "@/lib/models";
import { getRepo } from "@/lib/repo-server";

type P = Ctx<{ email: string }>;

export function PATCH(req: Request, { params }: P) {
  return handle(async () => {
    const { role } = await body(req, z.object({ role: z.enum(TEAM_ROLES) }));
    return getRepo().profile.setRole(decodeURIComponent((await params).email), role);
  });
}

export function DELETE(_req: Request, { params }: P) {
  return handle(async () => getRepo().profile.remove(decodeURIComponent((await params).email)));
}
