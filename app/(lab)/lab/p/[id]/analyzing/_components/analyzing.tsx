"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ROBOT_TYPES } from "@/data/robot-types";
import { STRINGS, fmt } from "@/data/strings";
import type { Job, Project } from "@/lib/models";
import { ANALYZE_STEP_MS } from "@/lib/robot/analyze";
import { api } from "@/lib/ui/api";
import { CHANNEL_LABEL } from "@/components/ui/channel-badges";
import { Icon } from "@/components/ui/icons/icon";
import { EmptyState, Loading } from "@/components/ui/states";

const S = STRINGS.analyzing;
const POLL_MS = 500;
const COMPLETE_HOLD_MS = 1500;

type StepState = "done" | "active" | "failed" | "todo";

function latest(jobs: Job[]): Job | null {
  return jobs.filter((j) => j.kind === "analyze-model").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

function duration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  return m > 0 ? fmt(S.minutes, { m, s: total % 60 }) : fmt(S.seconds, { s: total });
}

// Preview art (Figma 901:8482 ×2: 264 square on bg/canvas, radius/xl). joint-fixed uses the frame's own crop;
// other (import-estimated) types show their type-card cut-out.
function PreviewArt({ type }: { type: Project["type"] }) {
  if (type === "joint-fixed") {
    return (
      <div className="absolute left-[79.3px] top-[24px] h-[232px] w-[104.78px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/figma/type/joint-fixed.png" className="absolute left-[-101.32%] top-0 h-[223.33%] w-[395.58%] max-w-none" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" src={`/figma/type/${type}.png`} className="absolute inset-[24px] size-[216px] object-contain" />
  );
}

function StepIcon({ state }: { state: StepState }) {
  if (state === "done") return <Icon name="step-done" size={20} className="anim-check-pop shrink-0 text-[var(--bg-inverse)]" />;
  if (state === "active") return <Icon name="step-active" size={20} className="shrink-0 text-[var(--bg-inverse)]" />;
  return (
    <span
      className={`size-[20px] shrink-0 rounded-[var(--radius-full)] border-2 ${state === "failed" ? "border-[var(--border-error)]" : "border-[var(--border-default)]"}`}
    />
  );
}

// W02B-3 (Figma 901:8473 analyzing / 901:8525 complete) ×2: title block, ← Lab pill, Analysis card (preview + scan line,
// file info, percent / time left, progress bar, 4 steps), leave note. The complete frame has no Back pill; card sits 8px right of center as in Figma. Complete! → structure after 1.5 s; No rig found (E2).
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

  const input = job?.input as { source?: "pure-desk" | "import"; file?: { name: string; size: number } } | undefined;
  const stepMs = ANALYZE_STEP_MS[input?.source ?? "pure-desk"];
  const steps = S.steps.length;
  const running = job && (job.status === "running" || job.status === "queued");
  // Jobs report at step starts; fill in between from the step's known length.
  const inStep = running ? Math.min(Math.max(now - new Date(job.updatedAt).getTime(), 0) / stepMs, 0.95) : 0;
  const percent = done ? 100 : Math.min(99, Math.round((job?.progress ?? project.progress ?? 0) + (100 / steps) * inStep));
  const remaining = running ? Math.max(0, Math.ceil(((steps - job.step - inStep) * stepMs) / 1000)) : null;
  const failed = job?.status === "failed" || job?.status === "canceled";
  const noRig = job?.errorCode === "NO_RIG";

  const file = input?.file ?? project.structure?.file;
  const typeName = ROBOT_TYPES.find((t) => t.id === (project.structure?.type ?? project.type))?.name ?? project.type;
  const estimated = !done && input?.source === "import";
  const meta = [file ? `${Math.max(1, Math.round(file.size / 1024 / 1024))} MB` : null, estimated ? fmt(S.estimated, { type: typeName }) : typeName]
    .filter(Boolean)
    .join("  ·  ");
  const status = done && job ? fmt(S.doneIn, { t: duration(new Date(job.updatedAt).getTime() - new Date(job.createdAt).getTime()) }) : remaining !== null ? fmt(S.remaining, { s: remaining }) : null;
  const notes: (string | null)[] =
    done && project.structure
      ? [null, fmt(S.jointsFound, { n: project.structure.joints.length }), null, project.structure.channels.map((c) => CHANNEL_LABEL[c]).join(" / ")]
      : [];

  async function retry() {
    if (!job) return;
    await api(`/api/projects/${id}/analyze`, { method: "POST", body: JSON.stringify(job.input) });
  }

  const pillSecondary =
    "flex h-[48px] items-center rounded-[var(--radius-full)] border-2 border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-24)] text-[16px] font-medium leading-[20px] text-[var(--text-link)] hover:bg-[var(--neutral-50)]";
  const pillPrimary =
    "flex h-[48px] items-center rounded-[var(--radius-full)] bg-[var(--neutral-800)] px-[var(--space-24)] text-[16px] font-medium leading-[20px] text-[var(--neutral-100)] hover:bg-[var(--neutral-700)]";

  return (
    <div className="relative flex min-h-[var(--app-vh)] flex-col items-center overflow-hidden">
      {/* Figma 배경 901:8474: full-frame art at 70% */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/analyzing/bg@2x.png" alt="" aria-hidden className="pointer-events-none absolute inset-0 size-full object-cover opacity-70" />

      {!done && (
        <Link
          href="/lab"
          className="absolute left-[48px] top-[var(--space-40)] flex h-[48px] w-fit items-center gap-[var(--space-12)] rounded-[var(--radius-full)] border-2 border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-16)] text-[16px] font-medium leading-[20px] text-[var(--text-link)] hover:bg-[var(--neutral-50)]"
        >
          <span aria-hidden>←</span>
          <span>{STRINGS.sidebar.lab}</span>
        </Link>
      )}

      <header className="relative mt-[122px] flex w-[796px] flex-col items-center gap-[var(--space-28)] text-center">
        <h1 key={done ? "complete" : "analyzing"} className={`text-[52px] font-semibold leading-[66px] text-[var(--sage-800)] ${done ? "anim-pop-in" : ""}`}>{done ? S.complete : S.title}</h1>
        <p className="whitespace-nowrap text-[22px] leading-[28px] text-[var(--sage-500)]">{done ? S.completeBody : S.body}</p>
      </header>

      <section
        aria-label={project.name}
        className="relative left-[8px] mt-[196px] flex w-[912px] items-center gap-[var(--space-48)] rounded-[var(--radius-2xl)] border-2 border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-48)] py-[var(--space-40)] shadow-[0_12px_24px_0_var(--effect-shadow)]"
      >
        <div className="relative size-[264px] shrink-0 overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-canvas)]">
          <PreviewArt type={project.structure?.type ?? project.type} />
          {!done && !failed && (
            <>
              {/* Scan line follows the progress: top of the preview at 0 % → bottom at 100 % (Figma 901:8473 draws it at 116 px); glow trails 60 px above */}
              <div
                className="absolute left-0 w-full motion-reduce:transition-none"
                // glides linearly between polls so the line moves continuously with the percent
                style={{ top: `calc(${percent / 100} * (100% - 4px) - 60px)`, transition: `top ${POLL_MS}ms linear` }}
              >
                <div className="h-[60px] w-full bg-gradient-to-b from-[color-mix(in_srgb,var(--analyzing-scan)_0%,transparent)] to-[color-mix(in_srgb,var(--analyzing-scan)_12%,transparent)]" />
                <div className="h-[4px] w-full bg-gradient-to-r from-[color-mix(in_srgb,var(--analyzing-scan)_0%,transparent)] via-[color-mix(in_srgb,var(--analyzing-scan)_90%,transparent)] to-[color-mix(in_srgb,var(--analyzing-scan)_0%,transparent)]" />
              </div>
            </>
          )}
        </div>

        <div className="flex w-[500px] shrink-0 flex-col gap-[var(--space-24)]">
          <div className="flex flex-col gap-[var(--space-8)]">
            <p className="truncate text-[22px] font-semibold leading-[28px] text-[var(--text-primary)]">{file?.name ?? project.name}</p>
            <p className="whitespace-pre text-[16px] leading-[20px] text-[var(--text-secondary)]">{meta}</p>
          </div>

          {noRig ? (
            <div role="alert" className="flex flex-col gap-[var(--space-12)]">
              <p className="text-[18px] font-semibold leading-[22px] text-[var(--text-error)]">{S.noRig.title}</p>
              <p className="text-[16px] leading-[20px] text-[var(--text-secondary)]">{S.noRig.body}</p>
              <div className="mt-[var(--space-4)] flex gap-[var(--space-12)]">
                <button type="button" className={pillSecondary} onClick={() => router.push(`/lab/new/import?replace=${id}`)}>{S.tryAnother}</button>
                <button type="button" className={pillPrimary} onClick={() => router.push("/lab/new/type")}>{S.tryRobot}</button>
              </div>
            </div>
          ) : failed ? (
            <div role="alert" className="flex flex-col gap-[var(--space-12)]">
              <p className="text-[18px] font-semibold leading-[22px] text-[var(--text-error)]">{S.failed}</p>
              <button type="button" className={`${pillSecondary} self-start`} onClick={retry}>{S.retry}</button>
            </div>
          ) : (
            <div className="flex flex-col gap-[var(--space-12)]">
              <div className="flex items-start justify-between whitespace-nowrap">
                <span className="text-[18px] font-semibold leading-[22px] text-[var(--text-primary)]" data-testid="analyzing-percent">{`${percent}%`}</span>
                {status && <span className="text-[16px] leading-[20px] text-[var(--text-secondary)]">{status}</span>}
              </div>
              <div className="relative h-[6px] w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--neutral-150)]">
                <div className="absolute inset-y-0 left-0 rounded-[var(--radius-full)] bg-[var(--bg-inverse)] transition-[width] duration-500" style={{ width: `${percent}%` }} />
              </div>
            </div>
          )}

          <ol className="flex flex-col gap-[var(--space-16)]">
            {S.steps.map((label, i) => {
              const state: StepState =
                done || (job && i < job.step) ? "done" : job && i === job.step && running ? "active" : noRig && i === 1 ? "failed" : "todo";
              const strong = state === "done" || state === "active";
              return (
                <li key={label} className="flex items-center gap-[var(--space-16)] whitespace-nowrap">
                  <StepIcon state={state} />
                  <span
                    className={`text-[18px] leading-[22px] ${
                      strong ? "font-medium text-[var(--text-primary)]" : state === "failed" ? "text-[var(--text-error)]" : "text-[var(--text-tertiary)]"
                    }`}
                  >
                    {label}
                  </span>
                  {notes[i] && <span className="text-[16px] leading-[20px] text-[var(--text-secondary)]">{notes[i]}</span>}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {!done && !failed && <p className="relative mt-[22px] text-[16px] leading-[20px] text-[var(--text-secondary)]">{S.leaveNote}</p>}
    </div>
  );
}
