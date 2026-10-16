import { z } from "zod";
import { body, handle } from "@/lib/api";
import { TEAM_ROLES } from "@/lib/models";
import { getRepo } from "@/lib/repo-server";

export function POST(req: Request) {
  return handle(async () => {
    const { emails, role } = await body(req, z.object({ emails: z.array(z.string().email()).min(1), role: z.enum(TEAM_ROLES) }));
    return getRepo().profile.invite(emails, role);
  });
}
