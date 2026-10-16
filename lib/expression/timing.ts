import type { Clip } from "../models";

// Match timing (W02E): align keyframe times to motion peaks in the reference video.

export interface EnergySample {
  /** Seconds in the reference */
  t: number;
  /** Frame-difference energy (any unit) */
  value: number;
}

/** Local maxima above mean + 0.5·σ, as times normalized to 0…1. */
export function energyPeaks(energy: EnergySample[]): number[] {
  if (energy.length < 3) return [];
  const values = energy.map((e) => e.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
  const span = energy[energy.length - 1].t - energy[0].t || 1;
  const peaks: number[] = [];
  for (let i = 1; i < energy.length - 1; i++) {
    const v = energy[i].value;
    if (v > mean + 0.5 * sd && v >= energy[i - 1].value && v > energy[i + 1].value) peaks.push((energy[i].t - energy[0].t) / span);
  }
  return peaks;
}

/**
 * Move each interior key time (shared across tracks) to the nearest peak within a
 * window, keeping order. Returns the original too, so the editor can undo.
 */
export function matchTiming(clip: Clip, energy: EnergySample[], windowRatio = 0.25): { clip: Clip; original: Clip; moved: number } {
  const peaks = energyPeaks(energy).map((p) => p * clip.duration);
  const times = [...new Set(Object.values(clip.tracks).flatMap((ks) => ks.map((k) => k.t)))].sort((a, b) => a - b);
  const map = new Map<number, number>(times.map((t) => [t, t]));
  let moved = 0;
  for (let i = 1; i < times.length - 1; i++) {
    const prev = map.get(times[i - 1])!;
    const next = times[i + 1];
    const window = (next - prev) * windowRatio;
    const candidates = peaks.filter((p) => Math.abs(p - times[i]) <= window && p > prev + 0.05 && p < next - 0.05);
    if (candidates.length === 0) continue;
    const best = candidates.reduce((a, b) => (Math.abs(b - times[i]) < Math.abs(a - times[i]) ? b : a));
    map.set(times[i], Math.round(best * 1000) / 1000);
    moved++;
  }
  const tracks = Object.fromEntries(Object.entries(clip.tracks).map(([id, ks]) => [id, ks.map((k) => ({ ...k, t: map.get(k.t) ?? k.t }))]));
  return { clip: { ...clip, tracks }, original: clip, moved };
}
