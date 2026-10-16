import { getExtraction } from "../llm";
import type { JobKind } from "../models";
import { SignatureError } from "../signature/errors";
import type { Extracted, SourceInput } from "../signature/extract";
import { SIGNATURE_STEPS, assertReadable, buildDraft, extractSource, toneFromSources } from "../signature/run";
import type { Runner } from ".";

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("canceled"));
    });
  });

/** Test job: 4 steps of `ms` each, resumable from its step. */
const devEcho: Runner = async ({ job, signal, report }) => {
  const { steps = 4, ms = 800, message = "echo" } = (job.input ?? {}) as { steps?: number; ms?: number; message?: string };
  for (let step = job.step; step < steps; step++) {
    await report({ progress: Math.round((step / steps) * 100), step, stepLabel: `Step ${step + 1} of ${steps}` });
    await wait(ms, signal);
  }
  return { message, steps };
};

/**
 * W02C brand signature: Reading → Colors → Type → Tone → Signature.
 * The extraction is kept in job.result so a resumed job skips re-reading.
 */
const signatureExtract: Runner = async ({ repo, job, signal, report }) => {
  const input = job.input as { projectId: string; source: SourceInput; regenerate?: boolean };
  const label = (step: number) => SIGNATURE_STEPS[step];
  const saved = (job.result as { extracted?: Extracted } | undefined)?.extracted;
  try {
    await report({ progress: 5, step: 0, stepLabel: label(0) });
    const extracted = saved ?? (await extractSource(input.source));
    assertReadable(extracted);
    await repo.jobs.update(job.id, { result: { extracted } });
    await report({ progress: 30, step: 1, stepLabel: label(1) });
    await report({ progress: 45, step: 2, stepLabel: label(2) });
    await report({ progress: 55, step: 3, stepLabel: label(3) });
    const tone = await toneFromSources(extracted, await getExtraction(), { signal, temperature: input.regenerate ? 0.8 : 0.2 });
    await report({ progress: 90, step: 4, stepLabel: label(4) });
    const signature = await repo.signatures.addVersion(input.projectId, buildDraft(extracted, tone.output, { source: input.source, demo: tone.source === "demo" }));
    return {
      signature,
      extracted: { name: extracted.name, kind: extracted.kind, colors: extracted.colors, fonts: extracted.fonts, pageCount: extracted.pageCount },
      evidence: tone.output.tone,
      source: tone.source,
      fallbackReason: tone.fallbackReason,
    };
  } catch (err) {
    if (err instanceof SignatureError) throw Object.assign(new Error(err.message), { code: err.code });
    throw err;
  }
};

// Remaining runners arrive in their STEPs: analyze-model (10), generate (8/10).
export const RUNNERS: Partial<Record<JobKind, Runner>> = {
  "dev-echo": devEcho,
  "signature-extract": signatureExtract,
};
