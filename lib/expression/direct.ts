import type { Clip, Structure } from "../models";
import type { DirectClipOutput } from "../llm/direct-clip";
import { validateClip, type Issue } from "./validate";

/** Minimum total joint travel for a direct clip to count as motion (degrees). */
export const MIN_TRAVEL = 3;

/**
 * Tier 2 keyframes → validated clip, or a reason to fall back to the recipe.
 * validateClip clamps/stretches; "failed" = nothing playable left (no track with 2+ keys, or no movement).
 */
export function clipFromDirect(raw: DirectClipOutput["clip"], structure: Structure): { clip: Clip | null; issues: Issue[]; reason?: string } {
  const tracks: Clip["tracks"] = {};
  for (const tr of raw.tracks) {
    const keys = tr.keys.filter((k) => Number.isFinite(k.t) && Number.isFinite(k.value) && k.t >= 0);
    tracks[tr.joint] = [...(tracks[tr.joint] ?? []), ...keys.map((k) => ({ t: k.t, value: k.value, easing: "ease_in_out" as const }))];
  }
  const lastKey = Math.max(0, ...Object.values(tracks).flatMap((ks) => ks.map((k) => k.t)));
  const duration = Number.isFinite(raw.duration) && raw.duration > 0 ? Math.max(raw.duration, lastKey) : lastKey;
  const { clip, issues } = validateClip({ format: "lelamp.clip/1", duration: duration || 1, tracks }, structure);
  const playable = Object.values(clip.tracks).filter((ks) => new Set(ks.map((k) => k.t)).size >= 2);
  if (playable.length === 0) return { clip: null, issues, reason: "No joint has two or more keyframes" };
  const travel = playable.reduce((sum, ks) => sum + ks.slice(1).reduce((s, k, i) => s + Math.abs(k.value - ks[i].value), 0), 0);
  if (travel < MIN_TRAVEL) return { clip: null, issues, reason: `Keyframes barely move (${travel.toFixed(1)}°)` };
  return { clip, issues };
}
