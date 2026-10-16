"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { STRINGS, fmt } from "@/data/strings";
import type { Job, Project } from "@/lib/models";
import { ANALYZE_STEP_MS } from "@/lib/robot/analyze";
import { api } from "@/lib/ui/api";
import { Viewport } from "@/components/sim/Viewport";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading } from "@/components/ui/states";

const S = STRINGS.analyzing;
const POLL_MS = 500;
const COMPLETE_HOLD_MS = 1500;

function latest(jobs: Job[]): Job | null {
  return jobs.filter((j) => j.kind === "analyze-model").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

// W02B-3: preview + scan line, 4 steps, percent / time left, Complete! → structure, No rig found (E2).
export function Analyzing({ id }: { id: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [missing, setMissing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const leaving = useRef(false);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const [p, jobs] = await Promise.all([api<Project>(`/api/projects/${id}`), api<Job[]>(`/api/jobs?projectId=${id}`)]);
        if (!active) return;
        setProject(p);
        setJob(latest(jobs));
        setNow(Date.now());
      } catch (err) {
        if (active && (err as { status?: number }).status === 404) setMissing(true);
      }
    };
    void poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id]);

  const done = job?.status === "done" || (project && project.status !== "analyzing" && project.structure);
  useEffect(() => {
    if (!done || leaving.current) return;
    leaving.current = true;
    const t = setTimeout(() => router.push(`/lab/p/${id}/structure`), COMPLETE_HOLD_MS);
    return () => clearTimeout(t);
  }, [done, id, router]);

  if (missing) return <div className="p-10"><EmptyState title={STRINGS.common.notFound.title} body={STRINGS.common.notFound.body} /></div>;
  if (!project) return <Loading label={STRINGS.common.loading} />;

  const input = job?.input as { source?: "pure-desk" | "import" } | undefined;
  const stepMs = ANALYZE_STEP_MS[input?.source ?? "pure-desk"];
  const steps = S.steps.length;
  const running = job && (job.status === "running" || job.status === "queued");
  // Jobs report at step starts; fill in between from the step's known length.
  const inStep = running ? Math.min(Math.max(now - new Date(job.updatedAt).getTime(), 0) / stepMs, 0.95) : 0;
  const percent = done ? 100 : Math.min(99, Math.round((job?.progress ?? project.progress ?? 0) + (100 / steps) * inStep));
  const remaining = running ? Math.max(0, Math.ceil(((steps - job.step - inStep) * stepMs) / 1000)) : null;
  const failed = job?.status === "failed" || job?.status === "canceled";
  const noRig = job?.errorCode === "NO_RIG";

  async function retry() {
    if (!job) return;
    await api(`/api/projects/${id}/analyze`, { method: "POST", body: JSON.stringify(job.input) });
  }

  return (
    <div className="flex flex-col gap-6 p-10">
      <Link href="/lab" className="text-sm text-neutral-500">← {STRINGS.sidebar.lab}</Link>
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">{S.title}</h1>
        <span className="text-sm text-neutral-500">{project.name}</span>
      </header>

      <div className="grid grid-cols-[1fr_360px] gap-8">
        <div className="relative overflow-hidden rounded border border-neutral-200 text-neutral-700">
          <Viewport mode="preview" orbit={false} className="aspect-[4/3] w-full" />
          {!done && !failed && <div className="scan-line" />}
        </div>

        <div className="flex flex-col gap-5">
          {noRig ? (
            <div role="alert" className="flex flex-col gap-3 rounded border border-red-300 p-5">
              <h2 className="font-semibold text-red-600">{S.noRig.title}</h2>
              <p className="text-sm text-neutral-600">{S.noRig.body}</p>
              <div className="flex gap-2">
                <Button onClick={() => router.push(`/lab/new/import?replace=${id}`)}>{S.tryAnother}</Button>
                <Button variant="primary" onClick={() => router.push("/lab/new/type")}>{S.tryRobot}</Button>
              </div>
            </div>
          ) : failed ? (
            <div role="alert" className="flex flex-col gap-3 rounded border border-red-300 p-5">
              <p className="text-sm text-red-600">{S.failed}</p>
              <Button className="self-start" onClick={retry}>{S.retry}</Button>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-4xl font-semibold" data-testid="analyzing-percent">{done ? S.complete : `${percent}%`}</span>
                {remaining !== null && !done && <span className="text-sm text-neutral-500">{fmt(S.remaining, { s: remaining })}</span>}
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-neutral-200">
                <div className="h-full bg-neutral-700 transition-[width] duration-500" style={{ width: `${percent}%` }} />
              </div>
            </>
          )}

          <ol className="flex flex-col gap-2 text-sm">
            {S.steps.map((label, i) => {
              const state = done || (job && i < job.step) ? "done" : job && i === job.step && running ? "active" : noRig && i === 1 ? "failed" : "todo";
              return (
                <li key={label} className={`flex items-center gap-2 ${state === "todo" ? "text-neutral-400" : ""}`}>
                  <span className="w-4 text-center">{state === "done" ? "✓" : state === "active" ? "…" : state === "failed" ? "×" : "○"}</span>
                  {label}
                </li>
              );
            })}
          </ol>
          {!done && !failed && <p className="text-xs text-neutral-500">{S.leaveHint}</p>}
        </div>
      </div>
    </div>
  );
}
