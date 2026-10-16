import fs from "node:fs/promises";
import path from "node:path";
import { PURE_DEFAULT_SIGNATURE } from "@/data/signature";
import { STRINGS } from "@/data/strings";
import { buildExpression, type BuiltExpression } from "../expression/build";
import { clipFromDirect } from "../expression/direct";
import { FLAGS } from "../env";
import { LlmError } from "../llm/client";
import type { Issue } from "../expression/validate";
import type { GenerationClient, GenerationOutput } from "../llm/generation";
import type { Clip, MotionProps, Reference } from "../models";
import { UPLOADS_DIR } from "../paths";
import type { Repo } from "../repo";

export interface GenerateInput {
  projectId: string;
  prompt: string;
  currentStatus?: string;
  components?: string[];
  pattern?: string;
  references?: Reference[];
  /** Regenerate into this expression (previous version kept in history) */
  expressionId?: string;
  props?: MotionProps;
}

export interface GenerateResult {
  expressionId: string;
  source: "ollama" | "demo";
  fallbackReason?: string;
  reasoning: string;
  referenceSummary?: string;
  issues: Issue[];
  ms: number;
  /** STEP 12: present when the directClip flag tried Tier 2 */
  directClip?: { used: boolean; reason?: string; ms: number; issues: number };
}

export const GENERATE_STEPS = STRINGS.editor.genSteps;
const MAX_IMAGES = 8;

/** Reference frames (or the image itself) as base64 for the vision model. Failed references are skipped. */
export async function referenceImages(refs: Reference[], root = UPLOADS_DIR): Promise<string[]> {
  const files = refs.filter((r) => r.status === "ok").flatMap((r) => (r.frames?.length ? r.frames : r.kind === "image" ? [r.path] : []));
  const out: string[] = [];
  for (const rel of files.slice(0, MAX_IMAGES)) {
    const abs = path.resolve(root, rel);
    if (!abs.startsWith(path.resolve(root) + path.sep)) continue;
    try {
      out.push((await fs.readFile(abs)).toString("base64"));
    } catch {
      // missing frame: generate without it
    }
  }
  return out;
}

/**
 * W02D generation: prompt + context + structure + signature → validated expression, saved.
 * The client already falls back to the demo on any failure except cancel.
 */
export async function runGeneration(opts: {
  repo: Repo;
  client: GenerationClient;
  input: GenerateInput;
  signal?: AbortSignal;
  report?: (p: { progress: number; step: number; stepLabel: string }) => Promise<void>;
  root?: string;
}): Promise<GenerateResult> {
  const { repo, client, input, signal } = opts;
  const report = (step: number, progress: number) => opts.report?.({ step, progress, stepLabel: GENERATE_STEPS[step] }) ?? Promise.resolve();

  await report(0, 5);
  const project = await repo.projects.get(input.projectId);
  if (!project.structure) throw Object.assign(new Error("Confirm the robot structure first"), { code: "NO_STRUCTURE" });
  const signature = (await repo.signatures.current(input.projectId)) ?? PURE_DEFAULT_SIGNATURE;

  await report(1, 15);
  const images = await referenceImages(input.references ?? [], opts.root);
  const motionRefs = await userDataSummary(repo, input.references ?? []);

  await report(2, 30);
  const request = {
    prompt: input.prompt,
    currentStatus: input.currentStatus,
    components: input.components,
    pattern: input.pattern,
    structure: project.structure,
    signature,
    images: images.length ? images : undefined,
    // No images to describe: User Data motions go in as text instead.
    referenceSummary: images.length ? undefined : motionRefs,
  };

  // Tier 2 (flag): the vision model writes keyframes + recipe in one answer; unusable keyframes → its recipe.
  let output: GenerationOutput | null = null;
  let clip: Clip | null = null;
  let direct: GenerateResult["directClip"];
  const settings = await repo.settings.get();
  if ((settings.directClip || FLAGS.directClip) && images.length && client.directClip) {
    const started = Date.now();
    try {
      const d = await client.directClip({ ...request, images, structure: project.structure }, { signal });
      const checked = clipFromDirect(d.output.clip, project.structure);
      output = d.output;
      clip = checked.clip;
      direct = { used: !!clip, reason: checked.reason, ms: d.ms, issues: checked.issues.length };
    } catch (err) {
      if (err instanceof LlmError && err.kind === "canceled") throw err;
      direct = { used: false, reason: err instanceof Error ? err.message : String(err), ms: Date.now() - started, issues: 0 };
    }
  }
  const result = output
    ? { output, source: "ollama" as const, fallbackReason: undefined, referenceSummary: undefined, ms: direct?.ms ?? 0 }
    : await client.generate(request, { signal });

  await report(3, 85);
  const built = buildExpression(result.output, {
    structure: project.structure,
    signature,
    components: input.components,
    pattern: input.pattern,
    references: input.references,
    props: input.props,
  });
  const { issues } = built;
  const expression: BuiltExpression = clip ? { ...built.expression, motion: { ...built.expression.motion, mode: "clip", clip } } : built.expression;

  // Stop keeps the previous result, even when the fallback finished instantly.
  if (signal?.aborted) throw Object.assign(new Error("canceled"), { code: "CANCELED" });
  await report(4, 95);
  const saved = await save(repo, input, expression);
  return {
    expressionId: saved.id,
    source: result.source,
    fallbackReason: result.fallbackReason,
    reasoning: result.output.reasoning,
    referenceSummary: result.referenceSummary,
    issues,
    ms: result.ms,
    ...(direct ? { directClip: direct } : {}),
  };
}

/** User Data references (`kind: "userData"`, path = motion id) → "Reference motion …" text. */
export async function userDataSummary(repo: Repo, refs: Reference[]): Promise<string | undefined> {
  const lines: string[] = [];
  for (const r of refs.filter((x) => x.kind === "userData" && x.status === "ok")) {
    const m = await repo.userData.get(r.path).catch(() => null);
    if (m) lines.push(`Reference motion "${m.name}" (${m.category}): ${m.preview.steps.map((s) => s.behavior).join(" → ")}`);
  }
  return lines.length ? lines.join("; ") : undefined;
}

async function save(repo: Repo, input: GenerateInput, expression: BuiltExpression) {
  if (input.expressionId) {
    const existing = await repo.expressions.get(input.expressionId).catch(() => null);
    if (existing && existing.projectId === input.projectId) return repo.expressions.update(input.expressionId, expression);
  }
  return repo.expressions.create(input.projectId, expression);
}
