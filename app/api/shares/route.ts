import { z } from "zod";
import { body, handle } from "@/lib/api";
import { getRepo } from "@/lib/repo-server";

const NewShareSchema = z.object({
  expressionIds: z.array(z.string()).min(1),
  days: z.number().int().min(1).max(90).optional(),
  password: z.string().min(1).max(64).optional(),
  allowDownload: z.boolean(),
});

/** Create a share link. The password is never echoed back. */
export function POST(req: Request) {
  return handle(async () => {
    const { passwordHash, ...share } = await getRepo().shares.create(await body(req, NewShareSchema));
    return { ...share, hasPassword: Boolean(passwordHash), url: `/s/${share.id}` };
  });
}
