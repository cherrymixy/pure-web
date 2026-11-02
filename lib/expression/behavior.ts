import type { Clip, Expression, FaceSpec, MotionBehavior, SoundSpec, Structure } from "@/lib/models";
import type { PlaybackParams } from "../sim/params";
import { recipeToClip } from "./clip";
import { propsToParams } from "./props";

// Motion Behavior (editor right panel, Figma 452:2062): easing · direction · delay applied on top of the motion.
// Neutral (nothing changes): no easing, direction "left", delay 0 — and a missing `behavior` is the same.

export const NEUTRAL_BEHAVIOR: MotionBehavior = { direction: "left", delay: 0 };

export function isNeutralBehavior(b: MotionBehavior | undefined): boolean {
  return !b || (b.easing === undefined && b.direction === "left" && b.delay <= 0);
}

/**
 * Lateral joints flip sign when the direction is "right": yaw / pan / roll axes (ids or labels containing
 * "yaw", "pan" or "roll" — PURE Desk: base_yaw, head_pan). Pitch / tilt joints are symmetric left/right, so they stay.
 */
export function lateralJoints(structure: Structure): string[] {
  return structure.joints.filter((j) => /yaw|pan|roll/i.test(`${j.id} ${j.label}`)).map((j) => j.id);
}

const round3 = (v: number) => Math.round(v * 1000) / 1000;

/**
 * Clip with the behavior applied:
 * - delay: every track holds its first value for `delay` s, the keys after it shift by `delay`
 * - direction "right": lateral joint values negated, clamped into the joint's range
 * - easing: every key gets this easing
 */
export function applyBehavior(clip: Clip, behavior: MotionBehavior | undefined, structure: Structure): Clip {
  if (isNeutralBehavior(behavior)) return clip;
  const b = behavior!;
  const mirror = b.direction === "right" ? new Set(lateralJoints(structure)) : new Set<string>();
  const delay = Math.max(0, b.delay);
  const tracks: Clip["tracks"] = {};
  for (const [id, keys] of Object.entries(clip.tracks)) {
    const joint = structure.joints.find((j) => j.id === id);
    const value = (v: number) => {
      if (!mirror.has(id)) return v;
      const m = -v;
      return joint ? Math.min(Math.max(m, joint.min), joint.max) : m;
    };
    let next = keys.map((k) => ({ ...k, t: round3(k.t + delay), value: value(k.value), easing: b.easing ?? k.easing }));
    if (delay > 0 && next.length) next = [{ ...next[0], t: 0 }, ...next];
    tracks[id] = next;
  }
  return { ...clip, duration: round3(clip.duration + delay), tracks };
}

/** Face keys and sound cues wait for the delay too, so they stay on the motion. */
export function delayFace(face: FaceSpec, behavior: MotionBehavior | undefined): FaceSpec {
  const d = behavior?.delay ?? 0;
  if (d <= 0 || !face.keys?.length) return face;
  return { ...face, keys: face.keys.map((k) => ({ ...k, t: round3(k.t + d) })) };
}

export function delaySound(sound: SoundSpec, behavior: MotionBehavior | undefined): SoundSpec {
  const d = behavior?.delay ?? 0;
  if (d <= 0 || !sound.cues.length) return sound;
  return { ...sound, cues: sound.cues.map((c) => ({ ...c, t: round3(c.t + d) })) };
}

type Playable = Pick<Expression, "motion" | "face" | "sound">;

/**
 * What actually plays / exports for an expression. Neutral behavior → unchanged.
 * Otherwise the motion becomes a clip: the edited clip, or the recipe sampled with `params`.
 * Pass `params` with speed 1 when the player applies speed live (the editor's Viewport does).
 */
export function playableExpression<T extends Playable>(
  expr: T,
  structure: Structure,
  params?: PlaybackParams,
): T {
  const b = expr.motion.behavior;
  if (isNeutralBehavior(b)) return expr;
  const base =
    expr.motion.mode === "clip" && expr.motion.clip
      ? expr.motion.clip
      : recipeToClip(expr.motion.recipe, params ?? propsToParams(expr.motion.props).params, structure);
  return {
    ...expr,
    motion: { ...expr.motion, mode: "clip", clip: applyBehavior(base, b, structure) },
    face: delayFace(expr.face, b),
    sound: delaySound(expr.sound, b),
  };
}
