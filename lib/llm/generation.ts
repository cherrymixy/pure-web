import { z } from "zod";
import { componentOf, type ComponentSim } from "@/data/components";
import { SIM_BEHAVIORS } from "@/data/sim-behaviors";
import { COMPONENT_DEMOS, PROMPT_DEMOS, type DemoExpression } from "@/data/demo-recipes";
import { FACE_NAMES } from "@/data/face-videos";
import { SUGGESTED_PROMPTS, type SuggestedPromptId } from "@/data/prompts";
import { SOUND_CUES } from "@/data/sound-cues";
import { OLLAMA_MODEL, OLLAMA_VISION_MODEL } from "../env";
import { LlmError, type LlmClient } from "./client";
import { DESCRIBE_SYSTEM, GENERATION_SYSTEM, generationUser, type GenerationPromptInput } from "./prompts";
import { chatValidated } from "./retry";
import { generateDirectClip, type DirectClipOutput } from "./direct-clip";
import type { Structure } from "../models";

const ids = <T extends { id: string }>(xs: readonly T[]) => xs.map((x) => x.id) as [string, ...string[]];
const BehaviorEnum = z.enum(ids(SIM_BEHAVIORS));
const FaceEnum = z.enum(FACE_NAMES as unknown as [string, ...string[]]);
const CueEnum = z.enum(ids(SOUND_CUES));

/**
 * What the model returns (PRD §6 rule 6, Tier 1 recipe). Only names are enforced here;
 * numeric ranges are clamped by lib/expression validation (STEP 8), not rejected.
 */
export const GenerationOutputSchema = z.object({
  name: z.string().min(1),
  currentStatus: z.string().min(1),
  reasoning: z.string().min(1),
  motion: z.object({
    steps: z
      .array(z.object({ behavior: BehaviorEnum, speed: z.number(), amplitude: z.number(), repeat: z.number().int(), face: FaceEnum.optional() }))
      .min(1)
      .max(6),
  }),
  face: z.object({ preset: FaceEnum }),
  sound: z.object({ cues: z.array(z.object({ preset: CueEnum, t: z.number() })).max(4) }),
});
export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;

const DescribeSchema = z.object({ summary: z.string().min(1) });

export interface GenerationRequest extends GenerationPromptInput {
  /** Reference images or video frames (data URLs / base64). Summarized by the vision model first. */
  images?: string[];
}

export interface GenerationResult {
  output: GenerationOutput;
  source: "ollama" | "demo";
  fallbackReason?: string;
  raw?: string;
  ms: number;
  model?: string;
  retried?: boolean;
  referenceSummary?: string;
  describeMs?: number;
}

export interface GenerateOptions {
  signal?: AbortSignal;
  onDelay?: () => void;
}

export interface GenerationClient {
  generate(req: GenerationRequest, opts?: GenerateOptions): Promise<GenerationResult>;
  /** STEP 12 Tier 2 (flag directClip): recipe + keyframes from reference frames. Throws on any failure. */
  directClip?(req: GenerationRequest & { images: string[]; structure: Structure }, opts?: GenerateOptions): Promise<{ output: DirectClipOutput; ms: number; model?: string }>;
  /** Vision step on its own (cached per reference by callers). */
  describe(images: string[], opts?: GenerateOptions): Promise<{ summary: string; ms: number }>;
}

// ---------------------------------------------------------------- demo

export function demoToOutput(demo: DemoExpression): GenerationOutput {
  return {
    name: demo.name,
    currentStatus: demo.currentStatus,
    reasoning: demo.reasoning,
    motion: {
      steps: demo.motion.recipe.steps.map(({ behavior, speed, amplitude, repeat, face }) => ({ behavior, speed, amplitude, repeat, ...(face ? { face } : {}) })),
    },
    face: { preset: demo.face.preset },
    sound: { cues: demo.sound.cues.map((c) => ({ preset: c.sound, t: c.t })) },
  };
}

const KEYWORDS: [RegExp, SuggestedPromptId][] = [
  [/tired|sleep|nod(ding)? off|yawn|exhaust/i, "tired"],
  [/startl|surpris|wow|shock|scare/i, "startled"],
  [/went well|great|proud|yay|success|happy|excit/i, "presentation"],
  [/hey|hello|\bhi\b|i'?m here|arriv|welcome/i, "here"],
];

const normalize = (s: string) => s.toLowerCase().replace(/[…!.?,]/g, "").replace(/\s+/g, " ").trim();

/** A chip's demo: the demo of the simulator behavior it plays as, with the chip's speed / amplitude. */
function componentDemo(sim: ComponentSim): DemoExpression {
  const demo = COMPONENT_DEMOS[sim.behavior];
  if (sim.speed === undefined && sim.amplitude === undefined) return demo;
  const steps = demo.motion.recipe.steps.map((s) => ({ ...s, speed: sim.speed ?? s.speed, amplitude: sim.amplitude ?? s.amplitude }));
  return { ...demo, motion: { ...demo.motion, recipe: { ...demo.motion.recipe, steps } } };
}

/** Pick the demo for a request: suggested prompt → component chip → keyword → greeting. */
export function pickDemo(req: Pick<GenerationRequest, "prompt" | "components">): DemoExpression {
  const text = normalize(req.prompt);
  const exact = SUGGESTED_PROMPTS.find((p) => normalize(p.text) === text || text.startsWith(normalize(p.text)));
  if (exact) return PROMPT_DEMOS[exact.id];
  const sim = req.components?.map((c) => componentOf(c)?.sim).find((s) => s && s.behavior in COMPONENT_DEMOS);
  if (sim) return componentDemo(sim);
  const hit = KEYWORDS.find(([re]) => re.test(req.prompt));
  return PROMPT_DEMOS[hit?.[1] ?? "here"];
}

export class DemoGeneration implements GenerationClient {
  constructor(private readonly reason = "Demo mode") {}

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    return { output: demoToOutput(pickDemo(req)), source: "demo", fallbackReason: this.reason, ms: 0 };
  }

  async describe(): Promise<{ summary: string; ms: number }> {
    return { summary: "", ms: 0 };
  }
}

// ---------------------------------------------------------------- ollama

export class OllamaGeneration implements GenerationClient {
  constructor(
    private readonly client: LlmClient,
    private readonly model = OLLAMA_MODEL,
    private readonly visionModel = OLLAMA_VISION_MODEL,
  ) {}

  async directClip(req: GenerationRequest & { images: string[]; structure: Structure }, opts: GenerateOptions = {}) {
    if (!(await this.client.available())) throw new LlmError("network", "Ollama unreachable");
    return generateDirectClip(this.client, req, opts, this.visionModel);
  }

  async describe(images: string[], opts: GenerateOptions = {}) {
    const res = await chatValidated(this.client, DescribeSchema, {
      system: DESCRIBE_SYSTEM,
      user: images.length > 1 ? `${images.length} frames of one video, in time order.` : "One reference image.",
      images,
      model: this.visionModel,
      signal: opts.signal,
      temperature: 0.3,
    });
    return { summary: res.value.summary, ms: res.ms };
  }

  /**
   * Text model generates; with images, the vision model summarizes them first
   * (qwen3 is text-only). Any failure except cancel falls back to the demo.
   */
  async generate(req: GenerationRequest, opts: GenerateOptions = {}): Promise<GenerationResult> {
    let referenceSummary = req.referenceSummary;
    let describeMs: number | undefined;
    try {
      if (!(await this.client.available())) throw new LlmError("network", "Ollama unreachable");
      if (req.images?.length && !referenceSummary) {
        const d = await this.describe(req.images, opts);
        referenceSummary = d.summary;
        describeMs = d.ms;
      }
      const res = await chatValidated(this.client, GenerationOutputSchema, {
        system: GENERATION_SYSTEM,
        user: generationUser({ ...req, referenceSummary }),
        model: this.model,
        signal: opts.signal,
        onDelay: opts.onDelay,
      });
      return { output: res.value, source: "ollama", raw: res.raw, ms: res.ms, model: res.model, retried: res.retried, referenceSummary, describeMs };
    } catch (err) {
      if (err instanceof LlmError && err.kind === "canceled") throw err;
      const reason = err instanceof Error ? err.message : String(err);
      const demo = await new DemoGeneration(reason).generate(req);
      return { ...demo, referenceSummary, describeMs };
    }
  }
}
