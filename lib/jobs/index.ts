import "server-only";
import type { Job, JobKind } from "../models";
import type { Repo } from "../repo";
import { getRepo } from "../repo-server";
import { RUNNERS } from "./runners";

/**
 * Background jobs (CLAUDE.md rule 12): analysis, extraction and generation run as jobs
 * that survive leaving the page. State lives in the DB; after a server restart, jobs
 * still marked queued/running are resumed from their current step.
 */

export interface JobContext {
  repo: Repo;
  job: Job;
  signal: AbortSignal;
  /** Persist progress; `step` is where a restarted runner resumes. */
  report(p: { progress: number; step: number; stepLabel?: string }): Promise<void>;
}

export type Runner = (ctx: JobContext) => Promise<unknown>;

type JobState = { controllers: Map<string, AbortController>; resumed: boolean };
const g = globalThis as typeof globalThis & { __pureJobs?: JobState };
const state = (g.__pureJobs ??= { controllers: new Map(), resumed: false });

function run(repo: Repo, job: Job): void {
  const runner = RUNNERS[job.kind];
  const controller = new AbortController();
  state.controllers.set(job.id, controller);
  (async () => {
    try {
      if (!runner) throw new Error(`No runner for ${job.kind}`);
      let current = await repo.jobs.update(job.id, { status: "running" });
      const result = await runner({
        repo,
        job: current,
        signal: controller.signal,
        report: async (p) => {
          if (controller.signal.aborted) return;
          current = await repo.jobs.update(job.id, p);
        },
      });
      if (!controller.signal.aborted) await repo.jobs.update(job.id, { status: "done", progress: 100, result });
    } catch (err) {
      if (!controller.signal.aborted) {
        const code = (err as { code?: unknown }).code;
        await repo.jobs.update(job.id, {
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
          ...(typeof code === "string" ? { errorCode: code } : {}),
        });
      }
    } finally {
      state.controllers.delete(job.id);
    }
  })();
}

export async function startJob(kind: JobKind, projectId: string | null, input: unknown): Promise<Job> {
  await resumeJobs();
  const repo = getRepo();
  const job = await repo.jobs.create(kind, projectId, input);
  run(repo, job);
  return job;
}

export async function cancelJob(id: string): Promise<Job> {
  const repo = getRepo();
  const job = await repo.jobs.get(id);
  if (job.status !== "queued" && job.status !== "running") return job;
  state.controllers.get(id)?.abort();
  return repo.jobs.update(id, { status: "canceled" });
}

/** Once per process: pick up jobs a previous server left unfinished. */
export async function resumeJobs(): Promise<void> {
  if (state.resumed) return;
  state.resumed = true;
  const repo = getRepo();
  for (const job of await repo.jobs.list({ active: true })) {
    if (!state.controllers.has(job.id)) run(repo, job);
  }
}
