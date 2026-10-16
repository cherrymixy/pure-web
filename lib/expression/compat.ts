import type { Channel, Expression, Structure } from "../models";
import { limitCheck, recipeToClip } from "./clip";
import { propsToParams } from "./props";
import { MAX_DEG_PER_S, jointIds, sampleModelClip } from "./sample";
import { velocityAllowance } from "./validate";

export interface CompatIssue {
  kind: "range" | "velocity" | "channel";
  joint?: string;
  channel?: Channel;
  message: string;
  /** What the export dialog offers */
  fix: "editor" | "fallback";
}

export interface CompatTarget {
  name: string;
  structure: Structure;
}

function peakVelocities(expr: Pick<Expression, "motion" | "signatureSnapshot">, structure: Structure) {
  const clip = expr.motion.mode === "clip" && expr.motion.clip ? expr.motion.clip : recipeToClip(expr.motion.recipe, propsToParams(expr.motion.props, expr.signatureSnapshot.axes).params, structure);
  const ids = jointIds(structure);
  const peaks: Record<string, number> = {};
  const dt = 1 / 60;
  let prev = sampleModelClip(clip, 0, ids);
  for (let t = dt; t <= clip.duration; t += dt) {
    const pose = sampleModelClip(clip, t, ids);
    for (const id of ids) peaks[id] = Math.max(peaks[id] ?? 0, Math.abs(pose[id] - prev[id]) / dt);
    prev = pose;
  }
  return { clip, peaks };
}

/** Real compatibility check (PRD rule 12): joint ranges, 120°/s, channels the target has. */
export function compatibility(expr: Pick<Expression, "motion" | "face" | "sound" | "signatureSnapshot">, target: CompatTarget): CompatIssue[] {
  const issues: CompatIssue[] = [];
  const { clip, peaks } = peakVelocities(expr, target.structure);
  for (const v of limitCheck(clip, target.structure)) {
    issues.push({ kind: "range", joint: v.joint, fix: "editor", message: `${v.joint} reaches ${v.value.toFixed(1)}° (limit ${v.limit}°) at ${v.t.toFixed(2)}s on ${target.name}` });
  }
  // Recipes may keep the library's authored snaps (same allowance as validateRecipe); edited clips get 120°/s.
  const allowed =
    expr.motion.mode === "recipe"
      ? Math.max(MAX_DEG_PER_S, ...expr.motion.recipe.steps.map((st) => velocityAllowance(st.behavior, target.structure)))
      : MAX_DEG_PER_S;
  for (const [joint, peak] of Object.entries(peaks)) {
    if (peak > allowed + 1) issues.push({ kind: "velocity", joint, fix: "editor", message: `${joint} moves at ${Math.round(peak)}°/s (max ${Math.round(allowed)}°/s)` });
  }
  const uses: Channel[] = ["motion", ...(expr.face.preset ? (["face"] as const) : []), ...(expr.sound.cues.length ? (["sound"] as const) : [])];
  for (const channel of uses) {
    if (!target.structure.channels.includes(channel)) {
      issues.push({ kind: "channel", channel, fix: "fallback", message: `${target.name} has no ${channel} channel` });
    }
  }
  return issues;
}

/** Fallback for robots without face/sound: motion only. */
export function fallback<T extends Pick<Expression, "face" | "sound">>(expr: T): T {
  return { ...expr, face: { ...expr.face, preset: "" }, sound: { cues: [] } };
}
