import { z } from "zod";
import { body, handle } from "@/lib/api";
import { getGeneration, recordCall } from "@/lib/llm";

export const dynamic = "force-dynamic";

const InputSchema = z.object({
  mode: z.enum(["generate", "describe"]).default("generate"),
  prompt: z.string().default(""),
  images: z.array(z.string().startsWith("data:image/")).max(8).optional(),
});

/** Dev only: run the generation client and return everything (raw, parsed, timing, source). */
export function POST(req: Request) {
  return handle(async () => {
    const input = await body(req, InputSchema);
    const generation = await getGeneration();
    const started = Date.now();
    if (input.mode === "describe") {
      const d = await generation.describe(input.images ?? []);
      recordCall({ kind: "describe", ms: d.ms, source: d.summary ? "ollama" : "demo" });
      return { mode: "describe", ...d, totalMs: Date.now() - started };
    }
    const r = await generation.generate({ prompt: input.prompt, images: input.images });
    recordCall({ kind: "generate", ms: r.ms, model: r.model, source: r.source });
    return { mode: "generate", ...r, totalMs: Date.now() - started };
  });
}
