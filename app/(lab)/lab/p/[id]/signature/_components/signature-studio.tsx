"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FACE_PRESETS } from "@/data/face-presets";
import { AXIS_INFO, AXIS_ORDER, PURE_DEFAULT_SIGNATURE, TONE_DICTIONARY } from "@/data/signature";
import { STRINGS, fmt } from "@/data/strings";
import type { Axis, Job, Signature } from "@/lib/models";
import { axesFromTone, paramEffect, signatureToParams, type ToneEvidence } from "@/lib/signature/axes";
import { ApiError, api } from "@/lib/ui/api";
import type { SimController } from "@/components/sim/sim-controller";
import { Viewport } from "@/components/sim/Viewport";
import { Button } from "@/components/ui/button";
import { ConfirmModal, Modal } from "@/components/ui/modal";
import { Icon } from "@/components/ui/icons/icon";
import { Radar } from "@/components/ui/radar";
import { StageSteps } from "@/components/ui/stage-steps";
import { useToast } from "@/components/ui/toast";
import { useUnsavedChanges } from "@/components/ui/use-unsaved";

const S = STRINGS.signature;
const POLL_MS = 400;
const SAMPLE_PDF = "Purebot_Brand_Guide.pdf";

type Source = { kind: "pdf"; path: string; name: string } | { kind: "url"; url: string };
type ExtractResult = {
  signature: Signature;
  extracted: { name: string; kind: string; colors: string[]; fonts: string[]; pageCount: number };
  evidence: { keyword: string; page: number; quote: string }[];
  source: "ollama" | "demo";
};
type Draft = { axes: Record<Axis, number>; tone: string[]; mapping: Signature["mapping"] };

function uploadPdf(file: Blob, name: string, projectId: string): Promise<{ path: string; name: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/api/upload?projectId=${encodeURIComponent(projectId)}&kind=pdf&name=${encodeURIComponent(name)}`);
    xhr.onload = () => {
      const json = JSON.parse(xhr.responseText || "null");
      if (xhr.status < 300) resolve(json);
      else reject(new ApiError(xhr.status, json?.error?.code ?? "UPLOAD", json?.error?.message ?? "Upload failed"));
    };
    xhr.onerror = () => reject(new ApiError(0, "UPLOAD", "Upload failed"));
    xhr.send(file);
  });
}

/** Source of a saved version, if it can be re-read (Regenerate). */
function sourceOf(sig: Signature | undefined): Source | null {
  const src = sig?.sources[0];
  if (src?.kind === "pdf" && src.path) return { kind: "pdf", path: src.path, name: src.name };
  const url = (src as { url?: string } | undefined)?.url;
  if (src?.kind === "url" && url) return { kind: "url", url };
  return null;
}

// W02C-1~3 (Figma 901:8764 / 8904 / 9107 / 9367 ×2): stage Viewport + Left Panel (source input → reading → extracted,
// tone, How it maps) + Right Panel (draggable 8-axis draft, versions, actions), bottom reading steps.
export function SignatureStudio({
  projectId,
  name,
  initialVersions,
  initialCurrentId,
}: {
  projectId: string;
  name: string;
  initialVersions: Signature[];
  initialCurrentId: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const ctrl = useRef<SimController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [versions, setVersions] = useState(initialVersions);
  const [currentId, setCurrentId] = useState(initialCurrentId);
  const [job, setJob] = useState<Job | null>(null);
  const [lastExtract, setLastExtract] = useState<ExtractResult | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [compareV, setCompareV] = useState<number | null>(null);
  const [quote, setQuote] = useState<{ keyword: string; page: number; quote?: string } | null>(null);
  const [skipOpen, setSkipOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [newTone, setNewTone] = useState("");
  const [busy, setBusy] = useState(false);

  const current = versions.find((v) => v.id === currentId) ?? versions.at(-1);
  const running = job !== null && (job.status === "queued" || job.status === "running");
  useUnsavedChanges(draft !== null);

  const reload = useCallback(async () => {
    const [list, project] = await Promise.all([
      api<Signature[]>(`/api/projects/${projectId}/signatures`),
      api<{ signatureId?: string }>(`/api/projects/${projectId}`),
    ]);
    setVersions(list);
    setCurrentId(project.signatureId ?? null);
  }, [projectId]);

  // Pick up a running extraction (rule 12) and the latest result's evidence.
  useEffect(() => {
    api<Job[]>(`/api/jobs?projectId=${projectId}`).then((jobs) => {
      const extracts = jobs.filter((j) => j.kind === "signature-extract").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const active = extracts.find((j) => j.status === "queued" || j.status === "running");
      if (active) setJob(active);
      const done = extracts.find((j) => j.status === "done");
      if (done) setLastExtract(done.result as ExtractResult);
    }, () => {});
  }, [projectId]);

  useEffect(() => {
    if (!running || !job) return;
    const timer = setInterval(async () => {
      const next = await api<Job>(`/api/jobs/${job.id}`).catch(() => null);
      if (!next) return;
      setJob(next);
      if (next.status === "done") {
        setLastExtract(next.result as ExtractResult);
        setDraft(null);
        await reload();
      } else if (next.status === "failed") {
        setError({ code: next.errorCode ?? "FAILED", message: next.error ?? "" });
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [running, job, reload]);

  async function start(source: Source, regenerate = false) {
    setError(null);
    setUrlError(null);
    try {
      setJob(await api<Job>("/api/signature/extract", { method: "POST", body: JSON.stringify({ projectId, source, regenerate }) }));
    } catch (err) {
      if (err instanceof ApiError && err.code === "FIGMA_UNSUPPORTED") setUrlError(`${S.figmaError.title}. ${S.figmaError.body}`);
      else if (err instanceof ApiError && source.kind === "url") setUrlError(err.message);
      else setError({ code: err instanceof ApiError ? err.code : "FAILED", message: (err as Error).message });
    }
  }

  async function startPdf(file: Blob, fileName: string) {
    if (!fileName.toLowerCase().endsWith(".pdf")) return setError({ code: "UNSUPPORTED", message: "PDF only" });
    setBusy(true);
    try {
      const up = await uploadPdf(file, fileName, projectId);
      await start({ kind: "pdf", path: up.path, name: up.name });
    } catch (err) {
      setError({ code: err instanceof ApiError ? err.code : "UPLOAD", message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function useSample() {
    const blob = await (await fetch(`/demo/${SAMPLE_PDF}`)).blob();
    await startPdf(blob, SAMPLE_PDF);
  }

  // ------------------------------------------------------------ draft editing

  const base: Draft | null = current ? { axes: current.axes as Record<Axis, number>, tone: current.tone, mapping: current.mapping } : null;
  const shown = draft ?? base;

  /** Evidence per tone keyword: page + quote from the last extraction when it produced this version. */
  const evidence = useMemo(() => {
    const map = new Map<string, ToneEvidence>();
    for (const e of lastExtract?.evidence ?? []) map.set(e.keyword, { keyword: e.keyword, page: lastExtract?.extracted.kind === "pdf" ? e.page : undefined, quote: e.quote });
    for (const m of current?.mapping ?? []) {
      const kw = m.reason.match(/“([^”]+)”/)?.[1];
      if (kw && !map.has(kw)) map.set(kw, { keyword: kw, page: m.page });
    }
    return map;
  }, [lastExtract, current]);

  function retone(tone: string[]) {
    const { axes, mapping } = axesFromTone(tone.map((k) => evidence.get(k) ?? { keyword: k }));
    setDraft({ axes, tone, mapping });
  }

  function dragAxis(axis: Axis, value: number) {
    if (!shown) return;
    setDraft({ ...shown, axes: { ...shown.axes, [axis]: value } });
  }

  async function saveDraft(): Promise<Signature | null> {
    if (!draft || !current) return current ?? null;
    const sig = await api<Signature>(`/api/projects/${projectId}/signatures`, {
      method: "POST",
      body: JSON.stringify({ name: current.name, axes: draft.axes, tone: draft.tone, mapping: draft.mapping, sources: current.sources, note: `Edited from v0.${current.version}` }),
    });
    setDraft(null);
    await reload();
    toast(fmt(S.savedToast, { v: sig.version }));
    return sig;
  }

  async function restore(version: number) {
    await api(`/api/projects/${projectId}/signatures/${version}/restore`, { method: "POST" });
    setDraft(null);
    setCompareV(null);
    await reload();
  }

  async function skip() {
    setSkipOpen(false);
    const { id: _id, version: _v, createdAt: _c, ...draftDefault } = PURE_DEFAULT_SIGNATURE;
    await api(`/api/projects/${projectId}/signatures`, { method: "POST", body: JSON.stringify(draftDefault) });
    router.push(`/lab/p/${projectId}`);
  }

  async function review() {
    await saveDraft();
    router.push(`/lab/p/${projectId}`);
  }

  async function saveAndReturn() {
    const sig = await saveDraft();
    toast(fmt(S.savedToast, { v: sig?.version ?? "" }), { label: S.continue, onClick: () => router.push(`/lab/p/${projectId}`) });
    router.push("/lab");
  }

  // ------------------------------------------------------------ preview

  const params = useMemo(() => (shown ? signatureToParams(shown.axes) : null), [shown]);
  const playback = params?.playback;
  const eyeSize = params?.face.eyeSize;
  useEffect(() => {
    if (eyeSize !== undefined) ctrl.current?.setFace({ preset: "neutral", tokens: { ...FACE_PRESETS.neutral, eyeSize } });
  }, [eyeSize]);

  // ------------------------------------------------------------ render

  const regenSource = sourceOf(current);
  const compareSig = compareV !== null ? versions.find((v) => v.version === compareV) : undefined;
  const fromThisVersion = lastExtract?.signature.id === current?.id || lastExtract?.signature.tone.join() === current?.tone.join();
  const extracted = fromThisVersion ? lastExtract?.extracted : undefined;
  const showResult = !running && !error && current && shown;
  const jobSource = running && job ? (job.input as { source?: Source } | undefined)?.source : undefined;
  const pill =
    "absolute top-[var(--space-40)] flex h-[48px] items-center gap-[var(--space-12)] whitespace-pre rounded-[var(--radius-full)] border-2 border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-20)] text-[16px] font-medium leading-[20px] text-[var(--text-link)] hover:bg-[var(--neutral-50)]";
  const label = "text-[12px] font-semibold leading-[15px] text-[var(--text-tertiary)]";
  const sub = "text-[14px] font-medium leading-[18px] text-[var(--sage-900)]";

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Stage (Figma 901:8765 ×2: full width, 265 → bottom), same slot as the structure page. Never zoom/transform the Viewport. */}
      <div className="absolute inset-x-0 bottom-0 top-[265px]">
        <Viewport controllerRef={ctrl} mode="preview" orbit={false} signatureParams={playback} className="block size-full" />
      </div>

      <Link href={`/lab/p/${projectId}/structure`} className={`${pill} left-[48px]`}>
        {`←  ${S.backStructure}`}
      </Link>
      <p className={`absolute left-[220px] top-[55px] ${label}`}>{STRINGS.structure.preview}</p>
      {showResult ? (
        <button type="button" onClick={saveAndReturn} className={`${pill} right-[44px]`}>{S.saveReturn}</button>
      ) : (
        <button type="button" onClick={() => setSkipOpen(true)} className={`${pill} right-[44px]`}>{S.skipStep}</button>
      )}

      {/* Left Panel (Figma 901:8849 ×2): 424×920 at 50,100, padding 32/24, radius xl. Scrolls where Figma clips. */}
      <section
        aria-label={name}
        className="absolute left-[50px] top-[100px] flex h-[920px] w-[424px] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--neutral-0)] bg-[var(--bg-surface)] px-[var(--space-32)] py-[var(--space-24)]"
      >
        <div className="-mr-[var(--space-16)] flex min-h-0 flex-col gap-[var(--space-20)] overflow-y-auto pr-[var(--space-16)]">
          <header className="flex w-[345px] flex-col gap-[var(--space-8)]">
            <p className={label}>{S.title}</p>
            <h1 className="text-[20px] font-medium leading-[25px] text-[var(--sage-900)]">{S.intro}</h1>
          </header>

          <form
            className="flex w-[364px] flex-col gap-[var(--space-8)]"
            onSubmit={(e) => { e.preventDefault(); if (url.trim()) void start({ kind: "url", url: url.trim() }); }}
          >
            <div
              className={`flex h-[48px] items-center justify-between gap-[var(--space-12)] rounded-[var(--radius-sm)] border bg-[var(--bg-surface)] pl-[var(--space-12)] pr-[var(--space-8)] ${urlError ? "border-[var(--border-error)]" : "border-[var(--border-default)]"}`}
            >
              <input
                value={url}
                onChange={(e) => { setUrl(e.target.value); setUrlError(null); }}
                placeholder={S.url}
                aria-label={S.url}
                aria-invalid={urlError !== null}
                disabled={running}
                className="min-w-0 flex-1 bg-transparent pb-[var(--space-4)] text-[12px] leading-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--neutral-500)]"
              />
              <button
                type="submit"
                disabled={!url.trim() || busy || running}
                className="flex h-[38px] w-[72px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--bg-inverse)] text-[12px] font-medium leading-[15px] text-[var(--text-on-inverse)] disabled:cursor-not-allowed"
              >
                {S.extract}
              </button>
            </div>
            {urlError && <p role="alert" className="text-[12px] leading-[15px] text-[var(--text-error)]">{urlError}</p>}
          </form>

          <div className="flex w-[364px] flex-col gap-[var(--space-8)]">
            <div
              data-testid="pdf-drop"
              role="button"
              tabIndex={0}
              aria-disabled={busy || running}
              onClick={() => !busy && !running && fileInput.current?.click()}
              onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !busy && !running) { e.preventDefault(); fileInput.current?.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f && !running) void startPdf(f, f.name);
              }}
              className={`flex h-[175px] cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border-[1.5px] border-dashed bg-[var(--neutral-50)] ${dragging ? "border-[var(--border-strong)]" : "border-[var(--border-default)]"}`}
            >
              <div className={`flex flex-col items-center gap-[var(--space-4)] ${dragging ? "" : "opacity-40"}`}>
                <Icon name="cloud-download" size={48} className="text-[var(--sage-900)]" />
                <span className="text-[16px] font-medium leading-[20px] text-[var(--sage-900)]">{S.dropPdf}</span>
                <span className="text-[12px] leading-[15px] text-[var(--text-secondary)]">{S.dropHint}</span>
              </div>
            </div>
            <button
              type="button"
              disabled={busy || running}
              onClick={useSample}
              className="self-start text-[12px] font-medium leading-[15px] text-[var(--text-link)] underline disabled:opacity-40"
            >
              {S.sample}
            </button>
            <input ref={fileInput} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void startPdf(f, f.name); e.target.value = ""; }} />
          </div>

          {/* Reading (Figma 901:9007 / 9067): source row + progress. */}
          {running && job && (
            <section className="flex flex-col gap-[var(--space-20)]" data-testid="sig-reading">
              <SourceRow name={jobSource ? (jobSource.kind === "pdf" ? jobSource.name : jobSource.url) : S.title} detail={fmt(S.sourceReading, { progress: job.progress })} state="reading" />
              <div className="flex flex-col gap-[var(--space-12)]">
                <p className="whitespace-pre text-[16px] font-medium leading-[20px] text-[var(--text-link)]">{`${job.stepLabel ?? S.steps[job.step] ?? ""}…  ${job.progress}%`}</p>
                <div className="h-[6px] w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--sage-50)]">
                  <div className="h-full bg-[var(--bg-inverse)] transition-[width] duration-300" style={{ width: `${job.progress}%` }} />
                </div>
                <p className="text-[12px] leading-[15px] text-[var(--text-secondary)]">{STRINGS.analyzing.leaveHint}</p>
              </div>
            </section>
          )}

          {/* E1 failure card. */}
          {error && !running && (
            <section role="alert" className="flex flex-col gap-[var(--space-12)] rounded-[var(--radius-sm)] bg-[var(--bg-error-subtle)] p-[var(--space-16)]">
              <h2 className="text-[14px] font-medium leading-[18px] text-[var(--text-error)]">{error.code === "FIGMA_UNSUPPORTED" ? S.figmaError.title : S.failed.title}</h2>
              <p className="text-[12px] leading-[15px] text-[var(--text-link)]">{error.code === "FIGMA_UNSUPPORTED" ? S.figmaError.body : S.failed.body}</p>
              <div className="flex gap-[var(--space-8)]">
                <button
                  type="button"
                  onClick={() => { setError(null); fileInput.current?.click(); }}
                  className="h-[38px] rounded-[var(--radius-full)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-16)] text-[12px] font-medium leading-[15px] text-[var(--sage-900)]"
                >
                  {S.tryAnother}
                </button>
                <button type="button" onClick={skip} className="h-[38px] rounded-[var(--radius-full)] bg-[var(--sage-900)] px-[var(--space-16)] text-[12px] font-medium leading-[15px] text-[var(--text-on-inverse)]">
                  {S.useDefault}
                </button>
              </div>
            </section>
          )}

          {showResult && (
            <>
              <ul className="flex flex-col gap-[var(--space-12)]" aria-label={S.sources}>
                {current.sources.map((src) => (
                  <li key={src.name}>
                    <SourceRow
                      name={src.name}
                      detail={src.kind === "pdf" && extracted?.kind === "pdf" ? fmt(S.sourcePages, { pages: extracted.pageCount }) : src.kind === "default" ? src.kind : S.sourceDone}
                      state="done"
                    />
                  </li>
                ))}
              </ul>
              <div className="h-px w-full shrink-0 bg-[var(--neutral-150)]" />

              {/* Extracted (Figma 901:9271): colors, type, tone chips. */}
              <section className="flex flex-col gap-[var(--space-12)]">
                <h2 className={label}>{S.extracted}</h2>
                <div className="flex flex-col gap-[var(--space-16)]">
                  {extracted && (
                    <div className="flex items-start gap-[56px]">
                      <div className="flex w-[145px] flex-col gap-[var(--space-8)]">
                        <h3 className={sub}>{S.palette}</h3>
                        <div className="flex flex-wrap gap-[var(--space-8)]">
                          {extracted.colors.map((c) => (
                            // Brand colors from the source are data, not UI tokens.
                            <span key={c} title={c} className="size-[36px] rounded-[var(--radius-sm)] border border-[var(--border-default)]" style={{ background: c }} />
                          ))}
                        </div>
                      </div>
                      <div className="flex w-[96px] flex-col">
                        <h3 className={sub}>{S.typeface}</h3>
                        <span className="text-[40px] font-medium leading-[50px] text-[var(--sage-900)]">Aa</span>
                        <span className="text-[12px] leading-[15px] text-[var(--text-secondary)]">{extracted.fonts.join(", ") || "—"}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-[var(--space-8)]">
                    <h3 className={sub}>{S.tone}</h3>
                    <div className="flex flex-wrap items-center gap-[var(--space-8)]">
                      {shown.tone.map((t) => (
                        <span key={t} data-testid="tone-chip" className="flex h-[30px] items-center gap-[var(--space-8)] rounded-[var(--radius-full)] bg-[var(--sage-50)] px-[var(--space-16)] text-[14px] font-medium leading-[18px] text-[var(--sage-900)]">
                          {t}
                          <button
                            type="button"
                            aria-label={fmt(S.removeTone, { tone: t })}
                            className="-mr-[var(--space-4)] text-[var(--text-secondary)] hover:text-[var(--sage-900)]"
                            onClick={() => retone(shown.tone.filter((x) => x !== t))}
                          >
                            <Icon name="close" size={14} />
                          </button>
                        </span>
                      ))}
                      <select
                        value={newTone}
                        onChange={(e) => {
                          const k = e.target.value;
                          setNewTone("");
                          if (k && !shown.tone.includes(k)) retone([...shown.tone, k]);
                        }}
                        className="h-[30px] cursor-pointer appearance-none rounded-[var(--radius-full)] bg-[var(--bg-canvas)] px-[var(--space-16)] text-[14px] font-medium leading-[18px] text-[var(--text-secondary)]"
                        aria-label={S.addTone}
                      >
                        <option value="">+ {S.addTone}</option>
                        {Object.keys(TONE_DICTIONARY).filter((k) => !shown.tone.includes(k)).map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                  </div>
                  {fromThisVersion && lastExtract?.source === "demo" && <p className="text-[12px] leading-[15px] text-[var(--text-secondary)]">{S.demoNote}</p>}
                </div>
              </section>

              {/* How it maps (Figma 901:9300): keyword → axis value · effect, p.N → quote. */}
              <section className="flex flex-col gap-[var(--space-12)]">
                <h2 className={label}>{S.howItMaps}</h2>
                <ul className="flex flex-col gap-[var(--space-8)]">
                  {shown.mapping.map((m) => {
                    const kw = m.reason.match(/“([^”]+)”/)?.[1] ?? "";
                    const effect = paramEffect(m.axis, m.value);
                    return (
                      <li key={m.axis} className="flex items-center justify-between gap-[var(--space-8)] text-[14px] leading-[18px]" title={m.reason}>
                        <span className="flex min-w-0 items-start gap-[var(--space-8)] whitespace-nowrap">
                          <span className="w-[72px] shrink-0 truncate font-medium text-[var(--sage-900)]">{kw}</span>
                          <span className="text-[var(--text-secondary)]">→</span>
                          <span className="truncate font-mono text-[var(--text-link)]">{`${m.axis} ${m.value}${effect ? ` · ${effect}` : ""}`}</span>
                        </span>
                        {m.page && (
                          <button
                            type="button"
                            className="flex h-[22px] shrink-0 items-center rounded-[var(--radius-full)] bg-[var(--bg-canvas)] px-[var(--space-16)] font-mono text-[12px] leading-[15px] text-[var(--neutral-500)] hover:text-[var(--text-link)]"
                            onClick={() => setQuote({ keyword: kw, page: m.page!, quote: evidence.get(kw)?.quote })}
                          >
                            {fmt(S.pageQuote, { page: m.page })}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            </>
          )}
        </div>
      </section>

      {showResult && params ? (
        /* Right Panel (Figma 901:9452 ×2): 352×920 at 1520,100 — draft name + versions, radar, tone, channels, actions. */
        <section
          aria-label={S.draft}
          className="absolute left-[1520px] top-[100px] flex h-[920px] w-[352px] flex-col rounded-[var(--radius-xl)] border border-[var(--neutral-0)] bg-[var(--bg-surface)] px-[26px] pb-[20px] pt-[30px]"
        >
          <h2 className={`pl-[var(--space-20)] ${label}`}>{S.draft}</h2>
          <div className="relative mt-[15px] flex h-[48px] items-center justify-between rounded-[var(--radius-sm)] bg-[var(--bg-inverse)] pl-[21px] pr-[var(--space-20)]">
            <span className="truncate text-[16px] font-medium leading-[20px] text-[var(--text-on-inverse)]">{current.name}</span>
            <button
              type="button"
              onClick={() => setVersionsOpen(!versionsOpen)}
              aria-expanded={versionsOpen}
              className="flex shrink-0 items-center whitespace-pre rounded-[var(--radius-full)] bg-[var(--bg-surface)] px-[var(--space-12)] py-[var(--space-8)] text-[14px] font-medium leading-[18px] text-[var(--sage-900)]"
            >
              {`v0.${current.version}  ▾`}
            </button>
            {versionsOpen && (
              <div className="absolute right-0 top-full z-20 mt-[var(--space-8)] flex w-[320px] flex-col gap-[var(--space-4)] rounded-[var(--radius-md)] bg-[var(--bg-surface)] p-[var(--space-12)] shadow-[var(--pure-shadow-float)]" data-testid="versions">
                <span className={`px-[var(--space-4)] pb-[var(--space-4)] ${label}`}>{S.versions}</span>
                {[...versions].reverse().map((v) => (
                  <div key={v.id} className="flex items-center gap-[var(--space-8)] rounded-[var(--radius-xs)] px-[var(--space-4)] py-[var(--space-4)] text-[14px] leading-[18px] hover:bg-[var(--neutral-50)]">
                    <span className="w-[40px] font-mono text-[var(--sage-900)]">v0.{v.version}</span>
                    <span className="flex-1 truncate text-[12px] leading-[15px] text-[var(--text-secondary)]">{v.id === current.id ? S.current : v.note || v.tone.join(", ")}</span>
                    {v.id !== current.id && (
                      <>
                        <button type="button" className="text-[12px] leading-[15px] text-[var(--text-link)] underline" onClick={() => setCompareV(compareV === v.version ? null : v.version)}>{compareV === v.version ? S.compareOff : S.compare}</button>
                        <button type="button" className="text-[12px] leading-[15px] text-[var(--text-link)] underline" onClick={() => { setVersionsOpen(false); void restore(v.version); }}>{S.restore}</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-[33px] flex justify-center">
            <Radar size={304} axes={shown.axes} compare={compareSig?.axes as Record<Axis, number> | undefined} onChange={dragAxis} />
          </div>
          {compareSig && (
            <p className="mt-[var(--space-8)] text-center font-mono text-[12px] leading-[15px] text-[var(--text-secondary)]" data-testid="compare">
              v0.{compareSig.version} (dashed) → v0.{current.version}: {AXIS_ORDER.filter((a) => compareSig.axes[a] !== shown.axes[a]).map((a) => `${AXIS_INFO[a].label} ${compareSig.axes[a]}→${shown.axes[a]}`).join(" · ") || "same"}
            </p>
          )}

          <div className="mt-[29px] flex flex-col gap-[var(--space-28)] px-[6px]">
            {shown.tone.length > 0 && (
              <div className="flex flex-wrap gap-[var(--space-8)]">
                {shown.tone.map((t) => (
                  <span key={t} className="flex h-[30px] items-center rounded-[var(--radius-full)] bg-[var(--neutral-150)] px-[var(--space-16)] text-[14px] font-medium leading-[18px] text-[var(--sage-900)]">{t}</span>
                ))}
              </div>
            )}
            <div className="h-px w-[287px] bg-[var(--neutral-150)]" />
            <dl className="grid grid-cols-[88px_1fr] gap-x-0 gap-y-[var(--space-20)] text-[14px] leading-[18px]" aria-label={S.channelSummary}>
              {(
                [
                  ["motion", [paramEffect("tempo", shown.axes.tempo), paramEffect("amp", shown.axes.amp), paramEffect("settle", shown.axes.settle)]],
                  ["face", [paramEffect("eyes", shown.axes.eyes)]],
                  ["sound", [paramEffect("pitch", shown.axes.pitch), paramEffect("density", shown.axes.density)]],
                ] as const
              ).map(([ch, effects]) => (
                <div key={ch} className="contents">
                  <dt className="flex items-center gap-[var(--space-8)] self-start font-medium text-[var(--sage-900)]">
                    <span className="size-[8px] rounded-[var(--radius-full)]" style={{ background: `var(--channel-${ch})` }} />
                    {S.channelLines[ch]}
                  </dt>
                  <dd className="text-[var(--text-secondary)]">{effects.filter(Boolean).join(" · ")}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-auto flex flex-col gap-[var(--space-12)]">
            {draft && (
              <div className="flex items-center justify-between gap-[var(--space-8)] rounded-[var(--radius-sm)] bg-[var(--neutral-50)] px-[var(--space-12)] py-[var(--space-8)] text-[12px] leading-[15px]">
                <span className="text-[var(--text-link)]">{S.edited}</span>
                <div className="flex shrink-0 gap-[var(--space-8)]">
                  <button type="button" className="font-medium text-[var(--text-link)] underline" onClick={() => setDraft(null)}>{STRINGS.editor.undo}</button>
                  <button type="button" className="rounded-[var(--radius-full)] bg-[var(--bg-inverse)] px-[var(--space-12)] py-[var(--space-4)] font-medium text-[var(--text-on-inverse)]" onClick={saveDraft}>{S.saveVersion}</button>
                </div>
              </div>
            )}
            <button
              type="button"
              disabled={!regenSource}
              onClick={() => regenSource && start(regenSource, true)}
              className="flex h-[54px] w-full items-center justify-center whitespace-pre rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[14px] font-medium leading-[18px] text-[var(--sage-900)] hover:bg-[var(--neutral-50)] disabled:cursor-not-allowed disabled:text-[var(--text-disabled)]"
            >
              {`↻  ${S.regenerate}`}
            </button>
            <button
              type="button"
              onClick={review}
              className="flex h-[54px] w-full items-center justify-center rounded-[var(--radius-full)] bg-[var(--sage-900)] text-[16px] font-medium leading-[20px] text-[var(--text-on-inverse)] hover:bg-[var(--sage-700)]"
            >
              {S.review}
            </button>
          </div>
        </section>
      ) : (
        /* Collapsed signature rail (Figma 901:8882 ×2) — decorative until a draft exists. */
        <div aria-hidden className="absolute left-[1800px] top-[100px] h-[927px] w-[71px] rounded-[var(--radius-lg)] border border-[var(--neutral-0)] bg-[var(--bg-surface)]">
          <p className={`absolute left-[19px] top-[30px] w-[36px] overflow-hidden text-ellipsis whitespace-nowrap ${label}`}>{S.steps[4]}</p>
          <span className="absolute left-[19px] top-[60px] flex size-[33px] items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-inverse)] text-[16px] font-semibold leading-[20px] text-[var(--text-on-inverse)]">{S.steps[4][0]}</span>
        </div>
      )}

      <StageSteps labels={S.steps} current={running && job ? job.step : current ? S.steps.length - 1 : -1} className="absolute left-[619px] top-[967px]" />

      <ConfirmModal open={skipOpen} title={S.skipConfirm.title} body={S.skipConfirm.body} confirmLabel={S.skip} onConfirm={skip} onCancel={() => setSkipOpen(false)} />
      <Modal open={quote !== null} onClose={() => setQuote(null)} title={quote ? `“${quote.keyword}” · ${fmt(S.pageQuote, { page: quote.page })}` : ""}>
        <blockquote className="border-l-2 border-[var(--border-default)] pl-[var(--space-12)] text-[14px] leading-[18px] text-[var(--text-link)]">{quote?.quote ?? S.noQuote}</blockquote>
        <div className="flex justify-end">
          <Button onClick={() => setQuote(null)}>{STRINGS.common.close}</Button>
        </div>
      </Modal>
    </div>
  );
}

/** Source row (Figma 901:9008 ×2): file icon, name + detail, ✓ when read / spinner while reading. */
function SourceRow({ name, detail, state }: { name: string; detail: string; state: "reading" | "done" }) {
  return (
    <div className="flex h-[48px] w-full items-center justify-between rounded-[var(--radius-sm)] bg-[var(--neutral-50)] pb-[var(--space-8)] pl-[var(--space-16)] pr-[var(--space-24)] pt-[var(--space-12)]">
      <div className="flex min-w-0 items-center gap-[var(--space-12)]">
        <Icon name="file-doc" size={25.6} className="shrink-0 text-[var(--border-default)]" />
        <div className="flex min-w-0 flex-col whitespace-nowrap">
          <span className="truncate text-[14px] font-medium leading-[18px] text-[var(--sage-900)]">{name}</span>
          <span className="truncate text-[12px] leading-[15px] text-[var(--text-secondary)]">{detail}</span>
        </div>
      </div>
      {state === "done" ? (
        <Icon name="check-thin" size={18} className="shrink-0 text-[var(--status-success)]" label="Read" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/figma/signature/spinner.png" alt="Reading" width={14} height={14} className="size-[14px] shrink-0 animate-spin" />
      )}
    </div>
  );
}
