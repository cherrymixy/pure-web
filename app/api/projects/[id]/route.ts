import { z } from "zod";
import { body, handle, type Ctx } from "@/lib/api";
import { ChannelSchema } from "@/lib/models";
import { getRepo } from "@/lib/repo-server";

export const dynamic = "force-dynamic";
type P = Ctx<{ id: string }>;

export function GET(_req: Request, { params }: P) {
  return handle(async () => getRepo().projects.get((await params).id));
}

const PatchSchema = z
  .object({
    name: z.string().min(1).max(60),
    status: z.enum(["analyzing", "draft", "ready"]),
    progress: z.number().min(0).max(100),
    channelsUsed: z.array(ChannelSchema),
  })
  .partial();

export function PATCH(req: Request, { params }: P) {
  return handle(async () => getRepo().projects.update((await params).id, await body(req, PatchSchema)));
}

export function DELETE(_req: Request, { params }: P) {
  return handle(async () => {
    await getRepo().projects.delete((await params).id);
    return { ok: true };
  });
}
