"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SUGGESTED_PROMPTS } from "@/data/prompts";
import { STRINGS, fmt } from "@/data/strings";
import { applyToRobot, autoAdjust, paramsToProps, propsToParams, recipeToClip } from "@/lib/expression";
import type { Channel, Expression, Job, MotionProps, Project, Reference, SavedExpression, Settings, Signature, Structure } from "@/lib/models";
import { ReferenceError, extractFrames } from "@/lib/reference/frames";
import { signatureToParams } from "@/lib/signature/axes";
import { createSoundEngine } from "@/lib/sound";
import { ApiError, api } from "@/lib/ui/api";
import { describeChange, emptyHistory, pushChange, undoChange, type History } from "@/lib/ui/history";
import { uploadFile } from "@/lib/ui/upload";
import type { JointState, SimController } from "@/components/sim/sim-controller";
import { Viewport, type ViewportEvent } from "@/components/sim/Viewport";
import type { LimitEvent } from "@/components/sim/limits";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import { ConfirmModal, Modal, PromptModal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { CHANNEL_LABEL } from "@/components/ui/channel-badges";
import { ContextPanel, type EditorContext, type PendingReference } from "./context-panel";
import { LibraryPanel } from "./library-panel";
import { JointTable, MotionPanel, PROP_LABELS } from "./panels";

const E = STRINGS.editor;
const POLL_MS = 500;
type Tab = Channel;
type GenResult = { expressionId: string; source: "ollama" | "demo"; fallbackReason?: string; reasoning: string };

const running = (j: Job | null) => j !== null && (j.status === "queued" || j.status === "running");
const MAX_REFERENCES = 4;
const isVideo = (f: File) => f.type.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(f.name);

/** Context is generation input: kept per project in this browser until the next Generate writes it into the expression. */
const contextKey = (projectId: string) => `pure.context.${projectId}`;
function loadContext(projectId: string, e: Expression | null): EditorContext {
  const fallback: EditorContext = {
    currentStatus: e?.currentStatus ?? "",
    components: e?.components ?? [],
    pattern: e?.pattern ?? "",
    references: e?.references ?? [],
    lastPrompt: "",
  };
  try {
    const raw = localStorage.getItem(contextKey(projectId));
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

// W02D editor: Context/Library · viewport + playback bar + prompt/generation · Motion properties, joints,
// limit modal, change chips + Undo, ☰ menu. Timeline and Face/Sound panels arrive in ⑤.
export function Editor({
  project,
  structure,
  signature,
  initialExpression,
  settings,
}: {
  project: Project;
  structure: Structure;
  signature: Signature;
  initialExpression: Expression | null;
  settings: Settings;
}) {
  const router = useRouter();
  const toast = useToast();
  const ctrl = useRef<SimController | null>(null);
  const [sound] = useState(createSoundEngine);
  const axes = signature.axes as Record<keyof Signature["axes"], number>;
  const signatureProps = useMemo(() => paramsToProps(signatureToParams(axes).playback), [axes]);

  const [name, setName] = useState(project.name);
  const [expression, setExpression] = useState(initialExpression);
  const [props, setProps] = useState<MotionProps>(initialExpression?.motion.props ?? signatureProps);
  const committed = useRef(props);
  const [history, setHistory] = useState<History<MotionProps>>(emptyHistory);
  const [prompt, setPrompt] = useState("");
  const [job, setJob] = useState<Job | null>(null);
  const [lastResult, setLastResult] = useState<GenResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [limit, setLimit] = useState<LimitEvent | null>(null);
  const [joints, setJoints] = useState<JointState[]>([]);
  const [time, setTime] = useState({ t: 0, duration: 0 });
  const [paused, setPaused] = useState(true);
  const [tab, setTab] = useState<Tab>("motion");
  const [leftTab, setLeftTab] = useState<"context" | "library">("context");
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  /** Bumped when the motion itself changes (generate, auto-adjust); prop edits don't re-cue playback. */
  const [cue, setCue] = useState(0);
  const [context, setContext] = useState<EditorContext>(() => ({
    currentStatus: initialExpression?.currentStatus ?? "",
    components: initialExpression?.components ?? [],
    pattern: initialExpression?.pattern ?? "",
    references: initialExpression?.references ?? [],
    lastPrompt: "",
  }));
  const [pending, setPending] = useState<PendingReference[]>([]);
  const imageInput = useRef<HTMLInputElement>(null);

  // localStorage only after mount (SSR renders the expression's context).
  // Both updates land in one render, so the first write already carries the stored context.
  const [contextLoaded, setContextLoaded] = useState(false);
  useEffect(() => {
    setContext(loadContext(project.id, initialExpression));
    setContextLoaded(true);
  }, [project.id, initialExpression]);
  useEffect(() => {
    if (!contextLoaded) return;
    try {
      localStorage.setItem(contextKey(project.id), JSON.stringify(context));
    } catch {
      // storage blocked: context lasts for this visit
    }
  }, [project.id, context, contextLoaded]);

  useEffect(() => sound.setQuietHours(settings.quietHours), [sound, settings.quietHours]);

  const { params, warnings } = useMemo(() => propsToParams(props, axes), [props, axes]);
  const playable = useMemo(
    () => (expression ? { motion: expression.motion, face: expression.face, sound: expression.sound } : undefined),
    // Props go through signatureParams; saving them must not restart playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expression?.id, cue],
  );

  // ------------------------------------------------------------ persistence

  const patchExpression = useCallback(
    async (patch: Partial<Expression>) => {
      if (!expression) return null;
      const next = await api<Expression>(`/api/expressions/${expression.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setExpression(next);
      return next;
    },
    [expression],
  );

  /** Slider released: one change chip, one saved version. */
  async function commitProps(next = props) {
    const before = committed.current;
    const label = describeChange(before, next, PROP_LABELS);
    if (!label) return;
    committed.current = next;
    setHistory((h) => pushChange(h, label, before, next));
    if (expression) await patchExpression({ motion: { ...expression.motion, props: next } }).catch(() => toast(STRINGS.lab.toast.failed));
  }

  const undo = useCallback(async () => {
    const u = undoChange(history);
    if (!u) return;
    setHistory(u.history);
    setProps(u.restore);
    committed.current = u.restore;
    if (expression) await patchExpression({ motion: { ...expression.motion, props: u.restore } }).catch(() => {});
  }, [history, expression, patchExpression]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input[type=text], textarea")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        void undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  // ------------------------------------------------------------ generation

  const finish = useCallback(
    async (done: Job) => {
      if (done.status === "done") {
        const result = done.result as GenResult;
        const e = await api<Expression>(`/api/expressions/${result.expressionId}`);
        setLastResult(result);
        setExpression(e);
        setProps(e.motion.props);
        committed.current = e.motion.props;
        setHistory(emptyHistory());
        setAutoPlay(true);
        setCue((c) => c + 1);
        if (result.source === "demo" && !settings.demoMode) setFailure(result.fallbackReason ?? "");
      } else if (done.status === "failed") {
        setFailure(done.error ?? "");
      } else if (done.status === "canceled") {
        toast(E.stopped);
      }
    },
    [settings.demoMode, toast],
  );

  // Resume a generation that was running when the page was left (rule 12).
  useEffect(() => {
    api<Job[]>(`/api/jobs?projectId=${project.id}&active=1`).then((jobs) => {
      const active = jobs.find((j) => j.kind === "generate");
      if (active) setJob(active);
    }, () => {});
  }, [project.id]);

  useEffect(() => {
    if (!running(job) || !job) return;
    const timer = setInterval(async () => {
      const next = await api<Job>(`/api/jobs/${job.id}`).catch(() => null);
      if (!next) return;
      setJob(next);
      if (!running(next)) void finish(next);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [job, finish]);

  async function generate(text = prompt, ctx = context) {
    const p = text.trim();
    if (!p || running(job)) return;
    setPrompt(p);
    setFailure(null);
    setContext((c) => ({ ...c, lastPrompt: p }));
    try {
      setJob(
        await api<Job>(`/api/projects/${project.id}/generate`, {
          method: "POST",
          body: JSON.stringify({
            prompt: p,
            currentStatus: ctx.currentStatus.trim() || undefined,
            components: ctx.components,
            pattern: ctx.pattern || undefined,
            references: ctx.references,
            expressionId: expression?.id,
          }),
        }),
      );
    } catch (err) {
      setFailure(err instanceof ApiError ? err.message : String(err));
    }
  }

  function toggleComponent(id: string) {
    const components = context.components.includes(id) ? context.components.filter((c) => c !== id) : [...context.components, id];
    const next = { ...context, components };
    setContext(next);
    const again = context.lastPrompt || prompt;
    if (again.trim()) void generate(again, next);
  }

  // ------------------------------------------------------------ references

  async function addReference(file: File): Promise<Reference | null> {
    const id = `ref-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const base = { projectId: project.id };
    if (!isVideo(file)) {
      const up = await uploadFile(file, { ...base, kind: "image", name: file.name });
      return { id, kind: "image", path: up.path, thumb: up.path, status: "ok" };
    }
    let read: { duration: number; frames: Blob[] } | null = null;
    try {
      read = await extractFrames(file);
    } catch (err) {
      if (err instanceof ReferenceError && err.code === "TOO_LONG") {
        toast(E.referenceTooLong);
        return null;
      }
      // Unreadable codec: keep the file, mark it failed (E3); generation goes on without it.
    }
    const video = await uploadFile(file, { ...base, kind: "video", name: file.name });
    if (!read) return { id, kind: "video", path: video.path, thumb: "", status: "failed" };
    const frames: string[] = [];
    for (const [i, blob] of read.frames.entries()) frames.push((await uploadFile(blob, { ...base, kind: "frame", name: `${id}-${i + 1}.jpg` })).path);
    return { id, kind: "video", path: video.path, thumb: frames[Math.floor(frames.length / 2)], durationS: Math.round(read.duration * 10) / 10, frames, status: "ok" };
  }

  function addFiles(files: FileList) {
    const room = MAX_REFERENCES - context.references.length - pending.length;
    if (room <= 0) return toast(E.referenceLimit);
    for (const file of Array.from(files).slice(0, room)) {
      const tmp = { id: `${file.name}-${Date.now()}`, name: file.name };
      setPending((p) => [...p, tmp]);
      addReference(file)
        .then((ref) => ref && setContext((c) => ({ ...c, references: [...c.references, ref] })))
        .catch((err) => toast(err instanceof Error ? err.message : String(err)))
        .finally(() => setPending((p) => p.filter((x) => x.id !== tmp.id)));
    }
  }

  // ------------------------------------------------------------ library

  async function applyLibrary(saved: SavedExpression) {
    const { expression: input, dropped, clipDropped } = applyToRobot(saved, structure);
    try {
      const created = await api<Expression>(`/api/projects/${project.id}/expressions`, { method: "POST", body: JSON.stringify(input) });
      setExpression(created);
      setProps(created.motion.props);
      committed.current = created.motion.props;
      setHistory(emptyHistory());
      setLastResult(null);
      setAutoPlay(true);
      setCue((c) => c + 1);
      toast(fmt(E.libraryPanel.applied, { name: saved.name }));
      if (dropped.length) toast(fmt(E.libraryPanel.dropped, { channels: dropped.map((c) => CHANNEL_LABEL[c]).join(", ") }));
      if (clipDropped) toast(E.libraryPanel.clipDropped);
    } catch {
      toast(STRINGS.lab.toast.failed);
    }
  }

  async function stop() {
    if (job) await api(`/api/jobs/${job.id}/cancel`, { method: "POST" }).catch(() => {});
  }

  // ------------------------------------------------------------ viewport

  function onEvent(e: ViewportEvent) {
    switch (e.type) {
      case "tick":
        setTime({ t: e.t, duration: e.duration });
        break;
      case "playing":
        setPaused(false);
        break;
      case "ended":
        setPaused(true);
        break;
      case "jointState":
        setJoints(e.joints);
        setPaused(ctrl.current?.isPaused() ?? true);
        break;
      case "limitExceeded":
        setLimit(e);
        setPaused(true);
        break;
    }
  }

  async function autoAdjustLimits() {
    if (!expression) return setLimit(null);
    const clip = expression.motion.clip ?? recipeToClip(expression.motion.recipe, params, structure);
    const adjusted = autoAdjust(clip, structure);
    setLimit(null);
    await patchExpression({ motion: { ...expression.motion, mode: "clip", clip: adjusted.clip, props } });
    toast(fmt(E.adjusted, { n: adjusted.changes.length }));
    setAutoPlay(true);
    setCue((c) => c + 1);
  }

  function togglePlay() {
    const c = ctrl.current;
    if (!c || !expression) return;
    const ended = time.duration > 0 && time.t >= time.duration - 0.01;
    if (ended) {
      c.seek(0);
      c.play();
    } else if (paused) c.play();
    else c.pause();
    setPaused(!paused && !ended);
  }

  // ------------------------------------------------------------ project menu

  async function rename(next: string) {
    setRenaming(false);
    await api(`/api/projects/${project.id}`, { method: "PATCH", body: JSON.stringify({ name: next }) });
    setName(next);
    toast(fmt(E.renamed, { name: next }));
  }

  async function remove() {
    await api(`/api/projects/${project.id}`, { method: "DELETE" });
    toast(fmt(STRINGS.lab.toast.deleted, { name }));
    router.push("/lab");
  }

  // ------------------------------------------------------------ render

  const busy = running(job);
  const fmtT = (s: number) => (Number.isFinite(s) ? s.toFixed(2) : "∞");
  const hasChannel = (c: Channel) => structure.channels.includes(c);

  return (
    <div className="grid h-screen grid-cols-[280px_1fr_340px] grid-rows-[auto_1fr_auto] overflow-hidden">
      {/* Header */}
      <header className="col-span-3 flex items-center justify-between border-b border-neutral-200 px-4 py-2">
        <div className="flex items-center gap-3">
          <Menu
            label="Project menu"
            align="left"
            trigger="☰"
            items={[
              { label: `← ${E.menu.home}`, onSelect: () => router.push("/lab") },
              { label: E.menu.rename, onSelect: () => setRenaming(true) },
              { label: E.menu.changeSignature, onSelect: () => router.push(`/lab/p/${project.id}/signature`) },
              { label: `${E.menu.test} (⑥)`, onSelect: () => toast(`${E.menu.test}: ⑥`) },
              { label: `${E.menu.export} (⑥)`, onSelect: () => toast(`${E.menu.export}: ⑥`) },
              { label: E.menu.delete, onSelect: () => setDeleting(true), danger: true },
            ]}
          />
          <span className="font-semibold">{name}</span>
          <span className="text-xs text-neutral-500">{signature.name} · v0.{signature.version}</span>
        </div>
        <div className="flex items-center gap-2" data-testid="change-chips">
          {history.changes.slice(-3).map((c, i, list) => (
            <span key={c.id} className="flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-0.5 text-xs">
              {c.label}
              {i === list.length - 1 && (
                <button className="font-semibold underline" onClick={() => void undo()}>{E.undo}</button>
              )}
            </span>
          ))}
        </div>
      </header>

      {/* Left: Context / Library (④b) */}
      <aside className="flex flex-col gap-3 overflow-y-auto border-r border-neutral-200 p-4 text-sm">
        <div className="flex gap-1">
          {(["context", "library"] as const).map((t) => (
            <button key={t} onClick={() => setLeftTab(t)} className={`rounded px-3 py-1 ${leftTab === t ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}>
              {t === "context" ? E.context : E.library}
            </button>
          ))}
        </div>
        {leftTab === "context" ? (
          <ContextPanel
            context={context}
            pending={pending}
            busy={busy}
            onChange={(patch) => setContext((c) => ({ ...c, ...patch }))}
            onToggleComponent={toggleComponent}
            onAddFiles={addFiles}
            onRemoveReference={(id) => setContext((c) => ({ ...c, references: c.references.filter((r) => r.id !== id) }))}
          />
        ) : (
          <LibraryPanel busy={busy} onApply={(s) => void applyLibrary(s)} />
        )}
      </aside>

      {/* Center: viewport, playback bar, prompt */}
      <main className="flex min-h-0 flex-col gap-3 p-4">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded border border-neutral-200">
          <Viewport
            controllerRef={ctrl}
            structure={structure}
            signatureParams={params}
            expression={playable}
            autoPlay={autoPlay}
            sound={sound}
            mode="editor"
            onEvent={onEvent}
            className="h-full w-full"
          />
          {!expression && !busy && (
            <div className="pointer-events-none absolute inset-x-0 top-6 flex flex-col items-center gap-1 text-center">
              <span className="font-semibold">{E.empty.title}</span>
              <span className="text-sm text-neutral-500">{E.empty.body}</span>
            </div>
          )}
          {busy && job && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70" data-testid="generating">
              <span className="font-semibold">{E.generating}</span>
              <span className="text-sm text-neutral-500">{job.stepLabel} · {job.progress}%</span>
            </div>
          )}
          {lastResult?.source === "demo" && expression && !busy && (
            <span className="absolute right-3 top-3 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{E.demoBadge}</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          <Button disabled={!expression} onClick={togglePlay}>{paused ? (time.duration > 0 && time.t >= time.duration - 0.01 ? E.replay : E.play) : E.pause}</Button>
          <span className="font-mono text-neutral-600" data-testid="time">{fmtT(time.t)} / {fmtT(time.duration)}</span>
          <div className="h-1 flex-1 overflow-hidden rounded bg-neutral-200">
            <div className="h-full bg-neutral-700" style={{ width: `${Number.isFinite(time.duration) && time.duration > 0 ? (time.t / time.duration) * 100 : 0}%` }} />
          </div>
          <Button variant={timelineOpen ? "primary" : "default"} onClick={() => setTimelineOpen(!timelineOpen)}>{E.timeline.title}</Button>
        </div>

        {expression && lastResult?.reasoning && <p className="text-xs text-neutral-500"><b>{E.reasoning}</b> · {lastResult.reasoning}</p>}

        <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); void generate(); }}>
          <div className="flex gap-2">
            <select className="rounded border border-neutral-300 px-2 text-sm" aria-label="Prompt type" defaultValue="text" onChange={(e) => { if (e.target.value === "image") { setLeftTab("context"); imageInput.current?.click(); e.target.value = "text"; } }}>
              <option value="text">{E.text}</option>
              <option value="image">{E.image}</option>
            </select>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={busy}
              placeholder={E.promptPlaceholder}
              maxLength={500}
              className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100"
            />
            {busy ? (
              <Button type="button" onClick={stop}>{E.stop}</Button>
            ) : (
              <Button type="submit" variant="primary" disabled={!prompt.trim()}>{E.generate}</Button>
            )}
          </div>
          {(context.references.length > 0 || pending.length > 0) && (
            <div className="flex flex-wrap gap-1.5 text-xs" data-testid="attach-chips">
              {context.references.map((r) => (
                <span key={r.id} className={`flex items-center gap-1 rounded-full border px-2 py-0.5 ${r.status === "failed" ? "border-red-300 text-red-600" : "border-neutral-300"}`}>
                  {r.kind === "video" ? "▶" : "▣"} {r.path.split("/").pop()?.replace(/^[0-9a-f]{8}-/, "")}
                  <button aria-label={E.removeReference} onClick={() => setContext((c) => ({ ...c, references: c.references.filter((x) => x.id !== r.id) }))}>×</button>
                </span>
              ))}
              {pending.map((p) => <span key={p.id} className="rounded-full border border-dashed border-neutral-300 px-2 py-0.5 text-neutral-500">{p.name} · {E.referenceUploading}</span>)}
            </div>
          )}
          <input ref={imageInput} type="file" accept="image/*,video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }} />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-neutral-500">{E.suggested}</span>
            {SUGGESTED_PROMPTS.map((s) => (
              <button key={s.id} type="button" disabled={busy} onClick={() => void generate(s.text)} className="rounded-full border border-neutral-300 px-2.5 py-0.5 hover:bg-neutral-100 disabled:opacity-40">
                {s.text}
              </button>
            ))}
          </div>
        </form>
      </main>

      {/* Right: channel tabs + joints */}
      <aside className="flex flex-col gap-4 overflow-y-auto border-l border-neutral-200 p-4">
        <div className="flex gap-1 text-sm">
          {(["motion", "face", "sound"] as const).map((c) => (
            <button
              key={c}
              disabled={!hasChannel(c)}
              title={hasChannel(c) ? undefined : fmt(E.noChannel, { channel: E.tabs[c] })}
              onClick={() => setTab(c)}
              className={`flex-1 rounded px-2 py-1 disabled:cursor-not-allowed disabled:opacity-40 ${tab === c ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}
            >
              {E.tabs[c]}
            </button>
          ))}
        </div>

        {tab === "motion" && (
          <MotionPanel
            props={props}
            warnings={warnings}
            onChange={(key, value) => setProps((p) => ({ ...p, [key]: value }))}
            onCommit={() => void commitProps()}
          />
        )}
        {tab === "face" && (
          <div className="flex flex-col gap-1 text-sm">
            {expression ? (
              <>
                <span>{fmt(E.readOnlyFace, { preset: expression.face.preset })}</span>
                {Object.entries(expression.face.tokens).map(([k, v]) => (
                  <span key={k} className="font-mono text-xs text-neutral-600">{k} {Number(v).toFixed(2)}</span>
                ))}
              </>
            ) : "—"}
            <p className="text-xs text-neutral-400">{E.timelineSoon}</p>
          </div>
        )}
        {tab === "sound" && (
          <div className="flex flex-col gap-1 text-sm">
            {expression?.sound.cues.length
              ? expression.sound.cues.map((c) => (
                  <button key={c.id} className="flex justify-between rounded px-2 py-1 text-left hover:bg-neutral-100" onClick={() => ctrl.current?.previewCue(c)}>
                    <span>▶ {c.id}</span>
                    <span className="font-mono text-xs">{c.t.toFixed(2)}s</span>
                  </button>
                ))
              : <span className="text-neutral-500">{E.noCues}</span>}
            <p className="text-xs text-neutral-400">{E.timelineSoon}</p>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-neutral-200 pt-4">
          <JointTable joints={joints} structure={structure} flagged={limit?.joint} />
        </div>
      </aside>

      {/* Bottom: Edit Detail (⑤) */}
      {timelineOpen && (
        <section className="col-span-3 border-t border-neutral-200 p-4 text-sm text-neutral-500" data-testid="timeline">
          <b className="text-neutral-900">{E.timeline.title}</b> · {E.timelineSoon}
        </section>
      )}

      <Modal open={failure !== null} onClose={() => setFailure(null)} title={E.failed.title}>
        <p className="text-sm text-neutral-600">{E.failed.body}</p>
        {failure && <p className="font-mono text-xs text-neutral-400">{fmt(E.failedReason, { reason: failure })}</p>}
        <div className="flex justify-end gap-2">
          <Button onClick={() => router.push("/lab/user-data")}>{E.failedActions.browse}</Button>
          <Button variant="primary" onClick={() => { setFailure(null); void generate(); }}>{E.failedActions.retry}</Button>
        </div>
      </Modal>

      <Modal open={limit !== null} onClose={() => setLimit(null)} title={E.limit.title}>
        {limit && (
          <>
            <p className="text-sm text-neutral-600">
              {fmt(E.limitBody, { joint: structure.joints.find((j) => j.id === limit.joint)?.label ?? limit.joint, value: limit.value.toFixed(1), limit: limit.limit.toFixed(1), t: limit.t.toFixed(2) })}
            </p>
            <table className="text-sm">
              <thead className="text-left text-xs text-neutral-500">
                <tr><th className="font-normal">{E.limitColumns.joint}</th><th className="font-normal">{E.limitColumns.value}</th><th className="font-normal">{E.limitColumns.limit}</th></tr>
              </thead>
              <tbody className="font-mono">
                <tr className="text-red-600"><td>{limit.joint}</td><td>{limit.value.toFixed(1)}°</td><td>{limit.limit.toFixed(1)}°</td></tr>
              </tbody>
            </table>
            <div className="flex justify-end gap-2">
              <Button onClick={() => { setLimit(null); setTimelineOpen(true); }}>{E.limit.editTimeline}</Button>
              <Button variant="primary" onClick={() => void autoAdjustLimits()}>{E.limit.autoAdjust}</Button>
            </div>
          </>
        )}
      </Modal>

      <PromptModal open={renaming} title={STRINGS.lab.rename.title} label={STRINGS.lab.rename.label} initial={name} maxLength={60} submitLabel={STRINGS.lab.rename.save} onSubmit={rename} onCancel={() => setRenaming(false)} />
      <ConfirmModal open={deleting} title={E.deleteConfirm.title} body={E.deleteConfirm.body} confirmLabel={STRINGS.common.delete} danger onConfirm={remove} onCancel={() => setDeleting(false)} />
    </div>
  );
}
