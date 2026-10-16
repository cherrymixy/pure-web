import { z } from "zod";
import { body, handle, type Ctx } from "@/lib/api";
import { startJob } from "@/lib/jobs";
import { getRepo } from "@/lib/repo-server";

const InputSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("pure-desk") }),
  z.object({
    source: z.literal("import"),
    file: z.object({ name: z.string(), size: z.number(), path: z.string() }),
    reading: z.object({
      format: z.enum(["glb", "obj", "stl"]),
      meshes: z.number().int().min(0),
      vertices: z.number().int().min(0),
      bones: z.array(z.string()).max(200),
    }),
  }),
]);

/** POST: start the analyze-model job (W02B-3). The project goes back to "analyzing". */
export function POST(req: Request, { params }: Ctx<{ id: string }>) {
  return handle(async () => {
    const id = (await params).id;
    const input = await body(req, InputSchema);
    await getRepo().projects.update(id, { status: "analyzing", progress: 0 });
    return startJob("analyze-model", id, input);
  });
}
