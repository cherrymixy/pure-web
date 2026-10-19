import { body, handle, type Ctx } from "@/lib/api";
import { referenceImages } from "@/lib/jobs/generate";
import { matchScripted, pause } from "@/lib/jobs/scripted";
import { getGeneration, llmClient, recordCall } from "@/lib/llm";
import { OLLAMA_MODEL } from "@/lib/env";
import { ReferenceSchema } from "@/lib/models";
import { getRepo } from "@/lib/repo-server";
import { z } from "zod";

/**
 * POST: vision summary of one reference, right after upload, so Generate can skip the vision step.
 * Never fails the editor: no Ollama / demo mode → { summary: null } and Generate describes as before.
 */
export function POST(req: Request, { params }: Ctx<{ id: string }>) {
  return handle(async () => {
    await getRepo().projects.get((await params).id);
    const { reference } = await body(req, z.object({ reference: ReferenceSchema }));
    const scripted = await matchScripted([reference]);
    if (scripted) {
      await pause(1500);
      return { summary: scripted.summary, ms: 1500 };
    }
    const images = await referenceImages([reference]);
    if (!images.length) return { summary: null };
    try {
      const d = await (await getGeneration()).describe(images);
      recordCall({ kind: "describe", ms: d.ms, source: d.summary ? "ollama" : "demo" });
      // Only one model fits in memory at a time: bring the text model back while the user types.
      if (d.summary) void llmClient().preload?.(OLLAMA_MODEL);
      return { summary: d.summary || null, ms: d.ms };
    } catch {
      return { summary: null };
    }
  });
}
