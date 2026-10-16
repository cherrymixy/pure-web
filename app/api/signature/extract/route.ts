import { z } from "zod";
import { body, errorResponse, handle } from "@/lib/api";
import { startJob } from "@/lib/jobs";
import { getRepo } from "@/lib/repo-server";
import { classifyUrl } from "@/lib/signature/extract";
import { SignatureError } from "@/lib/signature/errors";

const InputSchema = z.object({
  projectId: z.string(),
  source: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("pdf"), path: z.string().min(1), name: z.string().min(1) }),
    z.object({ kind: z.literal("url"), url: z.string().min(1) }),
  ]),
  regenerate: z.boolean().optional(),
});

/** Start the signature job (W02C). Figma links fail right away with E1. */
export function POST(req: Request) {
  return handle(async () => {
    const input = await body(req, InputSchema);
    await getRepo().projects.get(input.projectId);
    if (input.source.kind === "url") {
      try {
        if (classifyUrl(input.source.url) === "figma") {
          return errorResponse(400, "FIGMA_UNSUPPORTED", "Figma links aren't supported yet. Export the guide as a PDF.");
        }
      } catch (err) {
        if (err instanceof SignatureError) return errorResponse(400, err.code, err.message);
        throw err;
      }
    }
    return startJob("signature-extract", input.projectId, input);
  });
}
