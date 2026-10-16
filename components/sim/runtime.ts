/**
 * Simulator runtime — the playback half of _ref's LeLampProvider, without React or
 * the Studio editing state. One instance owns the MuJoCo sim, the three.js viewer,
 * the face display and the frame loop. STEP 3's SimController wraps this class.
 *
 * Joint ids in the public API are the robot's own (`RobotSpec.jointKeys`, e.g.
 * `shoulder_pitch`); the engine's internal channels stay LeLamp-named.
 */

import { BEHAVIORS, HOME } from '@/lib/sim/behaviors';
import { sampleClip, type Clip } from '@/lib/sim/clip';
import { JOINT_NAMES, MotionPlayer, type JointName, type PartialPose, type Pose } from '@/lib/sim/motion';
import { PURE_DESK_ROBOT, retargetMotion, type CameraView, type FaceManifest, type RobotSpec } from '@/lib/sim/robots';
import { FaceCanvas, type FaceParams } from './face-canvas';
import { createLamp, type LampSim, type LoadProgress } from './lamp';
import { LimitMonitor, type JointLimits, type LimitEvent } from './limits';
import { LampViewer, type ViewerOptions } from './viewer3d';

/** Ease from the current pose into a behaviour's first keyframe (seconds). */
const LEAD_IN = 0.8;
/** Frame-step cap so a backgrounded tab never stalls the loop. */
const MAX_STEPS = 250;

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

export type SimEvent =
  | { type: 'progress'; progress: LoadProgress }
  | { type: 'ready' }
  | { type: 'error'; message: string }
  | { type: 'playing'; name: string }
  | { type: 'ended'; name: string }
  | ({ type: 'limitExceeded' } & LimitEvent);

type Playback =
  | { kind: 'motion'; name: string; player: MotionPlayer; t0: number }
  | { kind: 'clip'; name: string; clip: Clip; t0: number };

export interface SimRuntimeOptions {
  robot?: RobotSpec;
  viewer?: ViewerOptions;
  /** Loop `idle` whenever nothing else plays (default true). */
  idle?: boolean;
}

export class SimRuntime {
  readonly robot: RobotSpec;
  private lamp: LampSim | null = null;
  private viewer: LampViewer | null = null;
  private readonly face: FaceCanvas;
  private faceSource: FaceSource = { kind: 'canvas' };
  private faces: FaceManifest | null = null;
  private limits: LimitMonitor | null = null;
  private pendingLimits: JointLimits | null = null;
  private playback: Playback | null = null;
  private command: Pose = { ...HOME };
  private idle: boolean;
  private speed = 1;
  private paused = false;
  private raf = 0;
  private last = 0;
  private disposed = false;
  private readonly listeners = new Set<(e: SimEvent) => void>();
  readonly ready: Promise<void>;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: SimRuntimeOptions = {},
  ) {
    this.robot = options.robot ?? PURE_DESK_ROBOT;
    this.idle = options.idle ?? true;
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
      this.applyFace();
      if (this.idle) this.startIdle();
      this.last = performance.now();
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

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.viewer?.dispose();
    this.viewer = null;
    this.listeners.clear();
  }

  on(handler: (e: SimEvent) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  private emit(e: SimEvent): void {
    for (const h of this.listeners) h(e);
  }

  // ---------------------------------------------------------------- playback

  playBehavior(name: string): void {
    const lamp = this.lamp;
    const motion = BEHAVIORS.find((b) => b.name === name);
    if (!lamp || !motion) return;
    this.begin({
      kind: 'motion',
      name,
      player: new MotionPlayer(retargetMotion(this.robot, motion), { ...this.command }, LEAD_IN),
      t0: lamp.time,
    });
  }

  /** Clip keys are in the engine's channel space (same as _ref's timeline). */
  playClip(clip: Clip): void {
    if (!this.lamp) return;
    this.begin({ kind: 'clip', name: clip.name, clip, t0: this.lamp.time });
  }

  /** Command a pose directly (engine channels) — dev tools and the limit test. */
  commandPose(pose: PartialPose, name = 'manual'): void {
    if (!this.lamp) return;
    this.end();
    this.limits?.reset();
    this.emit({ type: 'playing', name });
    this.apply(pose, 0);
  }

  /** Stop and return to HOME, then hold still (idle stays off until the next play). */
  stop(): void {
    this.idle = false;
    this.playBehavior('home');
  }

  setIdle(on: boolean): void {
    this.idle = on;
    if (on && !this.playback) this.startIdle();
  }

  setSpeed(speed: number): void {
    this.speed = Math.min(Math.max(speed, 0.1), 4);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.last = performance.now();
  }

  private startIdle(): void {
    const lamp = this.lamp;
    const motion = BEHAVIORS.find((b) => b.name === 'idle');
    if (!lamp || !motion) return;
    this.playback = {
      kind: 'motion',
      name: 'idle',
      player: new MotionPlayer(retargetMotion(this.robot, motion), { ...this.command }, LEAD_IN),
      t0: lamp.time,
    };
    this.applyFace();
  }

  private begin(playback: Playback): void {
    this.end();
    if (playback.name !== 'home') this.idle = this.options.idle ?? true;
    this.playback = playback;
    this.limits?.reset();
    this.emit({ type: 'playing', name: playback.name });
    this.applyFace();
  }

  private end(): void {
    const current = this.playback;
    this.playback = null;
    if (current && current.name !== 'idle') this.emit({ type: 'ended', name: current.name });
  }

  private apply(pose: PartialPose, t: number): void {
    const lamp = this.lamp;
    if (!lamp) return;
    for (const e of this.limits?.check(pose, t) ?? []) this.emit({ type: 'limitExceeded', ...e });
    for (const [k, v] of Object.entries(pose)) if (v !== undefined) this.command[k as JointName] = v;
    lamp.setPose(pose);
  }

  private readonly frame = (now: number): void => {
    this.raf = requestAnimationFrame(this.frame);
    const lamp = this.lamp;
    if (!lamp) return;
    const wall = Math.min((now - this.last) / 1000, 0.1);
    this.last = now;

    if (!this.paused) {
      const p = this.playback;
      if (p) {
        const t = lamp.time - p.t0;
        if (p.kind === 'motion') {
          this.apply(p.player.target(t), t);
          if (p.player.finished(t)) this.finish();
        } else {
          const clipT = p.clip.loop ? t % p.clip.duration : Math.min(t, p.clip.duration);
          this.apply(sampleClip(p.clip, clipT), clipT);
          if (!p.clip.loop && t >= p.clip.duration) this.finish();
        }
      }
      const steps = Math.min(Math.round((wall * this.speed) / lamp.dt), MAX_STEPS);
      if (steps > 0) lamp.step(steps);
    }

    const viewer = this.viewer;
    if (viewer) {
      if (this.faceSource.kind === 'canvas') this.face.draw(now / 1000);
      viewer.sync();
      viewer.render();
    }
  };

  private finish(): void {
    this.end();
    if (this.idle) this.startIdle();
    else this.applyFace();
  }

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
    else viewer.setFace(src.url ?? this.videoFor(this.playback?.name ?? null));
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

  capture(): string | null {
    return this.viewer?.capture() ?? null;
  }
}
