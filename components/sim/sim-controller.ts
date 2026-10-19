/**
 * SimController — the simulator contract (docs/conventions.md rule 3).
 *
 * After STEP 3 this file is the only door into lib/sim and components/sim
 * (docs/conventions.md rule 3). Pages use it through <Viewport controllerRef>.
 * All joint ids are the robot's own (`shoulder_pitch`, …); recipes, clips, face and
 * sound use the lib/models.ts types.
 */

import { BEHAVIORS, HOME } from '@/lib/sim/behaviors';
import { engineJoint, toEngineClip } from '@/lib/sim/clip-map';
import { DEFAULT_PARAMS, applyParams, resolveParams, scaleTime, type PlaybackParams } from '@/lib/sim/params';
import { retargetMotion, type CameraView } from '@/lib/sim/robots';
import { SequencePlayer, clipPlayable, motionPlayable } from '@/lib/sim/sequence';
import type { Clip, FaceSpec, Recipe, SoundCue, SoundSpec, Structure } from '@/lib/models';
import { FACE_DIR, FACE_VIDEOS } from '@/data/face-videos';
import { faceAtTime, faceName } from '@/lib/expression/face';
import { LEAD_IN, SimRuntime, type FaceSource, type JointState as RuntimeJointState, type PlaybackSource, type SimRuntimeOptions } from './runtime';
import type { LimitEvent } from './limits';

export type { PlaybackParams };
export { DEFAULT_PARAMS };

/** Ease between recipe steps (seconds). */
const JOIN_IN = 0.35;
const JOINT_STATE_INTERVAL = 100;

export interface JointState {
  id: string;
  command: number;
  actual: number;
}

export interface ViewParams {
  azimuth?: number;
  elevation?: number;
  distance?: number;
}

/**
 * Web Audio side, injected so STEP 9 can add sound without touching the sealed sim.
 * The controller keeps it in sync with play / pause / seek / stop.
 */
export interface SoundEngine {
  setSpec(spec: SoundSpec | null): void;
  preview(cue: SoundCue): void;
  play(t: number): void;
  pause(): void;
  seek(t: number): void;
  stop(): void;
  /** Every sim tick (30 Hz) with the playback time and speed — keeps cues on the motion clock. */
  sync?(t: number, speed: number): void;
}

const silentSound: SoundEngine = {
  setSpec() {},
  preview() {},
  play() {},
  pause() {},
  seek() {},
  stop() {},
};

export type SimEventMap = {
  ready: void;
  playing: { name: string };
  ended: { name: string };
  tick: { t: number; duration: number };
  limitExceeded: LimitEvent;
  jointState: JointState[];
  error: { message: string };
  /** Editor gizmo (enableJointGizmo): a robot part was clicked — the joint that moves it, null = base / empty */
  jointPick: { id: string | null };
  /** Editor gizmo: rotation ring dragged — degrees swept since the grab; `done` on release */
  jointRotate: { id: string; deltaDeg: number; done: boolean };
};
export type SimEventName = keyof SimEventMap;

export interface SimControllerOptions extends SimRuntimeOptions {
  sound?: SoundEngine;
}

/** Face name → screen source: a face video, or "auto" (anything else) = the per-behavior video. */
function faceSource(name: string | null): FaceSource {
  const video = name ? (FACE_VIDEOS as Record<string, { file: string }>)[name] : undefined;
  return video ? { kind: 'video', url: FACE_DIR + video.file } : { kind: 'video' };
}

export class SimController {
  readonly ready: Promise<void>;
  private readonly runtime: SimRuntime;
  private readonly sound: SoundEngine;
  private params: Required<PlaybackParams> = { ...DEFAULT_PARAMS };
  private source: PlaybackSource | null = null;
  private recipe: Recipe | null = null;
  /** The expression's face; timeline keys are re-evaluated on every tick while it plays. */
  private faceSpec: FaceSpec | null = null;
  /** Face of the recipe step playing now (used when the face has no timeline keys). */
  private stepFace: string | null = null;
  /** Face name on the screen, so a tick only swaps the video when it changes. */
  private shownFace: string | null | undefined = undefined;
  private expressionActive = false;
  private view: ViewParams = {};
  private orbit: { on: boolean; pan?: boolean; zoom?: boolean } = { on: true };
  private highlighted: string | null = null;
  private gizmo: { on: boolean; joint: string | null } = { on: false, joint: null };
  private readonly handlers = new Map<SimEventName, Set<(payload: never) => void>>();
  private jointTimer: ReturnType<typeof setInterval> | null = null;

  constructor(canvas: HTMLCanvasElement, options: SimControllerOptions = {}) {
    this.sound = options.sound ?? silentSound;
    this.runtime = new SimRuntime(canvas, options);
    this.runtime.idleTransform = (m) => applyParams(m, this.params, HOME);
    this.runtime.on((e) => {
      switch (e.type) {
        case 'ready':
          this.applyViewState();
          this.jointTimer = setInterval(() => this.emit('jointState', this.getJointState()), JOINT_STATE_INTERVAL);
          this.emit('ready', undefined);
          break;
        case 'error':
          this.emit('error', { message: e.message });
          break;
        case 'playing':
          if (!e.name.startsWith('idle:')) this.emit('playing', { name: e.name });
          break;
        case 'ended':
          this.expressionActive = false;
          this.sound.stop();
          this.emit('ended', { name: e.name });
          break;
        case 'step':
          this.applyStepFace(e.name, e.index);
          break;
        case 'tick':
          this.sound.sync?.(e.t, this.params.speed);
          if (this.expressionActive && this.faceSpec?.keys?.length) this.applyFace(e.t);
          this.emit('tick', { t: e.t, duration: e.duration });
          break;
        case 'jointPick':
          this.emit('jointPick', { id: e.id });
          break;
        case 'jointRotate':
          this.emit('jointRotate', { id: e.id, deltaDeg: e.deltaDeg, done: e.done });
          break;
        case 'limitExceeded': {
          const { type: _type, ...event } = e;
          if (this.runtime.stopOnLimit) this.sound.pause();
          this.emit('limitExceeded', event);
          break;
        }
      }
    });
    this.ready = this.runtime.ready;
  }

  dispose(): void {
    if (this.jointTimer) clearInterval(this.jointTimer);
    this.sound.stop();
    this.runtime.dispose();
    this.handlers.clear();
  }

  // ---------------------------------------------------------------- events

  on<K extends SimEventName>(event: K, handler: (payload: SimEventMap[K]) => void): () => void {
    let set = this.handlers.get(event);
    if (!set) this.handlers.set(event, (set = new Set()));
    set.add(handler as (payload: never) => void);
    return () => set.delete(handler as (payload: never) => void);
  }

  private emit<K extends SimEventName>(event: K, payload: SimEventMap[K]): void {
    for (const h of this.handlers.get(event) ?? []) (h as (p: SimEventMap[K]) => void)(payload);
  }

  // ---------------------------------------------------------------- structure

  /** Inject structure joint ranges — the basis for limitExceeded. */
  async load(structure: Structure): Promise<void> {
    const limits: Record<string, [number, number]> = {};
    for (const j of structure.joints) limits[j.id] = [j.min, j.max];
    this.runtime.setLimits(limits);
  }

  // ---------------------------------------------------------------- playback

  playBehavior(name: string, p?: PlaybackParams): void {
    const motion = BEHAVIORS.find((b) => b.name === name);
    if (!motion) return;
    if (p) this.params = resolveParams({ ...this.params, ...p });
    this.recipe = null;
    this.start({
      name,
      build: (start) =>
        motionPlayable(applyParams(retargetMotion(this.runtime.robot, motion), this.params, HOME), start, LEAD_IN),
      faceBehavior: () => name,
    });
  }

  playRecipe(recipe: Recipe, p?: PlaybackParams, opts: { autoplay?: boolean } = {}): void {
    if (p) this.params = resolveParams({ ...this.params, ...p });
    if (recipe.loop !== undefined) this.runtime.setLoop(recipe.loop);
    this.recipe = recipe;
    this.start(this.recipeSource(recipe), opts);
  }

  playClip(clip: Clip, p?: PlaybackParams, opts: { autoplay?: boolean } = {}): void {
    if (p) this.params = resolveParams({ ...this.params, ...p });
    if (clip.loop !== undefined) this.runtime.setLoop(clip.loop);
    this.recipe = null;
    // Clips are absolute keyframes (timeline output): only speed applies.
    const engine = toEngineClip(clip, this.runtime.robot);
    this.start({ name: 'clip', build: () => clipPlayable(engine), faceBehavior: () => null }, opts);
  }

  private recipeSource(recipe: Recipe): PlaybackSource {
    const robot = this.runtime.robot;
    const motions = recipe.steps.map((s) => BEHAVIORS.find((b) => b.name === s.behavior));
    return {
      name: 'recipe',
      build: (start) =>
        new SequencePlayer(
          recipe.steps.flatMap((step, i) => {
            const motion = motions[i];
            if (!motion) return [];
            const amplitude = this.params.amplitude * step.amplitude;
            const scaled = scaleTime(retargetMotion(robot, motion), step.speed > 0 ? step.speed : 1);
            return [{ motion: applyParams(scaled, { ...this.params, amplitude }, HOME), repeat: step.repeat }];
          }),
          start,
          LEAD_IN,
          JOIN_IN,
        ),
      faceBehavior: (i) => recipe.steps[i]?.behavior ?? null,
    };
  }

  private start(source: PlaybackSource, opts: { autoplay?: boolean } = {}): void {
    this.source = source;
    this.expressionActive = true;
    this.stepFace = null;
    this.applyFace(0);
    this.runtime.setSpeed(this.params.speed);
    this.runtime.play(source, opts);
    this.sound.sync?.(0, this.params.speed);
    if (opts.autoplay === false) this.sound.seek(0);
    else this.sound.play(0);
  }

  private applyStepFace(name: string, index: number): void {
    if (name !== 'recipe' || !this.recipe) return;
    this.stepFace = faceName(this.recipe.steps[index]?.face);
    this.applyFace(this.runtime.getTime().t);
  }

  /** Signature-driven idle (applies immediately). */
  setIdle(p: PlaybackParams & { behavior?: string; on?: boolean }): void {
    const { behavior, on = true, ...params } = p;
    this.params = resolveParams({ ...this.params, ...params });
    this.runtime.setSpeed(this.params.speed);
    this.runtime.setIdle(on, behavior);
    this.runtime.refreshIdle();
  }

  /** Motion Properties — applied to what is playing right now. */
  setParams(p: PlaybackParams): void {
    this.params = resolveParams({ ...this.params, ...p });
    this.runtime.setSpeed(this.params.speed);
    if (this.source) {
      if (this.recipe) this.source = this.recipeSource(this.recipe);
      this.runtime.rebuild(this.source);
    }
    this.runtime.refreshIdle();
  }

  getParams(): Required<PlaybackParams> {
    return { ...this.params };
  }

  play(): void {
    this.runtime.resume();
    this.sound.play(this.runtime.getTime().t);
  }

  pause(): void {
    this.runtime.setPaused(true);
    this.sound.pause();
  }

  seek(t: number): void {
    this.runtime.seek(t);
    this.sound.seek(this.runtime.getTime().t);
  }

  /** Back to HOME and hold. */
  stop(): void {
    this.source = null;
    this.recipe = null;
    this.expressionActive = false;
    this.sound.stop();
    this.runtime.stop();
    this.applyFace(0);
  }

  setLoop(on: boolean): void {
    this.runtime.setLoop(on);
  }

  getTime(): { t: number; duration: number } {
    return this.runtime.getTime();
  }

  isPaused(): boolean {
    return this.runtime.isPaused;
  }

  /** Pause at the first limit overshoot (default on). */
  setStopOnLimit(on: boolean): void {
    this.runtime.stopOnLimit = on;
  }

  // ---------------------------------------------------------------- face & sound

  setFace(spec: FaceSpec): void {
    this.faceSpec = spec;
    this.applyFace(this.runtime.getTime().t);
  }

  /** Timeline keys win, then the recipe step's face, then the expression's face. */
  private applyFace(t: number): void {
    const spec = this.faceSpec;
    const keyed = this.expressionActive && spec?.keys?.length ? faceAtTime(spec, t) : null;
    const name = faceName(keyed ?? (this.expressionActive ? this.stepFace : null) ?? spec?.preset);
    if (name === this.shownFace) return;
    this.shownFace = name;
    this.runtime.setFace(faceSource(name));
  }

  setSound(spec: SoundSpec | null): void {
    this.sound.setSpec(spec);
  }

  previewCue(cue: SoundCue): void {
    this.sound.preview(cue);
  }

  // ---------------------------------------------------------------- view

  /** Canvas size changed (Viewport's ResizeObserver). */
  resize(width: number, height: number): void {
    this.runtime.resize(width, height);
  }

  setView(v: ViewParams): void {
    this.view = { ...this.view, ...v };
    this.runtime.setView(this.view as Partial<CameraView>);
  }

  enableOrbit(on: boolean, opts: { pan?: boolean; zoom?: boolean } = {}): void {
    this.orbit = { on, ...opts };
    this.runtime.enableOrbit(on, opts);
  }

  highlightJoint(id: string | null): void {
    this.highlighted = id;
    this.runtime.highlightJoint(id);
  }

  /** Editor: click a part to pick its joint, drag the ring to turn it (events jointPick / jointRotate). */
  enableJointGizmo(on: boolean): void {
    this.gizmo.on = on;
    this.runtime.enableGizmo(on);
  }

  /** Rotation ring on a robot joint id (null hides it). Pose edits stay with the caller (clip keys + seek). */
  showJointGizmo(id: string | null): void {
    this.gizmo.joint = id;
    this.runtime.setGizmo(id);
  }

  /** Viewer calls made before the model loaded are replayed here. */
  private applyViewState(): void {
    this.runtime.setView(this.view as Partial<CameraView>);
    this.runtime.enableOrbit(this.orbit.on, this.orbit);
    this.runtime.highlightJoint(this.highlighted);
    this.runtime.enableGizmo(this.gizmo.on);
    this.runtime.setGizmo(this.gizmo.joint);
  }

  /** Joint anchors in canvas pixels — structure screen joint numbers. */
  projectJoints(): { id: string; x: number; y: number; visible: boolean }[] {
    return this.runtime.projectJoints();
  }

  getJointState(): JointState[] {
    return this.runtime.getJointState().map(({ id, command, actual }: RuntimeJointState) => ({ id, command, actual }));
  }

  /** PNG dataURL of the current frame ("" before the model loads). */
  capture(): string {
    return this.runtime.capture() ?? '';
  }

  /** Dev tools only: command joints directly by robot joint id (overdrive test). */
  debugCommand(pose: Record<string, number>): void {
    const engine: Record<string, number> = {};
    for (const [id, value] of Object.entries(pose)) {
      const joint = engineJoint(this.runtime.robot, id);
      if (joint) engine[joint] = value;
    }
    this.runtime.commandPose(engine, 'debug');
  }
}
