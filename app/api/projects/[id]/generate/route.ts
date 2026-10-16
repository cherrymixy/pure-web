import { z } from "zod";
import { body, handle, type Ctx } from "@/lib/api";
import { startJob } from "@/lib/jobs";
import { MotionPropsSchema, ReferenceSchema } from "@/lib/models";
import { getRepo } from "@/lib/repo-server";

const InputSchema = z.object({
  prompt: z.string().trim().min(1).max(500),
  currentStatus: z.string().max(300).optional(),
  components: z.array(z.string()).max(15).optional(),
  pattern: z.string().optional(),
  references: z.array(ReferenceSchema).max(4).optional(),
  expressionId: z.string().optional(),
  props: MotionPropsSchema.optional(),
});

/** POST: start a generate job (W02D). Stop = POST /api/jobs/[id]/cancel; the previous result stays. */
export function POST(req: Request, { params }: Ctx<{ id: string }>) {
  return handle(async () => {
    const projectId = (await params).id;
    const input = await body(req, InputSchema);
    await getRepo().projects.get(projectId);
    return startJob("generate", projectId, { ...input, projectId });
  });
}
