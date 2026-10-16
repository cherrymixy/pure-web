import { z } from "zod";
import { OLLAMA_VISION_MODEL } from "../env";
import type { Structure } from "../models";
import type { LlmClient } from "./client";
import { GenerationOutputSchema, type GenerateOptions, type GenerationRequest } from "./generation";
import { directClipSystem, generationUser } from "./prompts";
import { chatValidated } from "./retry";

/** Tier 2 answer: the usual recipe output plus model-written keyframes (joints limited to the structure). */
export function directClipSchema(structure: Structure) {
  const joint = z.enum(structure.joints.map((j) => j.id) as [string, ...string[]]);
  return GenerationOutputSchema.extend({
    clip: z.object({
      duration: z.number(),
      tracks: z.array(z.object({ joint, keys: z.array(z.object({ t: z.number(), value: z.number() })).min(2).max(24) })).min(1),
    }),
  });
}
export type DirectClipOutput = z.infer<ReturnType<typeof directClipSchema>>;

/** One vision call: frames → recipe + clip. Throws on unreachable / invalid (the caller falls back to Tier 1). */
export async function generateDirectClip(
  client: LlmClient,
  req: GenerationRequest & { images: string[]; structure: Structure },
  opts: GenerateOptions = {},
  model = OLLAMA_VISION_MODEL,
): Promise<{ output: DirectClipOutput; ms: number; model?: string }> {
  const res = await chatValidated(client, directClipSchema(req.structure), {
    system: directClipSystem(req.structure),
    user: generationUser(req),
    images: req.images,
    model,
    signal: opts.signal,
    onDelay: opts.onDelay,
  });
  return { output: res.value, ms: res.ms, model: res.model };
}
