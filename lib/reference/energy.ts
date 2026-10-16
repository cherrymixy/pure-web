import type { EnergySample } from "../expression/timing";
import { frameTimes } from "./frames";

/** Mean absolute luma difference between consecutive RGBA frames (same size). */
export function diffEnergy(frames: Uint8ClampedArray[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1];
    const b = frames[i];
    const n = Math.min(a.length, b.length);
    let sum = 0;
    for (let p = 0; p < n; p += 4) {
      const la = 0.299 * a[p] + 0.587 * a[p + 1] + 0.114 * a[p + 2];
      const lb = 0.299 * b[p] + 0.587 * b[p + 1] + 0.114 * b[p + 2];
      sum += Math.abs(la - lb);
    }
    out.push(n ? sum / (n / 4) : 0);
  }
  return out;
}

/** Each difference sits halfway between the two frame times it compares. */
export function energySamples(diffs: number[], duration: number): EnergySample[] {
  const times = frameTimes(duration, diffs.length + 1);
  return diffs.map((value, i) => ({ t: (times[i] + times[i + 1]) / 2, value }));
}
