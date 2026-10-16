/**
 * SimController — the simulator contract (BuildPlay_Book appendix B).
 *
 * After STEP 3 this file is the only door into lib/sim and components/sim
 * (CLAUDE.md rule 3). Pages use it through <Viewport controllerRef>.
 * All joint ids are the robot's own (`shoulder_pitch`, …); recipes, clips, face and
 * sound use the lib/models.ts types.
 */

import { BEHAVIORS, HOME } from '@/lib/sim/behaviors';
import { engineJoint, toEngineClip } from '@/lib/sim/clip-map';
import { DEFAULT_PARAMS, applyParams, resolveParams, scaleTime, type PlaybackParams } from '@/lib/sim/params';
import { retargetMotion, type CameraView } from '@/lib/sim/robots';
import { SequencePlayer, clipPlayable, motionPlayable } from '@/lib/sim/sequence';
import type { Clip, FaceSpec, Recipe, SoundCue, SoundSpec, Structure } from '@/lib/models';
import { FACE_PRESETS } from '@/data/face-presets';
import { FACE_DEFAULTS, type FaceParams } from './face-canvas';
import { LEAD_IN, SimRuntime, type JointState as RuntimeJointState, type PlaybackSource, type SimRuntimeOptions } from './runtime';
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
};
export type SimEventName = keyof SimEventMap;

export interface SimControllerOptions extends SimRuntimeOptions {
  sound?: SoundEngine;
}

/** FaceSpec → canvas params: preset bundle, then tokens on top. */
export function faceSpecToParams(spec: FaceSpec): FaceParams {
  const preset = (FACE_PRESETS as Record<string, FaceParams>)[spec.preset] ?? FACE_DEFAULTS;
  return { ...preset, ...spec.tokens, eyeOpen: spec.tokens.eyeOpen ?? preset.eyeOpen };
}

export class SimController {
  readonly ready: Promise<void>;
  private readonly runtime: SimRuntime;
  private readonly sound: SoundEngine;
  private params: Required<PlaybackParams> = { ...DEFAULT_PARAMS };
  private source: PlaybackSource | null = null;
  private recipe: Recipe | null = null;
  private view: ViewParams = {};
  private orbit: { on: boolean; pan?: boolean; zoom?: boolean } = { on: true };
  private highlighted: string | null = null;
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
          this.sound.stop();
          this.emit('ended', { name: e.name });
          break;
        case 'step':
          this.applyStepFace(e.name, e.index);
          break;
        case 'tick':
          this.emit('tick', { t: e.t, duration: e.duration });
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
    this.runtime.setSpeed(this.params.speed);
    this.runtime.play(source, opts);
    if (opts.autoplay === false) this.sound.seek(0);
    else this.sound.play(0);
  }

  private applyStepFace(name: string, index: number): void {
    if (name !== 'recipe' || !this.recipe) return;
    const preset = this.recipe.steps[index]?.face;
    if (!preset) return;
    if (preset === 'video') this.runtime.setFace({ kind: 'video' });
    else if (preset in FACE_PRESETS) this.runtime.setFace({ kind: 'canvas', params: FACE_PRESETS[preset as keyof typeof FACE_PRESETS] });
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
    this.sound.stop();
    this.runtime.stop();
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
    if (spec.preset === 'video') this.runtime.setFace({ kind: 'video' });
    else this.runtime.setFace({ kind: 'canvas', params: faceSpecToParams(spec) });
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

  /** Viewer calls made before the model loaded are replayed here. */
  private applyViewState(): void {
    this.runtime.setView(this.view as Partial<CameraView>);
    this.runtime.enableOrbit(this.orbit.on, this.orbit);
    this.runtime.highlightJoint(this.highlighted);
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
