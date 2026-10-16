/**
 * Simulator runtime — the playback half of _ref's LeLampProvider, without React or
 * the Studio editing state. One instance owns the MuJoCo sim, the three.js viewer,
 * the face display and the frame loop. SimController (the contract) wraps it.
 *
 * Playback runs on its own clock (`t`, scaled by speed) while physics always steps in
 * real time, so speed changes the motion, not the physics, and seek is exact.
 *
 * Joint ids in the public API are the robot's own (`RobotSpec.jointKeys`, e.g.
 * `shoulder_pitch`); the engine's internal channels stay LeLamp-named.
 */

import { BEHAVIORS, HOME } from '@/lib/sim/behaviors';
import { engineJoint } from '@/lib/sim/clip-map';
import { JOINT_NAMES, type JointName, type Motion, type PartialPose, type Pose } from '@/lib/sim/motion';
import { PURE_DESK_ROBOT, retargetMotion, type CameraView, type FaceManifest, type RobotSpec } from '@/lib/sim/robots';
import { motionPlayable, type Playable } from '@/lib/sim/sequence';
import { FaceCanvas, type FaceParams } from './face-canvas';
import { createLamp, type LampSim, type LoadProgress } from './lamp';
import { LimitMonitor, type JointLimits, type LimitEvent } from './limits';
import { LampViewer, type JointScreenPoint, type ViewerOptions } from './viewer3d';

/** Ease from the current pose into a behaviour's first keyframe (seconds). */
export const LEAD_IN = 0.8;
/** Frame-step cap so a backgrounded tab never stalls the loop. */
const MAX_STEPS = 250;
const TICK_INTERVAL = 1 / 30;

export interface JointState {
  id: string;
  /** Last commanded value before clamping, degrees */
  command: number;
  /** Measured joint angle, degrees */
  actual: number;
  min: number;
  max: number;
}

export type FaceSource =
  | { kind: 'canvas'; params?: Partial<FaceParams> }
  /** Per-behaviour mp4 from faces.json (or a fixed url) */
  | { kind: 'video'; url?: string }
  | { kind: 'off' };

export type RuntimeEvent =
  | { type: 'progress'; progress: LoadProgress }
  | { type: 'ready' }
  | { type: 'error'; message: string }
  | { type: 'playing'; name: string }
  | { type: 'ended'; name: string }
  | { type: 'step'; name: string; index: number }
  | { type: 'tick'; t: number; duration: number }
  | ({ type: 'limitExceeded' } & LimitEvent);

/** What the runtime plays. `build(start)` makes the playable from the current pose. */
export interface PlaybackSource {
  name: string;
  build(start: Pose): Playable;
  /** Behaviour whose mp4 face to show while this plays (video face mode) */
  faceBehavior?: (step: number) => string | null;
}

interface Active {
  source: PlaybackSource;
  playable: Playable;
  t: number;
  step: number;
}

export interface SimRuntimeOptions {
  robot?: RobotSpec;
  viewer?: ViewerOptions;
  /** Loop `idle` whenever nothing else plays (default true). */
  idle?: boolean;
  /** Pause at the first limit overshoot (default true, PRD rule 8). */
  stopOnLimit?: boolean;
}

export class SimRuntime {
  readonly robot: RobotSpec;
  readonly ready: Promise<void>;
  private lamp: LampSim | null = null;
  private viewer: LampViewer | null = null;
  private readonly face: FaceCanvas;
  private faceSource: FaceSource = { kind: 'canvas' };
  private faces: FaceManifest | null = null;
  private limits: LimitMonitor | null = null;
  private pendingLimits: JointLimits | null = null;
  private active: Active | null = null;
  private last: PlaybackSource | null = null;
  private command: Pose = { ...HOME };
  private idle: boolean;
  /** Idle setting to restore after stop() → next play */
  private idleDefault: boolean;
  private idleMotion = 'idle';
  private loop = false;
  private speed = 1;
  private paused = false;
  /** Pose was set kinematically (seek while paused) — physics must re-sync on resume. */
  private kinematic = false;
  stopOnLimit: boolean;
  /** Applied to the idle motion (signature playback params). */
  idleTransform: ((motion: Motion) => Motion) | null = null;
  private raf = 0;
  private lastFrame = 0;
  private tickClock = 0;
  private disposed = false;
  private readonly listeners = new Set<(e: RuntimeEvent) => void>();

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: SimRuntimeOptions = {},
  ) {
    this.robot = options.robot ?? PURE_DESK_ROBOT;
    this.idle = options.idle ?? true;
    this.idleDefault = this.idle;
    this.stopOnLimit = options.stopOnLimit ?? true;
    this.face = new FaceCanvas();
    this.ready = this.load();
  }

  // ---------------------------------------------------------------- lifecycle

  private async load(): Promise<void> {
    try {
      const lamp = await createLamp(this.robot, (progress) => this.emit({ type: 'progress', progress }));
      if (this.disposed) return;
      this.lamp = lamp;
      this.limits = new LimitMonitor(this.robot, lamp.limits);
      if (this.pendingLimits) this.limits.setLimits(this.pendingLimits);
      this.viewer = new LampViewer(this.canvas, lamp, this.options.viewer);
      const box = this.canvas.getBoundingClientRect();
      this.resize(box.width, box.height);
      await this.loadFaces();
      if (this.disposed) return;
      if (this.idle && !this.active) this.startIdle();
      this.applyFace();
      this.lastFrame = performance.now();
      this.raf = requestAnimationFrame(this.frame);
      this.emit({ type: 'ready' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emit({ type: 'error', message });
      throw error;
    }
  }

  private async loadFaces(): Promise<void> {
    const url = this.robot.facesManifest;
    if (!url) return;
    try {
      const res = await fetch(url);
      if (res.ok) this.faces = (await res.json()) as FaceManifest;
    } catch {
      // No manifest → the video face simply stays off.
    }
  }

  get isReady(): boolean {
    return this.lamp !== null;
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.viewer?.dispose();
    this.viewer = null;
    this.listeners.clear();
  }

  on(handler: (e: RuntimeEvent) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  private emit(e: RuntimeEvent): void {
    for (const h of this.listeners) h(e);
  }

  // ---------------------------------------------------------------- playback

  /** Start a source from t = 0, from the current commanded pose. */
  play(source: PlaybackSource, opts: { autoplay?: boolean } = {}): void {
    this.end();
    if (source.name !== 'home') this.idle = this.idleDefault;
    this.last = source;
    this.active = { source, playable: source.build(this.startPose()), t: 0, step: 0 };
    this.limits?.reset();
    this.setPaused(opts.autoplay === false);
    this.emit({ type: 'playing', name: source.name });
    this.emit({ type: 'step', name: source.name, index: 0 });
    this.applyFace();
    if (opts.autoplay === false) this.seek(0);
  }

  /** Rebuild the active playable (params changed) keeping its progress ratio. */
  rebuild(source: PlaybackSource): void {
    const a = this.active;
    if (!a || a.source.name !== source.name) return;
    const ratio = Number.isFinite(a.playable.duration) && a.playable.duration > 0 ? a.t / a.playable.duration : null;
    const playable = source.build(this.startPose());
    this.active = {
      source,
      playable,
      t: ratio === null || !Number.isFinite(playable.duration) ? a.t : ratio * playable.duration,
      step: a.step,
    };
    if (this.last?.name === source.name) this.last = source;
  }

  /** Resume; if nothing is active, replay the last source from the start. */
  resume(): void {
    if (!this.active && this.last) {
      this.play(this.last);
      return;
    }
    this.setPaused(false);
  }

  setPaused(paused: boolean): void {
    if (!paused && this.kinematic) {
      this.lamp?.freezeIntoPhysics();
      this.kinematic = false;
    }
    this.paused = paused;
    this.lastFrame = performance.now();
  }

  get isPaused(): boolean {
    return this.paused;
  }

  /** Jump to t. While paused the pose is set kinematically, so the frame is exact. */
  seek(t: number): void {
    const a = this.active;
    const lamp = this.lamp;
    if (!a || !lamp) return;
    const d = a.playable.duration;
    a.t = Math.max(0, Number.isFinite(d) ? Math.min(t, d) : t);
    const pose = a.playable.target(a.t);
    this.trackStep(a);
    if (this.paused) {
      this.checkLimits(pose, a.t);
      for (const j of JOINT_NAMES) this.command[j] = pose[j];
      lamp.poseKinematic(pose);
      this.kinematic = true;
    }
    this.emitTick();
  }

  /** Stop and return to HOME, then hold still (idle stays off until the next play). */
  stop(): void {
    this.idle = false;
    const home = BEHAVIORS.find((b) => b.name === 'home');
    if (!home) return;
    this.play({
      name: 'home',
      build: (start) => motionPlayable(retargetMotion(this.robot, home), start, 0),
      faceBehavior: () => 'home',
    });
  }

  /** Command a pose directly (engine channels) — dev tools and limit tests. */
  commandPose(pose: PartialPose, name = 'manual'): void {
    if (!this.lamp) return;
    this.end();
    this.limits?.reset();
    this.setPaused(false);
    this.emit({ type: 'playing', name });
    this.apply(pose, 0);
  }

  setIdle(on: boolean, behavior?: string): void {
    this.idle = on;
    this.idleDefault = on;
    if (behavior) this.idleMotion = behavior;
    const idling = this.active?.source.name.startsWith('idle:') ?? false;
    if (on && (!this.active || idling)) this.startIdle();
    // Idle off holds the current pose (structure screen).
    if (!on && idling) this.active = null;
  }

  setLoop(on: boolean): void {
    this.loop = on;
  }

  setSpeed(speed: number): void {
    this.speed = Math.min(Math.max(speed, 0.1), 4);
  }

  getTime(): { t: number; duration: number } {
    return { t: this.active?.t ?? 0, duration: this.active?.playable.duration ?? 0 };
  }

  get activeName(): string | null {
    return this.active?.source.name ?? null;
  }

  private startIdle(): void {
    const motion = BEHAVIORS.find((b) => b.name === this.idleMotion) ?? BEHAVIORS.find((b) => b.name === 'idle');
    if (!motion || !this.lamp) return;
    const source = this.idleSource(motion);
    this.active = { source, playable: source.build(this.startPose()), t: 0, step: 0 };
    this.setPaused(false);
    this.applyFace();
  }

  private idleSource(motion: Motion): PlaybackSource {
    return {
      name: `idle:${motion.name}`,
      build: (start) => {
        const retargeted = retargetMotion(this.robot, motion);
        return motionPlayable(this.idleTransform ? this.idleTransform(retargeted) : retargeted, start, LEAD_IN);
      },
      faceBehavior: () => motion.name,
    };
  }

  /** Re-apply idleTransform to a running idle (params changed). */
  refreshIdle(): void {
    const a = this.active;
    if (!a || !a.source.name.startsWith('idle:')) return;
    const motion = BEHAVIORS.find((b) => `idle:${b.name}` === a.source.name);
    if (motion) this.rebuild(this.idleSource(motion));
  }

  private end(): void {
    const current = this.active;
    this.active = null;
    if (current && !current.source.name.startsWith('idle:')) this.emit({ type: 'ended', name: current.source.name });
  }

  private finish(): void {
    this.end();
    if (this.idle) this.startIdle();
    else this.applyFace();
  }

  private checkLimits(pose: PartialPose, t: number): boolean {
    let hit = false;
    for (const e of this.limits?.check(pose, t) ?? []) {
      hit = true;
      this.emit({ type: 'limitExceeded', ...e });
    }
    return hit;
  }

  private apply(pose: PartialPose, t: number): void {
    const lamp = this.lamp;
    if (!lamp) return;
    const hit = this.checkLimits(pose, t);
    for (const [k, v] of Object.entries(pose)) if (v !== undefined) this.command[k as JointName] = v;
    lamp.setPose(pose);
    const a = this.active;
    if (hit && this.stopOnLimit && a && !this.exempt(a.source.name)) this.setPaused(true);
  }

  /** HOME return and idle never pause on a limit — they must always reach rest. */
  private exempt(name: string): boolean {
    return name === 'home' || name.startsWith('idle:');
  }

  /**
   * Where a new playback starts: the last command, clamped into the structure range.
   * (The robot is already clamped there; starting outside would trip the limit at t = 0.)
   */
  private startPose(): Pose {
    return this.limits ? this.limits.clamp(this.command) : { ...this.command };
  }

  private trackStep(a: Active): void {
    const step = a.playable.stepAt(a.t);
    if (step === a.step) return;
    a.step = step;
    this.emit({ type: 'step', name: a.source.name, index: step });
    this.applyFace();
  }

  private emitTick(): void {
    const { t, duration } = this.getTime();
    this.emit({ type: 'tick', t, duration });
  }

  private readonly frame = (now: number): void => {
    this.raf = requestAnimationFrame(this.frame);
    const lamp = this.lamp;
    if (!lamp) return;
    const wall = Math.min((now - this.lastFrame) / 1000, 0.1);
    this.lastFrame = now;

    if (!this.paused) {
      const a = this.active;
      if (a) {
        a.t += wall * this.speed;
        const d = a.playable.duration;
        if (a.t >= d) {
          if (this.loop && !a.source.name.startsWith('idle:')) {
            // Rebuild from the current pose so the wrap eases instead of jumping.
            a.playable = a.source.build(this.startPose());
            a.t = 0;
            this.limits?.reset();
          } else {
            this.apply(a.playable.target(d), d);
            this.finish();
          }
        }
        if (this.active === a) {
          this.trackStep(a);
          this.apply(a.playable.target(a.t), a.t);
        }
      }
      const steps = Math.min(Math.round(wall / lamp.dt), MAX_STEPS);
      if (steps > 0) lamp.step(steps);

      this.tickClock += wall;
      if (this.tickClock >= TICK_INTERVAL) {
        this.tickClock = 0;
        this.emitTick();
      }
    }

    const viewer = this.viewer;
    if (viewer) {
      if (this.faceSource.kind === 'canvas') this.face.draw(now / 1000);
      viewer.sync();
      viewer.render();
    }
  };

  // ---------------------------------------------------------------- limits & state

  /** Inject structure limits (robot joint ids). Narrower than the rig = earlier events. */
  setLimits(limits: JointLimits): void {
    this.pendingLimits = limits;
    this.limits?.setLimits(limits);
  }

  getJointState(): JointState[] {
    const lamp = this.lamp;
    if (!lamp || !this.limits) return [];
    const actual = lamp.pose;
    const limits = this.limits.getLimits();
    return JOINT_NAMES.map((joint) => {
      const id = this.robot.jointKeys[joint];
      return { id, command: this.command[joint], actual: actual[joint], min: limits[id][0], max: limits[id][1] };
    });
  }

  // ---------------------------------------------------------------- face

  setFace(source: FaceSource): void {
    if (source.kind === 'canvas' && source.params) this.face.setParams(source.params);
    this.faceSource = source;
    this.applyFace();
  }

  private applyFace(): void {
    const viewer = this.viewer;
    if (!viewer) return;
    const src = this.faceSource;
    if (src.kind === 'off') viewer.setFace(null);
    else if (src.kind === 'canvas') viewer.setFaceCanvas(this.face.canvas);
    else {
      const a = this.active;
      const behavior = a?.source.faceBehavior?.(a.step) ?? null;
      viewer.setFace(src.url ?? this.videoFor(behavior));
    }
  }

  private videoFor(behavior: string | null): string | null {
    const base = this.robot.facesManifest;
    if (!this.faces || !base) return null;
    const file = (behavior && this.faces.behaviors?.[behavior]) || this.faces.default;
    return file ? new URL(file, new URL(base, location.href)).href : null;
  }

  // ---------------------------------------------------------------- view

  resize(width: number, height: number): void {
    // A zero-size setSize corrupts the drawing buffer.
    if (width <= 0 || height <= 0) return;
    this.viewer?.resize(width, height);
  }

  setView(view: Partial<CameraView>): void {
    this.viewer?.setView({ ...this.robot.heroView, ...view });
  }

  enableOrbit(on: boolean, opts?: { pan?: boolean; zoom?: boolean }): void {
    this.viewer?.enableOrbit(on, opts);
  }

  highlightJoint(id: string | null): void {
    this.viewer?.highlightJoint(id ? engineJoint(this.robot, id) : null);
  }

  projectJoints(): (Omit<JointScreenPoint, 'joint'> & { id: string })[] {
    return (this.viewer?.projectJoints() ?? []).map(({ joint, ...p }) => ({ id: this.robot.jointKeys[joint], ...p }));
  }

  capture(): string | null {
    return this.viewer?.capture() ?? null;
  }
}
