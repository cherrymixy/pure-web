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

// W02C-1~3: source input → reading → extracted + tone + How it maps → draggable 8-axis draft, versions.
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
  const [adding, setAdding] = useState(false);
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
        setAdding(false);
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

  const showInput = !running && !error && (adding || !current);
  const regenSource = sourceOf(current);
  const compareSig = compareV !== null ? versions.find((v) => v.version === compareV) : undefined;
  const fromThisVersion = lastExtract?.signature.id === current?.id || lastExtract?.signature.tone.join() === current?.tone.join();
  const extracted = fromThisVersion ? lastExtract?.extracted : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col gap-6 p-10">
        <Link href={`/lab/p/${projectId}/structure`} className="text-sm text-neutral-500">← {S.backStructure}</Link>
        <header className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold">{S.title}</h1>
          <span className="text-sm text-neutral-500">{name}</span>
        </header>

        <div className="grid grid-cols-[1fr_420px] gap-8">
          {/* Left: input / reading / failure / result */}
          <div className="flex flex-col gap-6">
            {showInput && (
              <section className="flex flex-col gap-4">
                <p className="text-sm text-neutral-600">{S.intro}</p>
                <div
                  data-testid="pdf-drop"
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f) void startPdf(f, f.name);
                  }}
                  className={`flex min-h-48 flex-col items-center justify-center gap-3 rounded border-2 border-dashed p-8 ${dragging ? "border-neutral-900 bg-neutral-100" : "border-neutral-300"}`}
                >
                  <p className="text-neutral-600">{S.dropPdf}</p>
                  <div className="flex gap-2">
                    <Button disabled={busy} onClick={() => fileInput.current?.click()}>{STRINGS.importModel.browse}</Button>
                    <Button disabled={busy} variant="ghost" className="underline" onClick={useSample}>{S.sample}</Button>
                  </div>
                  <input ref={fileInput} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void startPdf(f, f.name); e.target.value = ""; }} />
                </div>
                <span className="text-center text-xs text-neutral-400">{S.or}</span>
                <form className="flex flex-col gap-1" onSubmit={(e) => { e.preventDefault(); if (url.trim()) void start({ kind: "url", url: url.trim() }); }}>
                  <div className="flex gap-2">
                    <input
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setUrlError(null); }}
                      placeholder={S.url}
                      aria-invalid={urlError !== null}
                      className={`flex-1 rounded border px-2 py-1.5 text-sm ${urlError ? "border-red-500" : "border-neutral-300"}`}
                    />
                    <Button type="submit" variant="primary" disabled={!url.trim() || busy}>{S.extract}</Button>
                  </div>
                  {urlError && <p role="alert" className="text-xs text-red-600">{urlError}</p>}
                </form>
                <div className="flex justify-between">
                  {current ? <Button variant="ghost" onClick={() => setAdding(false)}>{STRINGS.common.cancel}</Button> : <span />}
                  <Button variant="ghost" className="underline" onClick={() => setSkipOpen(true)}>{S.skipStep}</Button>
                </div>
              </section>
            )}

            {running && job && (
              <section className="flex flex-col gap-4" data-testid="sig-reading">
                <ol className="flex flex-col gap-2 text-sm">
                  {S.steps.map((label, i) => {
                    const state = i < job.step ? "done" : i === job.step ? "active" : "todo";
                    return (
                      <li key={label} className={`flex items-center gap-2 ${state === "todo" ? "text-neutral-400" : ""}`}>
                        <span className="w-4 text-center">{state === "done" ? "✓" : state === "active" ? "…" : "○"}</span>
                        {label}
                      </li>
                    );
                  })}
                </ol>
                <div className="h-1.5 overflow-hidden rounded bg-neutral-200">
                  <div className="h-full bg-neutral-700 transition-[width] duration-300" style={{ width: `${job.progress}%` }} />
                </div>
                <p className="text-xs text-neutral-500">{STRINGS.analyzing.leaveHint}</p>
              </section>
            )}

            {error && !running && (
              <section role="alert" className="flex flex-col gap-3 rounded border border-red-300 p-5">
                <h2 className="font-semibold text-red-600">{error.code === "FIGMA_UNSUPPORTED" ? S.figmaError.title : S.failed.title}</h2>
                <p className="text-sm text-neutral-600">{error.code === "FIGMA_UNSUPPORTED" ? S.figmaError.body : S.failed.body}</p>
                <div className="flex gap-2">
                  <Button onClick={() => { setError(null); setAdding(true); }}>{S.tryAnother}</Button>
                  <Button variant="primary" onClick={skip}>{S.useDefault}</Button>
                </div>
              </section>
            )}

            {!showInput && !running && !error && current && shown && (
              <section className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <h2 className="font-semibold">{S.extracted}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-neutral-500">{S.sources}</span>
                    {current.sources.map((src) => <span key={src.name} className="rounded border border-neutral-200 px-2 py-0.5">{src.name}</span>)}
                    <Button variant="ghost" className="underline" onClick={() => setAdding(true)}>{S.addSource}</Button>
                  </div>
                  {extracted && (
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-neutral-500">{S.palette}</span>
                      {extracted.colors.map((c) => (
                        // Brand colors from the source are data, not UI tokens.
                        <span key={c} title={c} className="inline-block h-6 w-6 rounded border border-neutral-300" style={{ background: c }} />
                      ))}
                      <span className="text-neutral-500">{S.typeface}</span>
                      <span>{extracted.fonts.join(", ") || "—"}</span>
                    </div>
                  )}
                  {fromThisVersion && lastExtract?.source === "demo" && <p className="text-xs text-amber-700">{S.demoNote}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="font-semibold">{S.tone}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {shown.tone.map((t) => (
                      <span key={t} data-testid="tone-chip" className="flex items-center gap-1 rounded-full border border-neutral-300 px-2.5 py-0.5 text-sm">
                        {t}
                        <button aria-label={fmt(S.removeTone, { tone: t })} className="text-neutral-400 hover:text-neutral-900" onClick={() => retone(shown.tone.filter((x) => x !== t))}>×</button>
                      </span>
                    ))}
                    <select
                      value={newTone}
                      onChange={(e) => {
                        const k = e.target.value;
                        setNewTone("");
                        if (k && !shown.tone.includes(k)) retone([...shown.tone, k]);
                      }}
                      className="rounded border border-neutral-300 px-2 py-0.5 text-sm"
                      aria-label={S.addTone}
                    >
                      <option value="">+ {S.addTone}</option>
                      {Object.keys(TONE_DICTIONARY).filter((k) => !shown.tone.includes(k)).map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="font-semibold">{S.howItMaps}</h2>
                  <ul className="flex flex-col gap-1.5 text-sm text-neutral-700">
                    {shown.mapping.map((m) => {
                      const kw = m.reason.match(/“([^”]+)”/)?.[1] ?? "";
                      return (
                        <li key={m.axis} className="flex items-baseline gap-2">
                          <span className="w-20 shrink-0 text-neutral-500">{AXIS_INFO[m.axis].label}</span>
                          <span className="flex-1">{m.reason}</span>
                          {m.page && (
                            <button className="shrink-0 font-mono text-xs underline" onClick={() => setQuote({ keyword: kw, page: m.page!, quote: evidence.get(kw)?.quote })}>
                              {fmt(S.pageQuote, { page: m.page })}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>
            )}
          </div>

          {/* Right: preview + radar draft */}
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded border border-neutral-200">
              <Viewport controllerRef={ctrl} mode="preview" orbit={false} signatureParams={playback} className="aspect-[4/3] w-full" />
            </div>

            {current && shown && params && !running && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{S.draft}</h2>
                  <div className="relative">
                    <Button onClick={() => setVersionsOpen(!versionsOpen)} aria-expanded={versionsOpen}>v0.{current.version} ▾</Button>
                    {versionsOpen && (
                      <div className="absolute right-0 z-20 mt-1 flex w-80 flex-col rounded border border-neutral-200 bg-white p-2 shadow" data-testid="versions">
                        <span className="px-1 pb-1 text-xs text-neutral-500">{S.versions}</span>
                        {[...versions].reverse().map((v) => (
                          <div key={v.id} className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-neutral-50">
                            <span className="w-10 font-mono">v0.{v.version}</span>
                            <span className="flex-1 truncate text-xs text-neutral-500">{v.id === current.id ? S.current : v.note || v.tone.join(", ")}</span>
                            {v.id !== current.id && (
                              <>
                                <button className="text-xs underline" onClick={() => setCompareV(compareV === v.version ? null : v.version)}>{compareV === v.version ? S.compareOff : S.compare}</button>
                                <button className="text-xs underline" onClick={() => { setVersionsOpen(false); void restore(v.version); }}>{S.restore}</button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  <Radar axes={shown.axes} compare={compareSig?.axes as Record<Axis, number> | undefined} onChange={dragAxis} />
                </div>
                {compareSig && (
                  <p className="text-center font-mono text-xs text-neutral-500" data-testid="compare">
                    v0.{compareSig.version} (dashed) → v0.{current.version}: {AXIS_ORDER.filter((a) => compareSig.axes[a] !== shown.axes[a]).map((a) => `${AXIS_INFO[a].label} ${compareSig.axes[a]}→${shown.axes[a]}`).join(" · ") || "same"}
                  </p>
                )}

                <div className="flex flex-col gap-1 text-sm">
                  <h3 className="text-neutral-500">{S.channelSummary}</h3>
                  <p><b>{S.channelLines.motion}</b> · {[paramEffect("tempo", shown.axes.tempo), paramEffect("amp", shown.axes.amp), paramEffect("settle", shown.axes.settle)].filter(Boolean).join(" · ")}</p>
                  <p><b>{S.channelLines.face}</b> · {paramEffect("eyes", shown.axes.eyes)}</p>
                  <p><b>{S.channelLines.sound}</b> · {[paramEffect("pitch", shown.axes.pitch), paramEffect("density", shown.axes.density)].join(" · ")}</p>
                </div>

                {draft && (
                  <div className="flex items-center justify-between rounded bg-neutral-100 px-3 py-2 text-sm">
                    <span>{S.edited}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setDraft(null)}>{STRINGS.editor.undo}</Button>
                      <Button onClick={saveDraft}>{S.saveVersion}</Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap justify-between gap-2">
                  <Button disabled={!regenSource} onClick={() => regenSource && start(regenSource, true)}>{S.regenerate}</Button>
                  <div className="flex gap-2">
                    <Button onClick={saveAndReturn}>{S.saveReturn}</Button>
                    <Button variant="primary" onClick={review}>{S.review}</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <StageSteps current={1} />

      <ConfirmModal open={skipOpen} title={S.skipConfirm.title} body={S.skipConfirm.body} confirmLabel={S.skip} onConfirm={skip} onCancel={() => setSkipOpen(false)} />
      <Modal open={quote !== null} onClose={() => setQuote(null)} title={quote ? `“${quote.keyword}” · ${fmt(S.pageQuote, { page: quote.page })}` : ""}>
        <blockquote className="border-l-2 border-neutral-300 pl-3 text-sm text-neutral-700">{quote?.quote ?? S.noQuote}</blockquote>
        <div className="flex justify-end">
          <Button onClick={() => setQuote(null)}>{STRINGS.common.close}</Button>
        </div>
      </Modal>
    </div>
  );
}
