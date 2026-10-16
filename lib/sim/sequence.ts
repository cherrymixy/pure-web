/**
 * Playables: anything the runtime can sample at time t.
 *  - motionPlayable: one behaviour (looping behaviours run forever)
 *  - SequencePlayer: recipe steps chained end-to-start, each repeated
 *  - clipPlayable: an engine clip
 * All are deterministic in t, so seek is exact.
 *
 * Pure module.
 */

import { sampleClip, type Clip as EngineClip } from './clip';
import { MotionPlayer, type Motion, type Pose } from './motion';

export interface Playable {
  /** Seconds; Infinity for looping behaviours */
  readonly duration: number;
  target(t: number): Pose;
  /** Index of the recipe step active at t (0 for single motions) */
  stepAt(t: number): number;
}

export function motionPlayable(motion: Motion, start: Pose, leadIn: number): Playable {
  const player = new MotionPlayer(motion, start, leadIn);
  return {
    duration: motion.loop ? Infinity : player.duration,
    target: (t) => player.target(t),
    stepAt: () => 0,
  };
}

export function clipPlayable(clip: EngineClip): Playable {
  return {
    duration: clip.duration,
    target: (t) => sampleClip(clip, t),
    stepAt: () => 0,
  };
}

export interface SequenceStep {
  motion: Motion;
  repeat: number;
}

interface Segment {
  start: number;
  end: number;
  player: MotionPlayer;
}

export class SequencePlayer implements Playable {
  readonly duration: number;
  private readonly segments: Segment[];
  private readonly startPose: Pose;

  /**
   * @param leadIn  ease from `start` into the first step
   * @param joinIn  ease between steps
   */
  constructor(steps: SequenceStep[], start: Pose, leadIn: number, joinIn: number) {
    this.startPose = { ...start };
    this.segments = [];
    let cursor = 0;
    let pose = { ...start };
    steps.forEach((step, i) => {
      const repeat = Math.max(1, Math.round(step.repeat));
      // Repeating a one-shot motion = looping it for `repeat` cycles.
      const motion = repeat > 1 || step.motion.loop ? { ...step.motion, loop: true } : step.motion;
      const lead = i === 0 ? leadIn : joinIn;
      const player = new MotionPlayer(motion, pose, lead);
      const length = player.duration - lead; // one cycle
      const span = lead + length * repeat;
      this.segments.push({ start: cursor, end: cursor + span, player });
      pose = player.target(span);
      cursor += span;
    });
    this.duration = cursor;
  }

  stepAt(t: number): number {
    if (this.segments.length === 0) return 0;
    const i = this.segments.findIndex((s) => t < s.end);
    return i < 0 ? this.segments.length - 1 : i;
  }

  target(t: number): Pose {
    if (this.segments.length === 0) return { ...this.startPose };
    const seg = this.segments[this.stepAt(Math.min(Math.max(t, 0), this.duration))];
    return seg.player.target(Math.min(Math.max(t, 0), this.duration) - seg.start);
  }
}
