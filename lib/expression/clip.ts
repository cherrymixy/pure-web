import type { Clip, JointId, Key, Recipe, Structure } from "../models";
import type { PlaybackParams } from "../sim/params";
import { jointIds, rangeOf, sampleModelClip, sampleRecipe, type JointPose } from "./sample";

export const CLIP_FPS = 30;
export const MAX_KEYS = 24;

const round3 = (v: number) => Math.round(v * 1000) / 1000;

/** Ramer–Douglas–Peucker on (t, value) points; keeps the ends. */
export function simplify(points: { t: number; v: number }[], tolerance: number): { t: number; v: number }[] {
  if (points.length <= 2) return points;
  const a = points[0];
  const b = points[points.length - 1];
  let worst = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const u = (p.t - a.t) / (b.t - a.t || 1);
    const d = Math.abs(p.v - (a.v + (b.v - a.v) * u));
    if (d > worst) {
      worst = d;
      index = i;
    }
  }
  if (worst <= tolerance) return [a, b];
  return [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)];
}

/** Simplify to ≤ maxKeys, raising the tolerance as needed. */
export function reduceTrack(points: { t: number; v: number }[], maxKeys = MAX_KEYS, tolerance = 0.5): Key[] {
  let tol = tolerance;
  let kept = simplify(points, tol);
  while (kept.length > maxKeys) {
    tol *= 1.5;
    kept = simplify(points, tol);
  }
  return kept.map((p) => ({ t: round3(p.t), value: round3(p.v), easing: "linear" as const }));
}

/** Recipe → editable model clip (timeline). Keys are linear segments within 0.5° of the playback. */
export function recipeToClip(recipe: Recipe, params: PlaybackParams, structure: Structure): Clip {
  const { frames, duration } = sampleRecipe(recipe, params, CLIP_FPS);
  const tracks: Clip["tracks"] = {};
  for (const id of jointIds(structure)) {
    tracks[id] = reduceTrack(frames.map((f) => ({ t: f.t, v: f.pose[id] ?? 0 })));
  }
  return { format: "lelamp.clip/1", duration: round3(Math.max(duration, 0.1)), tracks, loop: !!recipe.loop };
}

export function clipToJointCommands(clip: Clip, t: number, structure: Structure): JointPose {
  return sampleModelClip(clip, t, jointIds(structure));
}

export interface LimitViolation {
  joint: JointId;
  /** Most extreme commanded value */
  value: number;
  limit: number;
  /** First time over the limit */
  t: number;
}

/** Joints whose commanded value leaves the structure range (sampled at 60 fps). */
export function limitCheck(clip: Clip, structure: Structure, fps = 60): LimitViolation[] {
  const out = new Map<JointId, LimitViolation>();
  const ids = jointIds(structure);
  const n = Math.ceil(clip.duration * fps);
  for (let i = 0; i <= n; i++) {
    const t = Math.min(i / fps, clip.duration);
    const pose = sampleModelClip(clip, t, ids);
    for (const id of ids) {
      const [lo, hi] = rangeOf(structure, id);
      const v = pose[id];
      if (v <= hi + 1e-6 && v >= lo - 1e-6) continue;
      const limit = v > hi ? hi : lo;
      const prev = out.get(id);
      if (!prev) out.set(id, { joint: id, value: v, limit, t });
      else if (Math.abs(v - limit) > Math.abs(prev.value - prev.limit)) out.set(id, { ...prev, value: v, limit });
    }
  }
  return [...out.values()];
}

/**
 * Auto-adjust (PRD rule 8): clamp keys into range, swap overshooting easings for
 * ease_in_out, no regeneration. Returns the clip and what changed.
 */
export function autoAdjust(clip: Clip, structure: Structure): { clip: Clip; changes: string[] } {
  const changes: string[] = [];
  const tracks: Clip["tracks"] = {};
  for (const [id, keys] of Object.entries(clip.tracks)) {
    const [lo, hi] = rangeOf(structure, id);
    tracks[id] = keys.map((k) => {
      const value = Math.min(Math.max(k.value, lo), hi);
      if (value !== k.value) changes.push(`${id} ${k.value.toFixed(1)}° → ${value.toFixed(1)}° at ${k.t.toFixed(2)}s`);
      return { ...k, value };
    });
  }
  let adjusted: Clip = { ...clip, tracks };
  // Clamped keys can still overshoot between them with back/elastic/bounce easing.
  for (const v of limitCheck(adjusted, structure)) {
    adjusted = {
      ...adjusted,
      tracks: {
        ...adjusted.tracks,
        [v.joint]: adjusted.tracks[v.joint].map((k) =>
          /back|elastic|bounce/.test(k.easing) ? { ...k, easing: "ease_in_out" as const } : k,
        ),
      },
    };
    changes.push(`${v.joint} easing softened to stay in range`);
  }
  return { clip: adjusted, changes };
}
