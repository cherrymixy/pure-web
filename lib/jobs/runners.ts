import type { JobKind } from "../models";
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

// Real runners are added in their STEPs: analyze-model (10), signature-extract (7), generate (8/10).
export const RUNNERS: Partial<Record<JobKind, Runner>> = {
  "dev-echo": devEcho,
};
