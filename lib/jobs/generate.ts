import fs from "node:fs/promises";
import path from "node:path";
import { PURE_DEFAULT_SIGNATURE } from "@/data/signature";
import { STRINGS } from "@/data/strings";
import { buildExpression, type BuiltExpression } from "../expression/build";
import type { Issue } from "../expression/validate";
import type { GenerationClient } from "../llm/generation";
import type { MotionProps, Reference } from "../models";
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

  await report(2, 30);
  const result = await client.generate(
    {
      prompt: input.prompt,
      currentStatus: input.currentStatus,
      components: input.components,
      pattern: input.pattern,
      structure: project.structure,
      signature,
      images: images.length ? images : undefined,
    },
    { signal },
  );

  await report(3, 85);
  const { expression, issues } = buildExpression(result.output, {
    structure: project.structure,
    signature,
    components: input.components,
    pattern: input.pattern,
    references: input.references,
    props: input.props,
  });

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
  };
}

async function save(repo: Repo, input: GenerateInput, expression: BuiltExpression) {
  if (input.expressionId) {
    const existing = await repo.expressions.get(input.expressionId).catch(() => null);
    if (existing && existing.projectId === input.projectId) return repo.expressions.update(input.expressionId, expression);
  }
  return repo.expressions.create(input.projectId, expression);
}
