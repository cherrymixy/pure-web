import { PURE_DESK_STRUCTURE } from "@/data/pure-desk";
import { STRINGS } from "@/data/strings";
import type { Structure } from "../models";
import type { Repo } from "../repo";
import { ANALYZE_STEP_MS, structureFromReading, type ModelReading } from "./analyze";

export type AnalyzeInput =
  | { source: "pure-desk" }
  | { source: "import"; file: { name: string; size: number; path: string }; reading: ModelReading };

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (ms <= 0) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("canceled"));
    });
  });

/**
 * W02B-3: Reading the mesh → Finding joints → Checking joint limits → Detecting channels.
 * The bones were read in the browser (three.js); this stages, validates and saves. Resumes from `fromStep`.
 */
export async function runAnalysis(opts: {
  repo: Repo;
  projectId: string;
  input: AnalyzeInput;
  fromStep?: number;
  signal?: AbortSignal;
  report?: (p: { progress: number; step: number; stepLabel: string }) => Promise<void>;
  /** Per step; defaults to the staged ANALYZE_STEP_MS */
  stepMs?: number;
}): Promise<{ joints: number; type: Structure["type"] }> {
  const { repo, projectId, input } = opts;
  const steps = STRINGS.analyzing.steps;
  const ms = opts.stepMs ?? ANALYZE_STEP_MS[input.source];
  // Build first: a model without bones fails at "Finding joints" (E2).
  let structure: Structure | null = null;
  let failure: unknown = null;
  try {
    structure = input.source === "pure-desk" ? PURE_DESK_STRUCTURE : structureFromReading(input.reading, input.file);
  } catch (err) {
    failure = err;
  }
  for (let step = opts.fromStep ?? 0; step < steps.length; step++) {
    const progress = Math.round((step / steps.length) * 100);
    await opts.report?.({ progress, step, stepLabel: steps[step] });
    await repo.projects.update(projectId, { progress });
    if (step === 1 && failure) throw failure;
    await sleep(ms, opts.signal);
  }
  await repo.projects.setStructure(projectId, structure!, { replace: true });
  await repo.projects.update(projectId, { status: "draft", progress: 100 });
  return { joints: structure!.joints.length, type: structure!.type };
}
