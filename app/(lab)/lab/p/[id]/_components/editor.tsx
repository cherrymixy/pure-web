"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SUGGESTED_PROMPTS } from "@/data/prompts";
import { STRINGS, fmt } from "@/data/strings";
import { addFaceKey, addKey, applyToRobot, autoAdjust, deleteFaceKey, deleteKey, formatTime, matchTiming, moveFaceKey, paramsToProps, propsToParams, recipeToClip, snapTime, updateKey } from "@/lib/expression";
import { diffEnergy, energySamples } from "@/lib/reference/energy";
import { flowEnergy } from "@/lib/reference/flow";
import type { Channel, Clip, Expression, FaceSpec, Key, Job, MotionProps, Project, Reference, SavedExpression, Settings, Signature, SoundCue, SoundSpec, Structure } from "@/lib/models";
import { cueAt } from "@/data/sound-cues";
import { ReferenceError, extractFrames, readFramePixels } from "@/lib/reference/frames";

const FRAME_PX = 64;
import { signatureToParams } from "@/lib/signature/axes";
import { createSoundEngine } from "@/lib/sound";
import { ApiError, api } from "@/lib/ui/api";
import { describeChange, describeFields, emptyHistory, pushChange, undoChange, type History } from "@/lib/ui/history";
import { fileUrl, uploadFile } from "@/lib/ui/upload";
import type { JointState, SimController } from "@/components/sim/sim-controller";
import { Viewport, type ViewportEvent } from "@/components/sim/Viewport";
import type { LimitEvent } from "@/components/sim/limits";
import { Icon } from "@/components/ui/icons/icon";
import { Menu } from "@/components/ui/menu";
import { ConfirmModal, Modal, ModalActions, ModalButton, PromptModal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { CHANNEL_LABEL } from "@/components/ui/channel-badges";
import { FACE_FIELDS, FacePanel, SoundPanel } from "./channel-panels";
import { logInput, withRef, type InputEntry } from "@/lib/ui/input-log";
import { ContextPanel, type EditorContext, type PendingReference } from "./context-panel";
import { LibraryPanel } from "./library-panel";
import { JointTable, MotionPanel, PROP_LABELS } from "./panels";
import { ExportModal } from "./export-modal";
import { ReferencePlayer } from "./reference-player";
import { TestModal } from "./test-modal";
import { Timeline, type KeyRef, type Track } from "./timeline";

const E = STRINGS.editor;
const POLL_MS = 500;
type Tab = Channel;
type GenResult = {
  expressionId: string;
  source: "ollama" | "demo";
  fallbackReason?: string;
  reasoning: string;
  directClip?: { used: boolean; reason?: string };
};

const running = (j: Job | null) => j !== null && (j.status === "queued" || j.status === "running");
const MAX_REFERENCES = 4;

/** One undoable edit: Motion properties, face and sound together. */
type Snapshot = { props: MotionProps; face: FaceSpec; sound: SoundSpec; clip: Clip | null };
const NEUTRAL_FACE: FaceSpec = { preset: "neutral", tokens: { eyeSize: 1, eyeOpen: 1, eyeAngle: 0, browAngle: 0, brightness: 1, blinkRate: 12 } };
const CUE_FIELDS = {
  t: { label: STRINGS.editor.sound.fields.t, digits: 2 },
  pitchSt: { label: STRINGS.editor.sound.fields.pitchSt, digits: 1 },
  tempo: { label: STRINGS.editor.sound.fields.tempo, digits: 2 },
  lengthS: { label: STRINGS.editor.sound.fields.lengthS, digits: 2 },
  volumeDb: { label: STRINGS.editor.sound.fields.volumeDb },
  timbre: { label: STRINGS.editor.sound.fields.timbre },
};

/** Snapshot → expression.motion: a clip means keyframe mode, none means the recipe plays. */
function motionOf(e: Expression, snap: Snapshot, recipe = e.motion.recipe): Expression["motion"] {
  return snap.clip ? { mode: "clip", recipe, clip: snap.clip, props: snap.props } : { mode: "recipe", recipe, props: snap.props };
}

/** "Speed 85 → 60", "Face sleepy → happy, Brow angle -12 → -6", "Sound cues 2 → 3"… */
function describeSnapshot(a: Snapshot, b: Snapshot): string {
  const parts = [describeChange(a.props, b.props, PROP_LABELS)].filter(Boolean);
  parts.push(...describeFields({ preset: a.face.preset }, { preset: b.face.preset }, { preset: { label: STRINGS.editor.face.label } }));
  if (a.face.preset === b.face.preset) parts.push(...describeFields(a.face.tokens, b.face.tokens, FACE_FIELDS));
  if (a.sound.cues.length !== b.sound.cues.length) parts.push(`${STRINGS.editor.sound.label} cues ${a.sound.cues.length} → ${b.sound.cues.length}`);
  else
    for (const cb of b.sound.cues) {
      const ca = a.sound.cues.find((c) => c.id === cb.id);
      if (ca) parts.push(...describeFields(ca, cb, CUE_FIELDS).map((d) => `${STRINGS.editor.sound.label} ${d}`));
    }
  if (!parts.length && a.clip !== b.clip) parts.push(STRINGS.editor.timeline.title);
  return parts.join(", ");
}
const isVideo = (f: File) => f.type.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(f.name);

/** Context is generation input: kept per project in this browser until the next Generate writes it into the expression. */
const contextKey = (projectId: string) => `pure.context.${projectId}`;


function loadContext(projectId: string, e: Expression | null): EditorContext {
  const fallback: EditorContext = {
    components: e?.components ?? [],
    pattern: e?.pattern ?? "",
    references: [],
    inputs: [],
    lastPrompt: "",
  };
  try {
    const raw = localStorage.getItem(contextKey(projectId));
    const stored = raw ? (JSON.parse(raw) as Partial<EditorContext>) : {};
    return { ...fallback, ...stored, inputs: Array.isArray(stored.inputs) ? stored.inputs : [] };
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
  incomingReference = null,
  directClip = false,
}: {
  /** STEP 12 experiment flag: Tier 2 clips + flow-based Match timing */
  directClip?: boolean;
  incomingReference?: { id: string; name: string } | null;
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
  const [face, setFace] = useState<FaceSpec>(initialExpression?.face ?? NEUTRAL_FACE);
  const [soundSpec, setSoundSpec] = useState<SoundSpec>(initialExpression?.sound ?? { cues: [] });
  const [selectedCue, setSelectedCue] = useState<string | null>(null);
  const [quietHours, setQuietHours] = useState(settings.quietHours);
  const [clip, setClip] = useState<Clip | null>(initialExpression?.motion.mode === "clip" ? initialExpression.motion.clip ?? null : null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedKey, setSelectedKey] = useState<KeyRef | null>(null);
  const [loop, setLoop] = useState(false);
  const [activeRef, setActiveRef] = useState<Reference | null>(null);
  const [sideBySide, setSideBySide] = useState(false);
  const [matching, setMatching] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState<null | "robot" | "file" | "share">(null);
  const committed = useRef<Snapshot>({ props, face, sound: soundSpec, clip });
  const [history, setHistory] = useState<History<Snapshot>>(emptyHistory);
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
    components: initialExpression?.components ?? [],
    pattern: initialExpression?.pattern ?? "",
    references: [],
    inputs: [],
    lastPrompt: "",
  }));
  const [pending, setPending] = useState<PendingReference[]>([]);
  /** Reference ids whose vision summary is being made in the background */
  const [reading, setReading] = useState<string[]>([]);
  const imageInput = useRef<HTMLInputElement>(null);

  // localStorage only after mount (SSR renders the expression's context).
  // Both updates land in one render, so the first write already carries the stored context.
  const [contextLoaded, setContextLoaded] = useState(false);
  useEffect(() => {
    const loaded = loadContext(project.id, initialExpression);
    if (incomingReference && !loaded.references.some((r) => r.kind === "userData" && r.path === incomingReference.id)) {
      const ref: Reference = { id: `ref-${incomingReference.id}`, kind: "userData", path: incomingReference.id, thumb: "", status: "ok" };
      loaded.references = [...loaded.references, ref].slice(-MAX_REFERENCES);
      setLeftTab("context");
    }
    setContext(loaded);
    setContextLoaded(true);
    if (incomingReference) router.replace(`/lab/p/${project.id}`);
  }, [project.id, initialExpression, incomingReference, router]);
  useEffect(() => {
    if (!contextLoaded) return;
    try {
      localStorage.setItem(contextKey(project.id), JSON.stringify(context));
    } catch {
      // storage blocked: context lasts for this visit
    }
  }, [project.id, context, contextLoaded]);

  useEffect(() => sound.setQuietHours(quietHours), [sound, quietHours]);

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

  /** Show a snapshot on the robot (props reach it through signatureParams). */
  const applySnapshot = useCallback((snap: Snapshot) => {
    setProps(snap.props);
    setFace(snap.face);
    setSoundSpec(snap.sound);
    setClip(snap.clip);
    ctrl.current?.setFace(snap.face);
    ctrl.current?.setSound(snap.sound);
  }, []);

  /** Show an edited clip at the playhead (paused) without waiting for the save. */
  const showClip = useCallback((c: Clip) => {
    const t = ctrl.current?.getTime().t ?? 0;
    ctrl.current?.playClip(c, undefined, { autoplay: false });
    ctrl.current?.seek(Math.min(t, c.duration));
    setPaused(true);
  }, []);

  /** New baseline after generate / library apply: no undo across expressions. */
  const resetTo = useCallback((e: Expression) => {
    const snap = { props: e.motion.props, face: e.face, sound: e.sound, clip: e.motion.mode === "clip" ? e.motion.clip ?? null : null };
    setProps(snap.props);
    setFace(snap.face);
    setSoundSpec(snap.sound);
    setClip(snap.clip);
    setSelectedCue(null);
    setSelectedKey(null);
    committed.current = snap;
    setHistory(emptyHistory());
  }, []);

  /** Release / pick: one change chip, one saved version. */
  async function commit(override: Partial<Snapshot> = {}, label = "") {
    const before = committed.current;
    const after: Snapshot = { props, face, sound: soundSpec, clip, ...override };
    label ||= describeSnapshot(before, after);
    if (!label) return;
    committed.current = after;
    setHistory((h) => pushChange(h, label, before, after));
    if (after.sound !== before.sound) ctrl.current?.setSound(after.sound);
    if (expression) {
      // A hand-edited face owns the face channel: per-step recipe faces would override it during playback.
      const recipe = after.face !== before.face ? { ...expression.motion.recipe, steps: expression.motion.recipe.steps.map(({ face: _f, ...st }) => st) } : expression.motion.recipe;
      await patchExpression({ motion: motionOf(expression, after, recipe), face: after.face, sound: after.sound }).catch(() => toast(STRINGS.lab.toast.failed));
      if (recipe !== expression.motion.recipe) setCue((c) => c + 1);
    }
  }

  const undo = useCallback(async () => {
    const u = undoChange(history);
    if (!u) return;
    setHistory(u.history);
    applySnapshot(u.restore);
    committed.current = u.restore;
    if (expression) {
      await patchExpression({ motion: motionOf(expression, u.restore), face: u.restore.face, sound: u.restore.sound }).catch(() => {});
      if (u.restore.clip !== u.change.after.clip) {
        if (u.restore.clip) showClip(u.restore.clip);
        else setCue((c) => c + 1);
      }
    }
  }, [history, expression, patchExpression, applySnapshot, showClip]);

  // ------------------------------------------------------------ timeline edits

  /** Recipe keys shown before the first edit (sampled like the playback). */
  const previewClip = useMemo(
    () => (expression && !clip ? recipeToClip(expression.motion.recipe, params, structure) : null),
    // Recipe and playback params decide the sampled keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expression?.id, expression?.version, clip, params, structure],
  );
  const timelineClip = clip ?? previewClip;
  const jointLabel = (id: string) => structure.joints.find((j) => j.id === id)?.label ?? id;
  const isJoint = (track: Track) => track !== "face" && track !== "sound";

  useEffect(() => {
    ctrl.current?.highlightJoint(selectedTrack && isJoint(selectedTrack) ? selectedTrack : null);
  }, [selectedTrack]);

  /** Joint key edit: the first one turns the recipe into keyframes. */
  function editClip(fn: (c: Clip) => Clip, label: string, done = true) {
    if (!timelineClip) return;
    const next = fn(timelineClip);
    if (next === timelineClip) return;
    setClip(next);
    if (done) {
      showClip(next);
      void commit({ clip: next }, label);
    }
  }

  function addTimelineKey() {
    if (!timelineClip || !selectedTrack) return;
    const t = time.t;
    if (selectedTrack === "face") {
      const { face: next, index } = addFaceKey(face, t, timelineClip.duration, face.tokens);
      changeFace(next);
      setSelectedKey({ track: "face", index });
      void commit({ face: next }, fmt(E.timeline.faceKey, { time: formatTime(snapTime(t, timelineClip.duration)) }));
      return;
    }
    if (!isJoint(selectedTrack)) return;
    const { clip: next, index } = addKey(timelineClip, selectedTrack, t, structure);
    setSelectedKey({ track: selectedTrack, index });
    editClip(() => next, `+ ${fmt(E.timeline.edited, { joint: jointLabel(selectedTrack), time: formatTime(next.tracks[selectedTrack][index].t) })}`);
  }

  function dragKey(key: KeyRef, t: number, done: boolean) {
    if (!timelineClip) return;
    const dur = timelineClip.duration;
    if (key.track === "face") {
      const next = moveFaceKey(face, key.index, t, dur);
      changeFace(next);
      if (done) void commit({ face: next }, fmt(E.timeline.faceKey, { time: formatTime(next.keys![key.index].t) }));
    } else if (key.track === "sound") {
      const cue = soundSpec.cues[key.index];
      if (!cue) return;
      const next = { cues: soundSpec.cues.map((c, i) => (i === key.index ? { ...c, t: snapTime(t, dur) } : c)) };
      setSoundSpec(next);
      if (done) void commit({ sound: next }, fmt(E.timeline.cueMoved, { cue: cue.id.split("-")[0], time: formatTime(snapTime(t, dur)) }));
    } else {
      editClip((c) => updateKey(c, key.track, key.index, { t }, structure), fmt(E.timeline.edited, { joint: jointLabel(key.track), time: formatTime(snapTime(t, dur)) }), done);
    }
  }

  function applyKey(key: KeyRef, patch: Partial<Key>) {
    if (!timelineClip) return;
    if (!isJoint(key.track)) return dragKey(key, patch.t ?? 0, true);
    editClip((c) => updateKey(c, key.track, key.index, patch, structure), fmt(E.timeline.edited, { joint: jointLabel(key.track), time: formatTime(patch.t ?? timelineClip.tracks[key.track][key.index].t) }));
  }

  function deleteTimelineKey(key: KeyRef) {
    setSelectedKey(null);
    if (key.track === "face") {
      const next = deleteFaceKey(face, key.index);
      changeFace(next);
      void commit({ face: next });
    } else if (key.track === "sound") {
      const cue = soundSpec.cues[key.index];
      if (cue) removeCue(cue.id);
    } else {
      editClip((c) => deleteKey(c, key.track, key.index), `− ${jointLabel(key.track)}`);
    }
  }

  function faceKeyFromCurrent(index: number) {
    const keys = (face.keys ?? []).map((k, i) => (i === index ? { ...k, tokens: { ...face.tokens } } : k));
    const next = { ...face, keys };
    changeFace(next);
    void commit({ face: next });
  }

  /** Peaks of frame-to-frame motion in the reference → nearest keyframe times move there (undoable). */
  async function matchToReference() {
    if (!activeRef?.frames?.length || !timelineClip) return;
    setMatching(true);
    try {
      const pixels = await readFramePixels(activeRef.frames.map(fileUrl), FRAME_PX);
      // Flag on: block-matching flow (movement, not lighting); off: luma difference.
      const raw = directClip ? flowEnergy(pixels, FRAME_PX) : diffEnergy(pixels);
      const energy = energySamples(raw, activeRef.durationS ?? timelineClip.duration);
      const { clip: next, moved } = matchTiming(timelineClip, energy);
      if (!moved) return toast(E.sync.nothing);
      setClip(next);
      setTimelineOpen(true);
      showClip(next);
      await commit({ clip: next }, fmt(E.sync.matched, { n: moved }));
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err));
    } finally {
      setMatching(false);
    }
  }

  function seekTo(t: number) {
    ctrl.current?.pause();
    ctrl.current?.seek(t);
    setPaused(true);
  }

  // ------------------------------------------------------------ face & sound edits

  function changeFace(next: FaceSpec) {
    setFace(next);
    ctrl.current?.setFace(next);
  }

  function addCue(presetId: string) {
    const pitch = signatureToParams(axes).sound.pitchSt;
    const base = cueAt(presetId, Math.round(time.t * 100) / 100, `${presetId}-${Date.now().toString(36)}`);
    const cue: SoundCue = { ...base, pitchSt: Math.round((base.pitchSt + pitch) * 10) / 10 };
    const next = { cues: [...soundSpec.cues, cue].sort((a, b) => a.t - b.t) };
    setSoundSpec(next);
    setSelectedCue(cue.id);
    ctrl.current?.previewCue(cue);
    void commit({ sound: next });
  }

  function removeCue(id: string) {
    const next = { cues: soundSpec.cues.filter((c) => c.id !== id) };
    setSoundSpec(next);
    if (selectedCue === id) setSelectedCue(null);
    void commit({ sound: next });
  }

  async function toggleQuietHours(on: boolean) {
    setQuietHours(on);
    await api("/api/settings", { method: "PATCH", body: JSON.stringify({ quietHours: on }) }).catch(() => toast(STRINGS.lab.toast.failed));
  }

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
        const result = done.result as GenResult & { referenceSummary?: string };
        // Generate described the frames itself: keep that summary on the (single) reference for next time.
        if (result.referenceSummary) {
          setContext((c) => {
            const visual = (c.inputs[0]?.attachments ?? []).filter((r) => r.status === "ok" && (r.kind === "image" || r.kind === "video"));
            if (visual.length !== 1 || visual[0].summary) return c;
            return withRef(c, visual[0].id, { summary: result.referenceSummary });
          });
        }
        const e = await api<Expression>(`/api/expressions/${result.expressionId}`);
        setLastResult(result);
        setExpression(e);
        resetTo(e);
        setAutoPlay(true);
        setCue((c) => c + 1);
        if (result.source === "demo" && !settings.demoMode) setFailure(result.fallbackReason ?? "");
      } else if (done.status === "failed") {
        setFailure(done.error ?? "");
      } else if (done.status === "canceled") {
        toast(E.stopped);
      }
    },
    [settings.demoMode, toast, resetTo],
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

  /**
   * New input (prompt + tray attachments) goes to the input log; a component-chip regenerate
   * reuses the latest input's attachments and isn't logged again.
   */
  async function generate(text = prompt, ctx = context, regenerate = false) {
    const p = text.trim();
    if (!p || running(job)) return;
    const attachments = regenerate ? (ctx.inputs[0]?.attachments ?? []) : ctx.references;
    setPrompt(regenerate ? p : "");
    setFailure(null);
    try {
      setJob(
        await api<Job>(`/api/projects/${project.id}/generate`, {
          method: "POST",
          body: JSON.stringify({
            prompt: p,
            components: ctx.components,
            pattern: ctx.pattern || undefined,
            references: attachments,
            expressionId: expression?.id,
          }),
        }),
      );
      if (!regenerate) {
        const entry: InputEntry = { id: `in-${Date.now().toString(36)}`, at: new Date().toISOString(), text: p, attachments };
        setContext((c) => ({ ...logInput(c, entry), lastPrompt: p }));
      }
    } catch (err) {
      setPrompt(p);
      setFailure(err instanceof ApiError ? err.message : String(err));
    }
  }

  function toggleComponent(id: string) {
    const components = context.components.includes(id) ? context.components.filter((c) => c !== id) : [...context.components, id];
    const next = { ...context, components };
    setContext(next);
    const again = context.lastPrompt || prompt;
    if (again.trim()) void generate(again, next, !!context.lastPrompt);
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

  /** Summarize a fresh reference now, so Generate later only sends text (vision step off the critical path). */
  function describeReference(ref: Reference) {
    if (ref.status !== "ok" || ref.summary) return;
    setReading((r) => [...r, ref.id]);
    api<{ summary: string | null }>(`/api/projects/${project.id}/references/describe`, { method: "POST", body: JSON.stringify({ reference: ref }) })
      .then(({ summary }) => {
        if (summary) setContext((c) => withRef(c, ref.id, { summary }));
      }, () => {})
      .finally(() => setReading((r) => r.filter((id) => id !== ref.id)));
  }

  function addFiles(files: FileList) {
    const room = MAX_REFERENCES - context.references.length - pending.length;
    if (room <= 0) return toast(E.referenceLimit);
    for (const file of Array.from(files).slice(0, room)) {
      const tmp = { id: `${file.name}-${Date.now()}`, name: file.name };
      setPending((p) => [...p, tmp]);
      addReference(file)
        .then((ref) => {
          if (!ref) return;
          setContext((c) => ({ ...c, references: [...c.references, ref] }));
          describeReference(ref);
        })
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
      resetTo(created);
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
    const base = clip ?? recipeToClip(expression.motion.recipe, params, structure);
    const adjusted = autoAdjust(base, structure);
    setLimit(null);
    setClip(adjusted.clip);
    await commit({ clip: adjusted.clip }, E.limit.autoAdjust);
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
  const referencePlayer = activeRef && (
    <ReferencePlayer
      reference={activeRef}
      t={time.t}
      duration={timelineClip?.duration ?? time.duration}
      playing={!paused}
      side={sideBySide}
      busy={matching || busy}
      onSide={setSideBySide}
      onMatch={() => void matchToReference()}
      onClose={() => setActiveRef(null)}
    />
  );

  const ended = time.duration > 0 && time.t >= time.duration - 0.01;
  const progress = Number.isFinite(time.duration) && time.duration > 0 ? Math.min(time.t / time.duration, 1) : 0;
  const clock = (sec: number) => (Number.isFinite(sec) ? `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}` : "--:--");
  const chip = "rounded-[var(--radius-full)] bg-[var(--bg-surface)] px-[var(--space-16)] py-[var(--space-8)] text-[14px] leading-[18px]";
  const tabTint: Record<Tab, string> = { motion: "text-[var(--text-primary)]", face: "text-[var(--web-e2a1c1)]", sound: "text-[var(--web-ecc377)]" };

  // W02D-1/3/4/5 (Figma 901:9691 · 10163 · 10631 · 11097, ×2): full-bleed stage behind floating panels —
  // left Context/Library 343×1016 at 32,32 · right channel panel 380×1016 at right 32 · play bar 634,868 · composer 513,918.
  // Placed against the viewport, not a 1920×1080 board (root zoom 0.67): panels run 32 → bottom 32, centred items keep their
  // Figma offset from the centre (x − 960), bottom items their distance from the bottom (1080 − y − h).
  return (
    <div className="relative h-[var(--app-vh)] overflow-hidden">
      {/* Stage (Frame 2147240453 ×2: full width, 265 → bottom), same slot as structure / signature. Never zoom/transform the Viewport.
          W02E-4: with the timeline open the robot sits 100px higher (Group 2147229381 187 → 137.5) — the slot moves up, same height. */}
      <div className={`absolute left-0 ${timelineOpen ? "bottom-[100px] top-[165px]" : "bottom-0 top-[265px]"} ${activeRef && sideBySide ? "w-[calc(50%-2px)]" : "right-0"}`}>
        <Viewport
          controllerRef={ctrl}
          structure={structure}
          signatureParams={params}
          expression={playable}
          autoPlay={autoPlay}
          sound={sound}
          mode="editor"
          onEvent={onEvent}
          className="block size-full"
        />
      </div>
      {activeRef && sideBySide && (
        <div className="absolute left-[calc(50%-2px)] top-[265px] h-[560px] w-[518px] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-surface)]">{referencePlayer}</div>
      )}
      {activeRef && !sideBySide && <div className="absolute bottom-[230px] left-[407px] z-10">{referencePlayer}</div>}

      {/* Change chip (W02E-1 901:12020 ×2): centered at top 300 above the robot — "Speed  85 → 60  Undo" (Caption Strong 14, shadow 0 6 20 #0000001f).
          Up to the last three changes; Undo on the newest. Moves up with the robot when the timeline is open. */}
      {history.changes.length > 0 && (
        <div className={`absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-[var(--space-8)] ${timelineOpen ? "top-[200px]" : "top-[300px]"}`} data-testid="change-chips">
          {history.changes.slice(-3).map((c, i, list) => (
            <span
              key={c.id}
              className="flex items-center gap-[var(--space-12)] whitespace-pre rounded-[var(--radius-full)] bg-[var(--bg-surface)] px-[var(--space-16)] py-[var(--space-8)] text-[14px] font-medium leading-[18px] text-[var(--text-primary)] shadow-[var(--pure-shadow-chip)]"
            >
              {c.label}
              {i === list.length - 1 && (
                <button type="button" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => void undo()}>{E.undo}</button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Top of the stage (no Figma equivalent): signature, result badges, reasoning, empty hint */}
      <div className="pointer-events-none absolute left-[407px] right-[444px] top-[32px] z-10 flex flex-col items-center gap-[var(--space-12)]">
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-[var(--space-8)]">
          <span className={`${chip} text-[var(--text-secondary)]`}>{signature.name} · v0.{signature.version}</span>
          {lastResult?.directClip && expression && !busy && (
            <span className={`${chip} text-[var(--web-3f77a1)]`} title={lastResult.directClip.reason}>
              {lastResult.directClip.used ? E.directClip.used : fmt(E.directClip.fallback, { reason: lastResult.directClip.reason ?? "" })}
            </span>
          )}
          {lastResult?.source === "demo" && expression && !busy && <span className={`${chip} text-[var(--web-ae7d24)]`}>{E.demoBadge}</span>}
        </div>
        {expression && lastResult?.reasoning && (
          <p className="max-w-[760px] text-center text-[14px] leading-[18px] text-[var(--text-secondary)]">
            <b className="font-semibold text-[var(--text-primary)]">{E.reasoning}</b> · {lastResult.reasoning}
          </p>
        )}
        {!expression && !busy && (
          <div className="flex flex-col items-center gap-[var(--space-4)] text-center">
            <span className="text-[22px] font-medium leading-[28px] text-[var(--text-primary)]">{E.empty.title}</span>
            <span className="text-[16px] leading-[20px] text-[var(--text-secondary)]">{E.empty.body}</span>
          </div>
        )}
      </div>

      {/* Left panel: Context / Library (Frame 2147240454 ×2) */}
      <aside className={`absolute left-[32px] top-[32px] z-10 flex ${timelineOpen ? "bottom-[397px]" : "bottom-[32px]"} w-[343px] flex-col overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-surface)]`}>
        <div className="flex items-center gap-[21px] pl-[21px] pt-[20px]">
          <Menu
            label="Project menu"
            align="left"
            trigger={<Icon name="menu" size={24} />}
            triggerClassName="flex size-[24px] items-center justify-center text-[var(--neutral-800)]"
            items={[
              { label: `← ${E.menu.home}`, onSelect: () => router.push("/lab") },
              { label: E.menu.rename, onSelect: () => setRenaming(true) },
              { label: E.menu.changeSignature, onSelect: () => router.push(`/lab/p/${project.id}/signature`) },
              { label: E.menu.test, onSelect: () => (expression ? setTestOpen(true) : toast(STRINGS.export.noExpression)) },
              { label: E.menu.export, onSelect: () => (expression ? setExportOpen("file") : toast(STRINGS.export.noExpression)) },
              { label: E.menu.delete, onSelect: () => setDeleting(true), danger: true },
            ]}
          />
          <h1 className="min-w-0 truncate pr-[var(--space-20)] text-[20px] leading-[25px] text-[var(--text-primary)]">{name}</h1>
        </div>
        <div className="ml-[13px] mt-[27px] flex gap-[var(--space-16)]" role="tablist">
          {(["context", "library"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={leftTab === t}
              onClick={() => setLeftTab(t)}
              className={`p-[var(--space-12)] text-[20px] leading-[25px] ${leftTab === t ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-link)]"}`}
            >
              {t === "context" ? E.context : E.library}
            </button>
          ))}
        </div>
        <div className="mt-[20px] min-h-0 flex-1 overflow-y-auto pb-[var(--space-32)] pl-[19px] pr-[23px]">
          {leftTab === "context" ? (
            <ContextPanel
              context={context}
              behaviors={expression?.motion.recipe.steps.map((st) => st.behavior) ?? []}
              busy={busy}
              onChange={(patch) => setContext((c) => ({ ...c, ...patch }))}
              onToggleComponent={toggleComponent}
              onOpenReference={(r) => r.kind !== "userData" && setActiveRef(activeRef?.id === r.id ? null : r)}
              activeReference={activeRef?.id ?? null}
              reading={reading}
            />
          ) : (
            <LibraryPanel busy={busy} onApply={(s) => void applyLibrary(s)} />
          )}
        </div>
      </aside>

      {/* Generating (901:11082 ×2): pill at 665,784 with Stop */}
      {busy && job && (
        <div
          className="absolute bottom-[244px] left-[calc(50%-295px)] z-10 flex items-center gap-[var(--space-16)] rounded-[var(--radius-full)] bg-[var(--bg-surface)] px-[var(--space-24)] py-[var(--space-16)] shadow-[var(--pure-shadow-modal)]"
          data-testid="generating"
          title={`${job.stepLabel} · ${job.progress}%`}
        >
          <Icon name="spinner" size={20} className="shrink-0 animate-spin text-[var(--text-primary)]" />
          <span className="text-[16px] font-medium leading-[20px] text-[var(--text-primary)]">{E.generating}</span>
          <span className="sr-only" aria-live="polite">{job.stepLabel} · {job.progress}%</span>
          <button type="button" onClick={stop} className="text-[16px] font-medium leading-[20px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{E.stop}</button>
        </div>
      )}

      {/* Play bar (Frame 2087331925 ×2) — the Play button (901:10012) rides the progress as the playhead, kept inside the track so it never covers the time labels */}
      {/* W02E-4: hidden under the Timeline Panel while it's open (its transport takes over) */}
      {!timelineOpen && (
      <div className="absolute bottom-[182px] left-[calc(50%-326px)] z-10 h-[30px] w-[613px]">
        <span data-testid="time" className="sr-only">{fmtT(time.t)} / {fmtT(time.duration)}</span>
        <span className="absolute right-[559px] top-[3px] text-[14px] leading-[18px] text-[var(--text-tertiary)]">{clock(time.t)}</span>
        <div className="absolute left-[59px] top-[12px] h-[6px] w-[495px] rounded-[var(--radius-full)] bg-[var(--neutral-150)]">
          <div className="h-full rounded-[var(--radius-full)] bg-[var(--primary)]" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="absolute left-[564px] top-[3px] text-[14px] leading-[18px] text-[var(--text-tertiary)]">{clock(time.duration)}</span>
        <button
          type="button"
          disabled={!expression}
          onClick={togglePlay}
          aria-label={paused ? (ended ? E.replay : E.play) : E.pause}
          title={paused ? (ended ? E.replay : E.play) : E.pause}
          className="absolute top-[-5px] flex size-[40px] -translate-x-1/2 items-center justify-center rounded-[var(--radius-full)] bg-[var(--primary)] text-[var(--bg-canvas)] disabled:cursor-not-allowed"
          style={{ left: Math.min(Math.max(59 + progress * 495, 79), 534) }}
        >
          {paused ? (
            <Icon name="play-glyph" size={40} />
          ) : (
            <span className="flex gap-[4px]" aria-hidden>
              <span className="h-[13px] w-[4px] rounded-[var(--radius-2xs)] bg-current" />
              <span className="h-[13px] w-[4px] rounded-[var(--radius-2xs)] bg-current" />
            </span>
          )}
        </button>
      </div>
      )}

      {/* Composer (Frame 56 ×2): prompt box 856×92 + suggestions. W02E-4 collapses it while the timeline is open. */}
      <form
        hidden={timelineOpen}
        className="absolute bottom-[28px] left-[calc(50%-447px)] z-10 flex w-[856px] flex-col items-center gap-[var(--space-24)]"
        onSubmit={(e) => { e.preventDefault(); void generate(); }}
      >
        <div className="flex h-[92px] w-full items-center justify-between gap-[var(--space-12)] rounded-[var(--radius-xl)] bg-[var(--bg-surface)] px-[var(--space-8)]">
          <div className="flex min-w-0 flex-1 items-center gap-[var(--space-20)]">
            <div className="relative shrink-0">
              <select
                className="appearance-none rounded-[var(--radius-full)] bg-[var(--bg-surface)] py-[var(--space-12)] pl-[var(--space-20)] pr-[56px] text-[22px] leading-[28px] text-[var(--text-primary)] outline-none"
                aria-label="Prompt type"
                defaultValue="text"
                onChange={(e) => { if (e.target.value === "image") { imageInput.current?.click(); e.target.value = "text"; } }}
              >
                <option value="text">{E.text}</option>
                <option value="image">{E.image}</option>
              </select>
              <Icon name="chevron-down" size={24} className="pointer-events-none absolute right-[var(--space-20)] top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            </div>
            <button
              type="button"
              aria-label={`+ ${E.attach}`}
              disabled={busy || context.references.length + pending.length >= MAX_REFERENCES}
              title={E.referenceRules}
              onClick={() => imageInput.current?.click()}
              className="-ml-[var(--space-12)] flex size-[36px] shrink-0 items-center justify-center rounded-[var(--radius-full)] text-[var(--text-secondary)] hover:bg-[var(--bg-canvas)] disabled:opacity-40"
            >
              <Icon name="add" size={24} />
            </button>
            {(context.references.length > 0 || pending.length > 0) && (
              <div className="flex shrink-0 items-center gap-[var(--space-8)] text-[14px] leading-[18px]" data-testid="attach-chips">
                {context.references.map((r) => (
                  <span
                    key={r.id}
                    className={`flex max-w-[160px] items-center gap-[var(--space-4)] rounded-[var(--radius-full)] border px-[var(--space-12)] py-[var(--space-4)] ${r.status === "failed" ? "border-[var(--border-error)] text-[var(--text-error)]" : "border-[var(--border-default)] text-[var(--text-primary)]"}`}
                  >
                    <span className="truncate">{r.kind === "video" ? "▶" : "▣"} {r.path.split("/").pop()?.replace(/^[0-9a-f]{8}-/, "")}</span>
                    <button type="button" aria-label={E.removeReference} onClick={() => setContext((c) => ({ ...c, references: c.references.filter((x) => x.id !== r.id) }))}>×</button>
                  </span>
                ))}
                {pending.map((p) => (
                  <span key={p.id} className="max-w-[160px] truncate rounded-[var(--radius-full)] border border-dashed border-[var(--border-default)] px-[var(--space-12)] py-[var(--space-4)] text-[var(--text-tertiary)]">
                    {p.name} · {E.referenceUploading}
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={busy}
              placeholder={E.promptPlaceholder}
              aria-label={E.promptPlaceholder}
              maxLength={500}
              className="min-w-0 flex-1 bg-transparent text-[22px] leading-[28px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            aria-label={E.generate}
            title={E.generate}
            disabled={busy || !prompt.trim()}
            className="flex shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--sage-50)] px-[var(--space-16)] py-[var(--space-12)] text-[var(--neutral-800)] disabled:cursor-not-allowed"
          >
            <Icon name="arrow-up" size={30} />
          </button>
        </div>
        <input ref={imageInput} type="file" multiple accept="image/*,video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }} />
        <div className="flex items-center gap-[var(--space-28)] text-[14px] leading-[18px]">
          <span className="sr-only">{E.suggested}</span>
          {SUGGESTED_PROMPTS.map((s) => (
            <button key={s.id} type="button" disabled={busy} onClick={() => void generate(s.text)} className="text-center text-[var(--neutral-500)] hover:text-[var(--text-primary)] disabled:opacity-40">
              {s.text}
            </button>
          ))}
        </div>
      </form>

      {/* Right panel: channel tabs + panel + joints + Edit Detail (Frame 29 ×2) */}
      <aside className={`absolute right-[32px] top-[32px] z-10 flex ${timelineOpen ? "bottom-[397px]" : "bottom-[32px]"} w-[380px] flex-col gap-[var(--space-32)] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-surface)] px-[var(--space-24)] pb-[var(--space-32)] pt-[var(--space-24)]`}>
        <div className="grid h-[49px] w-[330px] shrink-0 grid-cols-3 gap-[var(--space-8)] rounded-[var(--radius-sm)] bg-[var(--bg-canvas)] px-[var(--space-8)] py-[7px]" role="tablist">
          {(["motion", "face", "sound"] as const).map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={tab === c}
              disabled={!hasChannel(c)}
              title={hasChannel(c) ? undefined : fmt(E.noChannel, { channel: E.tabs[c] })}
              onClick={() => setTab(c)}
              className={`flex h-[36px] items-center justify-center rounded-[var(--radius-xs)] text-[16px] leading-[20px] disabled:cursor-not-allowed disabled:opacity-40 ${tabTint[c]} ${tab === c ? "bg-[var(--neutral-300)]" : ""}`}
            >
              {E.tabs[c]}
            </button>
          ))}
        </div>

        <div className="-mr-[var(--space-16)] flex min-h-0 flex-1 flex-col gap-[56px] overflow-y-auto pr-[var(--space-16)]">
          {tab === "motion" && (
            <MotionPanel
              props={props}
              warnings={warnings}
              onChange={(key, value) => setProps((p) => ({ ...p, [key]: value }))}
              onCommit={() => void commit()}
            />
          )}
          {tab === "face" && <FacePanel face={face} onChange={changeFace} onCommit={(next) => void commit(next ? { face: next } : {})} />}
          {tab === "sound" && (
            <SoundPanel
              sound={soundSpec}
              selected={selectedCue}
              quietHours={quietHours}
              onSelect={setSelectedCue}
              onPreview={(c) => ctrl.current?.previewCue(c)}
              onChange={setSoundSpec}
              onCommit={(next) => void commit(next ? { sound: next } : {})}
              onAdd={addCue}
              onRemove={removeCue}
              onQuietHours={(on) => void toggleQuietHours(on)}
            />
          )}
          <JointTable joints={joints} structure={structure} flagged={limit?.joint} />
        </div>

        <button
          type="button"
          aria-pressed={timelineOpen}
          onClick={() => setTimelineOpen(!timelineOpen)}
          className="h-[55px] w-[332px] shrink-0 rounded-[var(--radius-lg)] bg-[var(--neutral-800)] text-[22px] leading-[28px] text-[var(--text-on-inverse)]"
        >
          {E.timeline.title}
        </button>
      </aside>

      {/* Edit Detail timeline (W02E-4 Timeline Panel 901:12348 ×2): 32,703 · 1856 wide, down to 10 above the bottom */}
      {timelineOpen && timelineClip && (
        <div className="absolute bottom-[10px] left-[32px] right-[32px] z-20 h-[367px] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-surface)]">
          <Timeline
            clip={timelineClip}
            fromRecipe={!clip}
            structure={structure}
            face={face}
            sound={soundSpec}
            t={time.t}
            playing={!paused}
            loop={loop}
            selectedTrack={selectedTrack}
            selectedKey={selectedKey}
            onSeek={seekTo}
            onTogglePlay={togglePlay}
            onLoop={(on) => { setLoop(on); ctrl.current?.setLoop(on); }}
            onSelectTrack={(track) => { setSelectedTrack(track); if (selectedKey?.track !== track) setSelectedKey(null); }}
            onSelectKey={(key) => { setSelectedKey(key); if (key) setSelectedTrack(key.track); }}
            onAddKey={addTimelineKey}
            onDragKey={dragKey}
            onApplyKey={applyKey}
            onDeleteKey={deleteTimelineKey}
            onFaceKeyFromCurrent={faceKeyFromCurrent}
          />
        </div>
      )}

      <Modal open={failure !== null} onClose={() => setFailure(null)} title={E.failed.title} description={E.failed.body}>
        {failure && <p className="font-mono text-[14px] leading-[18px] text-[var(--text-tertiary)]">{fmt(E.failedReason, { reason: failure })}</p>}
        <ModalActions>
          <ModalButton onClick={() => router.push("/lab/user-data")}>{E.failedActions.browse}</ModalButton>
          <ModalButton variant="primary" onClick={() => { setFailure(null); void generate(); }}>{E.failedActions.retry}</ModalButton>
        </ModalActions>
      </Modal>

      <Modal open={limit !== null} onClose={() => setLimit(null)} title={E.limit.title}>
        {limit && (
          <>
            <p className="text-[16px] leading-[20px] text-[var(--text-secondary)]">
              {fmt(E.limitBody, { joint: structure.joints.find((j) => j.id === limit.joint)?.label ?? limit.joint, value: limit.value.toFixed(1), limit: limit.limit.toFixed(1), t: limit.t.toFixed(2) })}
            </p>
            <table className="text-[16px] leading-[20px]">
              <thead className="text-left text-[14px] leading-[18px] text-[var(--text-secondary)]">
                <tr><th className="font-normal">{E.limitColumns.joint}</th><th className="font-normal">{E.limitColumns.value}</th><th className="font-normal">{E.limitColumns.limit}</th></tr>
              </thead>
              <tbody className="font-mono">
                <tr className="text-[var(--text-error)]"><td>{limit.joint}</td><td>{limit.value.toFixed(1)}°</td><td>{limit.limit.toFixed(1)}°</td></tr>
              </tbody>
            </table>
            <ModalActions>
              <ModalButton onClick={() => { setLimit(null); setTimelineOpen(true); setSelectedTrack(limit.joint); seekTo(limit.t); }}>{E.limit.editTimeline}</ModalButton>
              <ModalButton variant="primary" onClick={() => void autoAdjustLimits()}>{E.limit.autoAdjust}</ModalButton>
            </ModalActions>
          </>
        )}
      </Modal>

      <TestModal
        open={testOpen}
        projectType={project.type}
        t={time.t}
        duration={time.duration}
        playing={!paused}
        limitHit={limit !== null}
        onPlay={() => { ctrl.current?.seek(0); ctrl.current?.play(); setPaused(false); }}
        onStop={() => { ctrl.current?.pause(); setPaused(true); }}
        onExportInstead={() => { setTestOpen(false); setExportOpen("file"); }}
        onClose={() => setTestOpen(false)}
      />
      {expression && timelineClip && (
        <ExportModal
          open={exportOpen !== null}
          initialDestination={exportOpen ?? "file"}
          project={{ name, type: project.type, structure }}
          expression={expression}
          clip={timelineClip}
          onFix={(issue) => {
            setExportOpen(null);
            setTimelineOpen(true);
            if (issue.joint) setSelectedTrack(issue.joint);
          }}
          onClose={() => setExportOpen(null)}
        />
      )}

      <PromptModal open={renaming} title={STRINGS.lab.rename.title} label={STRINGS.lab.rename.label} initial={name} maxLength={60} submitLabel={STRINGS.lab.rename.save} onSubmit={rename} onCancel={() => setRenaming(false)} />
      <ConfirmModal open={deleting} title={E.deleteConfirm.title} body={E.deleteConfirm.body} confirmLabel={STRINGS.common.delete} danger onConfirm={remove} onCancel={() => setDeleting(false)} />
    </div>
  );
}
