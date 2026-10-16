/**
 * Playback parameters (appendix B `PlaybackParams`) applied to a motion before it
 * reaches MotionPlayer. `speed` is not here — the runtime applies it to its playback
 * clock so physics keeps running in real time.
 *
 * Pure module.
 */

import { JOINT_NAMES, type EasingName, type Keyframe, type Motion, type Pose } from './motion';

export interface PlaybackParams {
  speed?: number;
  amplitude?: number;
  settle?: number;
  antic?: number;
  rhythm?: number;
}

export const DEFAULT_PARAMS: Required<PlaybackParams> = {
  speed: 1,
  amplitude: 1,
  settle: 0.5,
  antic: 0,
  rhythm: 1,
};

const RANGES: Record<keyof PlaybackParams, [number, number]> = {
  speed: [0.1, 4],
  amplitude: [0, 2],
  settle: [0, 1],
  antic: [0, 1],
  rhythm: [0.25, 4],
};

/** Fill defaults and clamp every field to its range. */
export function resolveParams(p: PlaybackParams = {}): Required<PlaybackParams> {
  const out = { ...DEFAULT_PARAMS };
  for (const key of Object.keys(RANGES) as (keyof PlaybackParams)[]) {
    const v = p[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    const [lo, hi] = RANGES[key];
    out[key] = Math.min(Math.max(v, lo), hi);
  }
  return out;
}

/**
 * Low settle overshoots, high settle lands softly. The middle band keeps the
 * behaviour's authored easings (each keyframe was tuned on its own).
 */
export function settleEasing(settle: number): EasingName | null {
  if (settle < 1 / 3) return 'ease_out_back';
  if (settle > 2 / 3) return 'ease_out';
  return null;
}

/** Fraction of the first move that the anticipation pre-move travels backwards, at antic = 1. */
export const ANTIC_RATIO = 0.15;

/** Scale time: durations and holds ÷ k, oscillation periods ÷ k. */
export function scaleTime(motion: Motion, k: number): Motion {
  if (k === 1 || k <= 0) return motion;
  return {
    ...motion,
    keyframes: motion.keyframes.map((kf) => ({
      ...kf,
      duration: kf.duration / k,
      hold: kf.hold === undefined ? undefined : kf.hold / k,
    })),
    overlays: motion.overlays?.map((o) => ({ ...o, period: o.period / k })),
  };
}

/**
 * Apply amplitude / settle / antic / rhythm.
 * `motion` must hold full poses per keyframe (as `retargetMotion` returns), so
 * amplitude can scale each joint's offset from `home`.
 */
export function applyParams(motion: Motion, params: PlaybackParams, home: Pose): Motion {
  const p = resolveParams(params);
  const easing = settleEasing(p.settle);

  let keyframes: Keyframe[] = motion.keyframes.map((kf) => {
    const pose: Partial<Pose> = {};
    for (const [joint, value] of Object.entries(kf.pose) as [keyof Pose, number][]) {
      pose[joint] = home[joint] + (value - home[joint]) * p.amplitude;
    }
    return { ...kf, pose, easing: easing ?? kf.easing };
  });

  // Anticipation: a short move away from the first target before going there.
  // Skipped for loops — it would repeat every cycle.
  if (p.antic > 0 && !motion.loop && keyframes.length > 0) {
    const first = keyframes[0];
    const pre: Partial<Pose> = {};
    for (const joint of JOINT_NAMES) {
      const target = first.pose[joint];
      if (target === undefined) continue;
      pre[joint] = home[joint] - (target - home[joint]) * ANTIC_RATIO * p.antic;
    }
    keyframes = [{ pose: pre, duration: Math.max(first.duration * 0.3, 0.12), easing: 'ease_in_out' }, ...keyframes];
  }

  const overlays = motion.overlays?.map((o) => ({
    ...o,
    amplitude: o.amplitude * p.amplitude,
    period: o.period / p.rhythm,
  }));

  return { ...motion, keyframes, overlays };
}
