"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LIBRARY } from "@/data/library";
import { componentForSim } from "@/data/components";
import { appliedPatterns } from "@/data/patterns";
import { EDITOR_PANEL } from "@/data/editor-panel";
import { SIMREADY_ASSETS } from "@/data/simready-assets";
import { STRINGS, fmt } from "@/data/strings";
import { addFaceKey, addKey, applyBehavior, autoAdjust, delayFace, delaySound, isNeutralBehavior, NEUTRAL_BEHAVIOR, deleteFaceKey, deleteKey, formatTime, matchTiming, moveFaceKey, paramsToProps, propsToParams, recipeToClip, snapTime, channelTiles, updateKey } from "@/lib/expression";
import { diffEnergy, energySamples } from "@/lib/reference/energy";
import { flowEnergy } from "@/lib/reference/flow";
import type { Channel, Clip, Expression, FaceSpec, Key, Job, MotionBehavior, MotionProps, Project, Reference, Settings, UserDataMotion, Signature, SoundCue, SoundSpec, Structure } from "@/lib/models";
import { cueAt } from "@/data/sound-cues";
import { ReferenceError, extractFrames, readFramePixels } from "@/lib/reference/frames";

const FRAME_PX = 64;
import { signatureToParams } from "@/lib/signature/axes";
import { createSoundEngine } from "@/lib/sound";
import { ApiError, api } from "@/lib/ui/api";
import { describeChange, describeFields, emptyHistory, pushChange, undoChange, type History } from "@/lib/ui/history";
import { fileUrl, uploadFile } from "@/lib/ui/upload";
import { ROBOT_KEY, type JointState, type SimController } from "@/components/sim/sim-controller";
import { Viewport, type ViewportEvent } from "@/components/sim/Viewport";
import type { LimitEvent } from "@/components/sim/limits";
import { Icon } from "@/components/ui/icons/icon";
import { Menu } from "@/components/ui/menu";
import { ConfirmModal, Modal, ModalActions, ModalButton, PromptModal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { FacePanel, SoundPanel } from "./channel-panels";
import { logInput, withRef, type InputEntry } from "@/lib/ui/input-log";
import { ContextPanel, SET_REF, type EditorContext, type PendingReference } from "./context-panel";
import type { ReferenceItem } from "@/data/reference-sets";
import { LibraryPanel } from "./library-panel";
import { PROP_LABELS } from "./panels";
import { EditDetailButton, JointList, MotionBehaviorPanel, MotionDynamics, PanelRail } from "./right-panel";
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
type Snapshot = { props: MotionProps; face: FaceSpec; sound: SoundSpec; clip: Clip | null; behavior?: MotionBehavior };
const NEUTRAL_FACE: FaceSpec = { preset: "neutral" };
const CUE_FIELDS = {
  t: { label: STRINGS.editor.sound.fields.t, digits: 2 },
  pitchSt: { label: STRINGS.editor.sound.fields.pitchSt, digits: 1 },
  volumeDb: { label: STRINGS.editor.sound.fields.volumeDb },
};

/** Snapshot → expression.motion: a clip means keyframe mode, none means the recipe plays. */
function motionOf(e: Expression, snap: Snapshot, recipe = e.motion.recipe): Expression["motion"] {
  const behavior = snap.behavior && !isNeutralBehavior(snap.behavior) ? { behavior: snap.behavior } : {};
  return snap.clip ? { mode: "clip", recipe, clip: snap.clip, props: snap.props, ...behavior } : { mode: "recipe", recipe, props: snap.props, ...behavior };
}

/** "Speed 85 → 60", "Face sleepy → smile", "Sound cues 2 → 3"… */
function describeSnapshot(a: Snapshot, b: Snapshot): string {
  const parts = [describeChange(a.props, b.props, PROP_LABELS)].filter(Boolean);
  parts.push(...describeFields({ preset: a.face.preset }, { preset: b.face.preset }, { preset: { label: STRINGS.editor.face.label } }));
  if (a.sound.cues.length !== b.sound.cues.length) parts.push(`${STRINGS.editor.sound.label} cues ${a.sound.cues.length} → ${b.sound.cues.length}`);
  else
    for (const cb of b.sound.cues) {
      const ca = a.sound.cues.find((c) => c.id === cb.id);
      if (ca) parts.push(...describeFields(ca, cb, CUE_FIELDS).map((d) => `${STRINGS.editor.sound.label} ${d}`));
    }
  if (a.behavior !== b.behavior) parts.push(describeBehavior(a.behavior, b.behavior));
  if (!parts.length && a.clip !== b.clip) parts.push(STRINGS.editor.timeline.title);
  return parts.join(", ");
}
/** "Delay 0.0 → 3.0", "Direction Left → Right", "Easing Auto → Ease Out" */
function describeBehavior(a: MotionBehavior | undefined, b: MotionBehavior | undefined): string {
  const x = { ...NEUTRAL_BEHAVIOR, ...a };
  const y = { ...NEUTRAL_BEHAVIOR, ...b };
  const B = EDITOR_PANEL.behavior;
  const out: string[] = [];
  if (x.easing !== y.easing) out.push(`${B.easing} ${B.easings[x.easing ?? "auto"]} → ${B.easings[y.easing ?? "auto"]}`);
  if (x.direction !== y.direction) out.push(`${B.direction} ${B.directions[x.direction]} → ${B.directions[y.direction]}`);
  if (x.delay !== y.delay) out.push(`${B.delay} ${x.delay.toFixed(1)} → ${y.delay.toFixed(1)}`);
  return out.join(", ");
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
/** Play bar mute: master gain this far down is silent */
const MUTE_DB = -120;

/** The bits of the Web Speech API the composer mic uses (not in the TS DOM lib everywhere). */
interface SpeechRecognizer {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
function speechRecognition(): (new () => SpeechRecognizer) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognizer; webkitSpeechRecognition?: new () => SpeechRecognizer };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}


/** Transient stage notes (change chips, result badges, reasoning) fade after this long; `key` changing shows them again. */
const NOTE_MS = 30_000;
function useFresh(key: unknown, ms = NOTE_MS): boolean {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    setShown(true);
    const t = setTimeout(() => setShown(false), ms);
    return () => clearTimeout(t);
  }, [key, ms]);
  return shown;
}

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
  /** Motion Behavior (easing · direction · delay) — undefined = neutral */
  const [behavior, setBehavior] = useState<MotionBehavior | undefined>(initialExpression?.motion.behavior);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedKey, setSelectedKey] = useState<KeyRef | null>(null);
  const [loop, setLoop] = useState(false);
  const [activeRef, setActiveRef] = useState<Reference | null>(null);
  /** Player caption for referenced-set items (uploads show their file name) */
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  /** Frames made for referenced-set videos, per public file, so Match timing works on them too */
  const setFrames = useRef(new Map<string, Pick<Reference, "frames" | "durationS">>());
  const [sideBySide, setSideBySide] = useState(false);
  const [matching, setMatching] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState<null | "robot" | "file" | "share">(null);
  const committed = useRef<Snapshot>({ props, face, sound: soundSpec, clip, behavior });
  /** Bumped on every commit / undo — a non-neutral behavior rebuilds its clip from the committed props then */
  const [committedVersion, setCommittedVersion] = useState(0);
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
  /** Library L3: the placed 3D asset being moved (slot key "<assetId>#n") */
  const [selectedProp, setSelectedProp] = useState<string | null>(null);
  const [robotMount, setRobotMount] = useState<string | null>(project.scene?.mount ?? null);
  const sceneSave = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  /** Composer attach: images and videos both (addFiles routes by type) */
  const mediaInput = useRef<HTMLInputElement>(null);

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
  /** Context › Component card: channels per recipe step (live face / sound edits) */
  const steps = useMemo(
    () => (expression ? channelTiles(expression.motion.recipe, face, soundSpec, params, (b) => componentForSim(b)?.id ?? b) : []),
    [expression, face, soundSpec, params],
  );
  const playable = useMemo(
    () => {
      if (!expression) return undefined;
      const snap = committed.current;
      if (isNeutralBehavior(snap.behavior)) return { motion: expression.motion, face: expression.face, sound: expression.sound };
      // Motion Behavior plays as a clip, built from the committed props (speed stays live through signatureParams).
      const base = snap.clip ?? recipeToClip(expression.motion.recipe, { ...propsToParams(snap.props, axes).params, speed: 1 }, structure);
      return {
        motion: { ...expression.motion, mode: "clip" as const, clip: applyBehavior(base, snap.behavior, structure) },
        face: delayFace(snap.face, snap.behavior),
        sound: delaySound(snap.sound, snap.behavior),
      };
    },
    // Props go through signatureParams; saving them must not restart playback (a recipe without behavior).
    // With a behavior the clip is rebuilt when a change is committed (committedVersion).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expression?.id, cue, isNeutralBehavior(behavior) ? 0 : committedVersion],
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
    setBehavior(snap.behavior);
    ctrl.current?.setFace(snap.face);
    ctrl.current?.setSound(snap.sound);
  }, []);

  /** Show an edited clip at the playhead (paused) without waiting for the save. */
  const showClip = useCallback((c: Clip) => {
    const t = ctrl.current?.getTime().t ?? 0;
    // Same as playback: the committed Motion Behavior on top of the edited keys
    ctrl.current?.playClip(applyBehavior(c, committed.current.behavior, structure), undefined, { autoplay: false });
    ctrl.current?.seek(Math.min(t, c.duration));
    setPaused(true);
  }, [structure]);

  /** New baseline after generate / library apply: no undo across expressions. */
  const resetTo = useCallback((e: Expression) => {
    const snap = { props: e.motion.props, face: e.face, sound: e.sound, clip: e.motion.mode === "clip" ? e.motion.clip ?? null : null, behavior: e.motion.behavior };
    setProps(snap.props);
    setBehavior(snap.behavior);
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
    const after: Snapshot = { props, face, sound: soundSpec, clip, behavior, ...override };
    label ||= describeSnapshot(before, after);
    if (!label) return;
    committed.current = after;
    setCommittedVersion((v) => v + 1);
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
    setCommittedVersion((v) => v + 1);
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

  const editable = !!timelineClip;
  useEffect(() => {
    // Joints are picked only in Edit Detail (timeline open); elsewhere the robot is one object like the 3D assets.
    const joint = timelineOpen && selectedTrack && isJoint(selectedTrack) ? selectedTrack : null;
    ctrl.current?.highlightJoint(joint);
    // No motion yet → nothing to key, so no ring to grab.
    ctrl.current?.showJointGizmo(editable ? joint : null);
  }, [selectedTrack, editable, timelineOpen]);

  // Edit Detail only: click a robot part → its joint is selected (ring + timeline layer); drag the ring → key at the
  // playhead. With the timeline closed a click anywhere on the robot selects the whole robot (propPick ROBOT_KEY).
  useEffect(() => {
    ctrl.current?.enableJointGizmo(timelineOpen);
    if (timelineOpen && selectedProp === ROBOT_KEY) selectProp(null);
    return () => ctrl.current?.enableJointGizmo(false);
    // selectProp only touches state + the controller ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineOpen]);
  /** Clip and key the current ring drag edits (taken at the grab, so every move starts from the same value). */
  const ringDrag = useRef<{ id: string; clip: Clip; index: number; base: number; previewed: boolean } | null>(null);

  /** Latest preview, drawn once per frame (pointermove fires faster than a clip can be re-cued). */
  const ringFrame = useRef<{ raf: number; clip: Clip | null }>({ raf: 0, clip: null });
  function previewRing(next: Clip) {
    setClip(next);
    ringFrame.current.clip = next;
    if (ringFrame.current.raf) return;
    ringFrame.current.raf = requestAnimationFrame(() => {
      ringFrame.current.raf = 0;
      if (ringFrame.current.clip) showClip(ringFrame.current.clip);
    });
  }

  function pickJoint(id: string | null) {
    ringDrag.current = null;
    if (!id) {
      if (selectedTrack && isJoint(selectedTrack)) setSelectedTrack(null);
      return;
    }
    if (!structure.joints.some((j) => j.id === id)) return;
    ctrl.current?.pause();
    setPaused(true);
    setSelectedTrack(id);
  }

  function rotateJoint(id: string, deltaDeg: number, done: boolean) {
    if (!timelineClip) return;
    if (!ringDrag.current || ringDrag.current.id !== id) {
      const { clip: withKey, index } = addKey(timelineClip, id, time.t, structure);
      ringDrag.current = { id, clip: withKey, index, base: withKey.tracks[id][index].value, previewed: false };
    }
    const d = ringDrag.current;
    const next = updateKey(d.clip, id, d.index, { value: d.base + deltaDeg }, structure);
    if (!done) {
      // Hand jitter on the grab isn't an edit.
      if (Math.abs(deltaDeg) < 0.5 && !d.previewed) return;
      d.previewed = true;
      previewRing(next);
      return;
    }
    ringDrag.current = null;
    cancelAnimationFrame(ringFrame.current.raf);
    ringFrame.current = { raf: 0, clip: null };
    // A grab released without turning leaves the motion as it was.
    if (!d.previewed) return;
    setSelectedKey({ track: id, index: d.index });
    setTimelineOpen(true);
    editClip(() => next, fmt(E.timeline.edited, { joint: jointLabel(id), time: formatTime(next.tracks[id][d.index].t) }));
  }

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
      const { face: next, index } = addFaceKey(face, t, timelineClip.duration, face.preset);
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
    const keys = (face.keys ?? []).map((k, i) => (i === index ? { ...k, preset: face.preset } : k));
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

  function addCue(soundId: string) {
    const pitch = signatureToParams(axes).sound.pitchSt;
    const base = cueAt(soundId, Math.round(time.t * 100) / 100, `${soundId}-${Date.now().toString(36)}`);
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

  /** Referenced-set face / motion → reference player; its video frames are read once in the background for Match timing. */
  function openSetItem(item: ReferenceItem) {
    const id = SET_REF + item.file;
    if (activeRef?.id === id) return setActiveRef(null);
    const isClip = item.file.endsWith(".webm");
    const ref: Reference = { id, kind: isClip ? "video" : "image", path: item.file, thumb: item.poster ?? item.file, status: "ok", ...setFrames.current.get(item.file) };
    setActiveRef(ref);
    setActiveLabel(item.title);
    if (!isClip || ref.frames) return;
    void (async () => {
      const blob = await (await fetch(item.file)).blob();
      const read = await extractFrames(new File([blob], item.file.split("/").pop() ?? "motion.webm", { type: blob.type || "video/webm" }));
      const frames: string[] = [];
      for (const [i, f] of read.frames.entries()) frames.push((await uploadFile(f, { projectId: project.id, kind: "frame", name: `set-${i + 1}.jpg` })).path);
      const extra = { frames, durationS: Math.round(read.duration * 10) / 10 };
      setFrames.current.set(item.file, extra);
      setActiveRef((cur) => (cur?.id === id ? { ...cur, ...extra } : cur));
    })().catch(() => {});
  }

  // ------------------------------------------------------------ library

  /** Library › Community card: play the motion now and attach it as a userData reference (same as Community "Use"). */
  function attachCommunity(m: UserDataMotion) {
    // Play it on the robot right away (its preview recipe, once), then keep it as a reference for the next Generate
    ctrl.current?.playRecipe({ ...m.preview, loop: false });
    setPaused(false);
    if (context.references.some((r) => r.kind === "userData" && r.path === m.id)) return;
    if (context.references.length + pending.length >= MAX_REFERENCES) return;
    const ref: Reference = { id: `ref-${m.id}`, kind: "userData", path: m.id, thumb: "", status: "ok" };
    setContext((c) => ({ ...c, references: [...c.references, ref] }));
    void api(`/api/user-data/${m.id}/use`, { method: "POST" }).catch(() => {});
    toast(fmt(LIBRARY.attached, { name: m.name }));
  }

  // ------------------------------------------------------------ 3D asset props (Library L3)

  const propAsset = (key: string) => SIMREADY_ASSETS.find((a) => a.id === key.split("#")[0]);

  /** Placements are saved on the project (debounced) — the cell and turn each prop was put at. */
  const pendingScene = useRef<(() => void) | null>(null);
  function saveScene() {
    const c = ctrl.current;
    if (!c) return;
    // Read now (the controller may be gone when the timer fires), send after a short pause.
    const scene = { props: c.listProps(), mount: c.robotMount, robot: c.robotPlacement };
    const send = () => {
      pendingScene.current = null;
      void api(`/api/projects/${project.id}`, { method: "PATCH", body: JSON.stringify({ scene }) }).catch(() => toast(STRINGS.lab.toast.failed));
    };
    if (sceneSave.current) clearTimeout(sceneSave.current);
    pendingScene.current = send;
    sceneSave.current = setTimeout(send, 400);
  }
  // Leaving the editor: send what is still waiting.
  useEffect(
    () => () => {
      if (sceneSave.current) clearTimeout(sceneSave.current);
      pendingScene.current?.();
    },
    [],
  );

  function selectProp(key: string | null) {
    setSelectedProp(key);
    ctrl.current?.selectProp(key);
  }

  function placeAsset(assetId: string) {
    const c = ctrl.current;
    if (!c) return;
    const key = c.placeProp(assetId);
    const name = SIMREADY_ASSETS.find((a) => a.id === assetId)?.name ?? assetId;
    // The tile keeps focus otherwise, and Space (play) would press it again.
    (document.activeElement as HTMLElement | null)?.blur();
    if (!key) return toast(fmt(LIBRARY.slotsFull, { name }));
    selectProp(key);
    saveScene();
  }

  function removeProp(key: string) {
    ctrl.current?.removeProp(key);
    setRobotMount(ctrl.current?.robotMount ?? null);
    selectProp(null);
    saveScene();
  }

  function mountRobot(key: string | null) {
    ctrl.current?.setRobotMount(key);
    setRobotMount(ctrl.current?.robotMount ?? null);
    saveScene();
  }

  // Move mode while a prop is selected: arrows = one cell (screen direction), R = 90°, Delete = remove, Esc = done.
  // e.code, not e.key — the Korean input mode turns R into "ㄱ".
  useEffect(() => {
    if (!selectedProp) return;
    const dirs: Record<string, "up" | "down" | "left" | "right"> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      const c = ctrl.current;
      if (!c) return;
      const robot = selectedProp === ROBOT_KEY;
      if (dirs[e.code]) {
        if (robot ? !c.moveRobot(dirs[e.code]) : !c.moveProp(selectedProp, dirs[e.code])) toast(robot ? LIBRARY.robotBlocked : LIBRARY.robotInWay);
      } else if (e.code === "KeyR" && !e.metaKey && !e.ctrlKey) {
        if (robot) c.turnRobot();
        else if (!c.turnProp(selectedProp)) toast(LIBRARY.robotInWay);
      }
      else if ((e.code === "Delete" || e.code === "Backspace") && !robot) return void (e.preventDefault(), removeProp(selectedProp));
      else if (e.code === "Escape") return void selectProp(null);
      else return;
      e.preventDefault();
      saveScene();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // removeProp / saveScene read the controller (ref), not render state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProp]);

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
      case "jointPick":
        pickJoint(e.id);
        break;
      case "jointRotate":
        rotateJoint(e.id, e.deltaDeg, e.done);
        break;
      case "ready":
        ctrl.current?.restoreProps(project.scene?.props ?? [], project.scene?.mount ?? null, project.scene?.robot);
        ctrl.current?.enablePropPick(true);
        setRobotMount(ctrl.current?.robotMount ?? null);
        break;
      case "propPick":
        selectProp(e.key);
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

  // ------------------------------------------------------------ play bar · composer tools (Figma 452:2414 / 452:2426)

  /** Play bar volume: mutes the sound engine's master (cues keep their own levels) */
  const [muted, setMuted] = useState(false);
  useEffect(() => sound.setMasterDb(muted ? MUTE_DB : 0), [sound, muted]);

  const scrubbing = useRef(false);
  function scrubAt(e: React.PointerEvent<HTMLDivElement>) {
    if (!expression || !Number.isFinite(time.duration) || time.duration <= 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    seekTo(frac * time.duration);
  }

  /** Composer mic: Web Speech dictation (en-US) into the prompt; the button hides where the browser has none. */
  const [speech, setSpeech] = useState(false);
  const [listening, setListening] = useState(false);
  const recognizer = useRef<SpeechRecognizer | null>(null);
  useEffect(() => {
    setSpeech(speechRecognition() !== null);
    return () => recognizer.current?.abort();
  }, []);
  function toggleDictation() {
    if (listening) return recognizer.current?.stop();
    const Rec = speechRecognition();
    if (!Rec) return;
    const rec = new Rec();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    const base = prompt.trim();
    rec.onresult = (ev) => {
      const heard = Array.from(ev.results).map((r) => r[0]?.transcript ?? "").join("");
      setPrompt([base, heard.trim()].filter(Boolean).join(" ").slice(0, 500));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognizer.current = rec;
    setListening(true);
    rec.start();
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
      label={activeRef.id.startsWith(SET_REF) ? activeLabel : null}
    />
  );

  const ended = time.duration > 0 && time.t >= time.duration - 0.01;
  const progress = Number.isFinite(time.duration) && time.duration > 0 ? Math.min(time.t / time.duration, 1) : 0;
  // Notes that only matter right after something happened go away after 30 s (the prop bar and empty hint stay)
  const changesShown = useFresh(history.changes[history.changes.length - 1]?.id);
  const resultShown = useFresh(lastResult);
  const chip = "rounded-[var(--radius-full)] bg-[var(--bg-surface)] px-[var(--space-16)] py-[var(--space-8)] text-[14px] leading-[18px]";
  /** Play bar time "0:03" (Figma), minutes unpadded */
  const mclock = (sec: number) => (Number.isFinite(sec) ? `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}` : "-:--");
  /** Composer tool button (452:2431): 33, r 10, #f0f0f0 + 1px #eaeaea, inner white glow */
  const tool =
    "flex size-[33px] shrink-0 items-center justify-center rounded-[10px] border border-[var(--composer-tool-border)] bg-[var(--composer-tool)] p-[7px] text-[var(--composer-tool-icon)] shadow-[inset_0_0_20px_0_rgb(255_255_255/0.63)] disabled:opacity-40";

  // W02D-1/3/4/5 (Figma 901:9691 · 10163 · 10631 · 11097, ×2): full-bleed stage behind floating panels —
  // left Context/Library 343×1016 at 32,32 · right channel panel 380×1016 at right 32 · play bar 634,868 · composer 513,918.
  // Placed against the viewport, not a 1920×1080 board (root zoom 0.67): panels run 32 → bottom 32, centred items keep their
  // Figma offset from the centre (x − 960), bottom items their distance from the bottom (1080 − y − h).
  return (
    <div className="relative h-[var(--app-vh)] overflow-hidden">
      {/* Stage: full width and full height from the top (the old 265 slot cut off a bigger robot / one standing on furniture).
          Never zoom/transform the Viewport. W02E-4: with the timeline open the slot ends just above the panel (10 + 367 + 10). */}
      <div className={`absolute left-0 top-0 ${timelineOpen ? "bottom-[387px]" : "bottom-0"} ${activeRef && sideBySide ? "w-[calc(50%-2px)]" : "right-0"}`}>
        <Viewport
          controllerRef={ctrl}
          structure={structure}
          signatureParams={params}
          expression={playable}
          autoPlay={autoPlay}
          sound={sound}
          mode="editor"
          props={SIMREADY_ASSETS}
          onEvent={onEvent}
          className="block size-full"
        />
      </div>
      {activeRef && sideBySide && (
        <div className="absolute left-[calc(50%-2px)] top-[265px] h-[560px] w-[518px] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-surface)]">{referencePlayer}</div>
      )}
      {activeRef && !sideBySide && <div className="absolute bottom-[230px] left-[494px] z-10">{referencePlayer}</div>}

      {/* Change chip (W02E-1 901:12020 ×2): centered at top 300 above the robot — "Speed  85 → 60  Undo" (Caption Strong 14, shadow 0 6 20 #0000001f).
          Up to the last three changes; Undo on the newest. Moves up with the robot when the timeline is open. */}
      {history.changes.length > 0 && changesShown && (
        <div className={`absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-[var(--space-8)] ${timelineOpen ? "top-[200px]" : "top-[300px]"}`} data-testid="change-chips">
          {history.changes.slice(-3).map((c, i, list) => (
            <span
              key={c.id}
              className="anim-rise-in flex items-center gap-[var(--space-12)] whitespace-pre rounded-[var(--radius-full)] bg-[var(--bg-surface)] px-[var(--space-16)] py-[var(--space-8)] text-[14px] font-medium leading-[18px] text-[var(--text-primary)] shadow-[var(--pure-shadow-chip)]"
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
      <div className="pointer-events-none absolute left-[494px] right-[512px] top-[32px] z-10 flex flex-col items-center gap-[var(--space-12)]">
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-[var(--space-8)]">
          {resultShown && lastResult?.directClip && expression && !busy && (
            <span className={`${chip} text-[var(--web-3f77a1)]`} title={lastResult.directClip.reason}>
              {lastResult.directClip.used ? E.directClip.used : fmt(E.directClip.fallback, { reason: lastResult.directClip.reason ?? "" })}
            </span>
          )}
          {resultShown && lastResult?.source === "demo" && expression && !busy && <span className={`${chip} text-[var(--web-ae7d24)]`}>{E.demoBadge}</span>}
        </div>
        {selectedProp && (
          <div data-testid="prop-bar" className={`${chip} pointer-events-auto flex items-center gap-[var(--space-12)] shadow-[var(--pure-shadow-chip)]`}>
            <span className="font-semibold text-[var(--text-primary)]">{selectedProp === ROBOT_KEY ? LIBRARY.robot : propAsset(selectedProp)?.name}</span>
            <span className="text-[var(--text-secondary)]">{selectedProp === ROBOT_KEY ? LIBRARY.robotHint : LIBRARY.moveHint}</span>
            {selectedProp === ROBOT_KEY && robotMount && (
              <button type="button" onClick={() => mountRobot(null)} className="font-medium text-[var(--text-brand)]">
                {LIBRARY.robotToFloor}
              </button>
            )}
            {propAsset(selectedProp)?.role === "stage" && (
              <button type="button" onClick={() => mountRobot(robotMount === selectedProp ? null : selectedProp)} className="font-medium text-[var(--text-brand)]">
                {robotMount === selectedProp ? LIBRARY.robotToFloor : LIBRARY.putRobot}
              </button>
            )}
            {selectedProp !== ROBOT_KEY && (
              <button type="button" onClick={() => removeProp(selectedProp)} className="font-medium text-[var(--text-error)]">
                {LIBRARY.remove}
              </button>
            )}
          </div>
        )}
        {resultShown && expression && lastResult?.reasoning && (
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
      <aside className={`absolute left-[32px] top-[32px] z-10 flex ${timelineOpen ? "bottom-[397px]" : "bottom-[32px]"} w-[430px] flex-col overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-surface)]`}>
        {/* Header (452:2269 / 2270): list icon 24 at 21,21, title Regular 20 #2c3030 at 66 */}
        <div className="flex items-center gap-[21px] pl-[21px] pt-[21px]">
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
          <h1 className="min-w-0 truncate pr-[var(--space-20)] text-[20px] leading-[25px] text-[var(--context-title)]">{name}</h1>
        </div>
        {/* Tabs (452:2272): at 13,60 · p 10 · gap 15; selected SemiBold 20 #2c3030 underlined, other Regular 20 #3d4452 */}
        <div className="ml-[13px] mt-[14px] flex gap-[15px]" role="tablist">
          {(["context", "library"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={leftTab === t}
              onClick={() => setLeftTab(t)}
              className={`p-[10px] text-[20px] leading-[25px] ${leftTab === t ? "font-semibold text-[var(--context-title)] underline decoration-from-font underline-offset-auto" : "text-[var(--context-tab)]"}`}
            >
              {t === "context" ? E.context : E.library}
            </button>
          ))}
        </div>
        <div className="mt-[28px] min-h-0 flex-1 overflow-y-auto pb-[var(--space-32)] pl-[19px] pr-[17px]">
          {leftTab === "context" ? (
            <ContextPanel
              context={context}
              behaviors={expression?.motion.recipe.steps.map((st) => st.behavior) ?? []}
              steps={steps}
              patterns={expression && !busy ? appliedPatterns(expression.pattern, expression.components) : []}
              busy={busy}
              onChange={(patch) => setContext((c) => ({ ...c, ...patch }))}
              onOpenReference={(r) => r.kind !== "userData" && setActiveRef(activeRef?.id === r.id ? null : r)}
              onOpenSetItem={openSetItem}
              activeReference={activeRef?.id ?? null}
              reading={reading}
            />
          ) : (
            <LibraryPanel
              attached={context.references.filter((r) => r.kind === "userData").map((r) => r.path)}
              onAttach={attachCommunity}
              onPlaceAsset={placeAsset}
            />
          )}
        </div>
      </aside>

      {/* Generating (901:11082 ×2): pill at 665,784 with Stop */}
      {busy && job && (
        <div aria-hidden className="anim-pulse pointer-events-none absolute bottom-[222px] left-[calc(50%-139px)] z-10 h-[4px] w-[240px] rounded-[var(--radius-full)] bg-[var(--primary)]" />
      )}
      {busy && job && (
        <div
          className="anim-rise-in absolute bottom-[244px] left-[calc(50%-295px)] z-10 flex items-center gap-[var(--space-16)] rounded-[var(--radius-full)] bg-[var(--bg-surface)] px-[var(--space-24)] py-[var(--space-16)] shadow-[var(--pure-shadow-modal)]"
          data-testid="generating"
          title={`${job.stepLabel} · ${job.progress}%`}
        >
          <Icon name="spinner" size={20} className="shrink-0 animate-spin text-[var(--text-primary)]" />
          <span className="text-[16px] font-medium leading-[20px] text-[var(--text-primary)]">{E.generating}</span>
          <span className="sr-only" aria-live="polite">{job.stepLabel} · {job.progress}%</span>
          <button type="button" onClick={stop} className="text-[16px] font-medium leading-[20px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">{E.stop}</button>
        </div>
      )}

      {/* Bottom stack: play bar 20 above the composer, so it rides up when attach chips make the composer taller */}
      <div className="pointer-events-none absolute bottom-[32px] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-[20px]">
      {/* Play bar (452:2414): white pill 550×68 (pad 10 · 21 right), centred, 20 above the composer (user review; Figma 156) — play 48 (pill grey 20%),
          time Medium 14.986, 331×9 track (#829398 at 20%, fill full strength) with a 21 knob ring, volume 24 (mute).
          W02E-4: hidden under the Timeline Panel while it's open (its transport takes over). Shown at 80% (zoom, user review). */}
      {!timelineOpen && (
      <div className="pointer-events-auto flex h-[68px] w-[550px] shrink-0 [zoom:0.8] items-center gap-[14px] rounded-[var(--radius-full)] bg-[var(--bg-surface)] py-[10px] pl-[10px] pr-[21px]">
        <span data-testid="time" className="sr-only">{fmtT(time.t)} / {fmtT(time.duration)}</span>
        <button
          type="button"
          disabled={!expression}
          onClick={togglePlay}
          aria-label={paused ? (ended ? E.replay : E.play) : E.pause}
          title={paused ? (ended ? E.replay : E.play) : E.pause}
          className="flex size-[48px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--community-pill)] text-[var(--playbar-icon)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {paused ? (
            <Icon name="play-solid" size={19.407} />
          ) : (
            <span className="flex gap-[4px]" aria-hidden>
              <span className="h-[15px] w-[4px] rounded-[var(--radius-2xs)] bg-current" />
              <span className="h-[15px] w-[4px] rounded-[var(--radius-2xs)] bg-current" />
            </span>
          )}
        </button>
        <span className="shrink-0 whitespace-nowrap text-[14.986px] font-medium leading-[1.6] tracking-[-0.2997px] text-[var(--playbar-text)] tabular-nums">
          {mclock(time.t)} / {mclock(time.duration)}
        </span>
        {/* Track: click or drag to seek (pauses, like the timeline scrubber) */}
        <div
          role="slider"
          tabIndex={expression ? 0 : -1}
          aria-label={E.seek}
          aria-valuemin={0}
          aria-valuemax={Number.isFinite(time.duration) ? Number(time.duration.toFixed(2)) : 0}
          aria-valuenow={Number(time.t.toFixed(2))}
          aria-valuetext={`${mclock(time.t)} / ${mclock(time.duration)}`}
          className={`relative h-[21px] w-[331px] shrink-0 ${expression ? "cursor-pointer" : "pointer-events-none"}`}
          onPointerDown={(e) => {
            scrubbing.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            scrubAt(e);
          }}
          onPointerMove={(e) => scrubbing.current && scrubAt(e)}
          onPointerUp={() => (scrubbing.current = false)}
          onKeyDown={(e) => {
            if (!Number.isFinite(time.duration)) return;
            const step = e.key === "ArrowRight" ? 0.5 : e.key === "ArrowLeft" ? -0.5 : 0;
            if (!step) return;
            e.preventDefault();
            seekTo(Math.min(Math.max(time.t + step, 0), time.duration));
          }}
        >
          <div className="absolute left-0 top-[6.5px] h-[9px] w-[331px] overflow-hidden rounded-[8px]">
            <div className="absolute inset-0 rounded-[9px] bg-[var(--playbar-track)] opacity-20" />
            <div className="absolute inset-y-0 left-0 bg-[var(--playbar-track)]" style={{ width: progress * 331 }} />
          </div>
          <span
            className="absolute top-0 size-[21px] rounded-full border-[5px] border-[var(--playbar-track)] bg-[var(--bg-surface)]"
            style={{ left: Math.min(Math.max(progress * 331 - 13, 0), 310) }}
            aria-hidden
          />
        </div>
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? E.unmute : E.mute}
          aria-pressed={muted}
          title={muted ? E.unmute : E.mute}
          className="flex size-[24px] shrink-0 items-center justify-center text-[var(--playbar-icon)]"
        >
          <Icon name={muted ? "volume-cross" : "volume-loud"} size={24} />
        </button>
      </div>
      )}

      {/* Composer (452:2426): 646 wide card, r 20, 1px #ededed + drop shadow, pad 16 · 12 bottom — prompt (16, #b1b1b1
          placeholder), then attach / dictate tools (33, r 10) and a 74×33 Send. Centred, bottom 32 like the panels (Figma 24).
          Shown at 120% (zoom, user review). Attach chips sit above the prompt. W02E-4 collapses it while the timeline is open. */}
      <form
        hidden={timelineOpen}
        className="pointer-events-auto flex w-[646px] flex-col items-center gap-[var(--space-12)] [zoom:1.2]"
        onSubmit={(e) => { e.preventDefault(); void generate(); }}
      >
        <div className="flex min-h-[106px] w-full flex-col justify-between gap-[var(--space-12)] rounded-[20px] border border-[var(--composer-border)] bg-[var(--bg-surface)] px-[16px] pb-[12px] pt-[16px] shadow-[var(--composer-shadow)]">
          {(context.references.length > 0 || pending.length > 0) && (
            <div className="flex flex-wrap items-center gap-[var(--space-8)] text-[14px] leading-[18px]" data-testid="attach-chips">
              {context.references.map((r) => (
                <span
                  key={r.id}
                  className={`flex max-w-[200px] items-center gap-[var(--space-4)] rounded-[var(--radius-full)] border px-[var(--space-12)] py-[var(--space-4)] ${r.status === "failed" ? "border-[var(--border-error)] text-[var(--text-error)]" : "border-[var(--border-default)] text-[var(--text-primary)]"}`}
                >
                  <span className="truncate">{r.kind === "video" ? "▶" : "▣"} {r.path.split("/").pop()?.replace(/^[0-9a-f]{8}-/, "")}</span>
                  <button type="button" aria-label={E.removeReference} onClick={() => setContext((c) => ({ ...c, references: c.references.filter((x) => x.id !== r.id) }))}>×</button>
                </span>
              ))}
              {pending.map((p) => (
                <span key={p.id} className="max-w-[200px] truncate rounded-[var(--radius-full)] border border-dashed border-[var(--border-default)] px-[var(--space-12)] py-[var(--space-4)] text-[var(--text-tertiary)]">
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
            className="w-full bg-transparent text-[16px] leading-none tracking-[-0.32px] text-[var(--text-primary)] outline-none placeholder:text-[var(--composer-placeholder)] disabled:opacity-60"
          />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-[5px]">
              <button
                type="button"
                aria-label={E.attachMedia}
                disabled={busy || context.references.length + pending.length >= MAX_REFERENCES}
                title={`${E.attachMedia} — ${E.referenceRules}`}
                onClick={() => mediaInput.current?.click()}
                className={tool}
              >
                <Icon name="clipboard-add" size={20} />
              </button>
              {speech && (
                <button
                  type="button"
                  aria-label={listening ? E.dictateStop : E.dictate}
                  aria-pressed={listening}
                  title={listening ? E.dictateStop : E.dictate}
                  disabled={busy}
                  onClick={toggleDictation}
                  className={`${tool} ${listening ? "border-[var(--playbar-track)] text-[var(--playbar-track)]" : ""}`}
                >
                  <Icon name="microphone" size={24} />
                </button>
              )}
            </div>
            <button
              type="submit"
              title={E.generate}
              disabled={busy || !prompt.trim()}
              className="flex h-[33px] w-[74px] items-center justify-center rounded-[10px] bg-[var(--composer-send)] p-[7px] text-[16px] font-medium leading-none text-[var(--text-on-inverse)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {E.send}
            </button>
          </div>
        </div>
        <input ref={mediaInput} type="file" multiple accept="image/*,video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }} />
      </form>
      </div>

      {/* Right panel (Figma 452:2024): content column 330 at 24 · divider at 378 · Motion / Face / Sound rail at 397, Edit Detail at the bottom */}
      <aside className={`absolute right-[32px] top-[32px] z-10 ${timelineOpen ? "bottom-[397px]" : "bottom-[32px]"} w-[448px] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-surface)] shadow-[var(--editor-panel-shadow)]`}>
        {/* Scroll column starts 8 left of the content so field borders and the focus ring aren't clipped */}
        <div className="absolute bottom-[96px] left-[16px] top-[24px] flex w-[354px] flex-col gap-[40px] overflow-y-auto overflow-x-hidden pb-[var(--space-8)] pl-[8px] pr-[16px] pt-[4px] -mt-[4px]">
          {tab === "motion" && (
            <>
              <MotionDynamics
                props={props}
                warnings={warnings}
                durationS={timelineClip?.duration ?? null}
                onChange={(key, value) => setProps((p) => ({ ...p, [key]: value }))}
                onCommit={(patch) => void commit(patch ? { props: { ...props, ...patch } } : {})}
              />
              <MotionBehaviorPanel behavior={behavior} onChange={setBehavior} onCommit={(next) => void commit(next ? { behavior: next } : {})} />
              <JointList joints={joints} structure={structure} flagged={limit?.joint} />
            </>
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
        </div>
        <div className="absolute bottom-[22px] left-[24px]">
          <EditDetailButton open={timelineOpen} onClick={() => setTimelineOpen(!timelineOpen)} />
        </div>
        <span className="absolute bottom-[16px] left-[378px] top-[16px] w-px bg-[var(--editor-divider)]" aria-hidden />
        <div className="absolute left-[397px] top-[42px]">
          <PanelRail tab={tab} enabled={hasChannel} onTab={setTab} />
        </div>
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
          <ModalButton onClick={() => router.push("/lab/community")}>{E.failedActions.browse}</ModalButton>
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
          expression={{ ...expression, face: delayFace(expression.face, behavior), sound: delaySound(expression.sound, behavior) }}
          clip={applyBehavior(timelineClip, behavior, structure)}
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
