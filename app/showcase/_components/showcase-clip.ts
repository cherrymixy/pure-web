import { PURE_DESK_STRUCTURE } from "@/data/pure-desk";
import { REAL_ROBOT } from "@/data/real-robot";
import type { ShowcaseMotion } from "@/data/showcase";
import { robotOf, sampleRecipe } from "@/lib/expression/sample";
import type { Clip } from "@/lib/models";
import { firmwarePaths, type FirmwareKey } from "@/lib/robot-firmware";
import { motorAngles } from "@/lib/robot-link";

/** Keys per second kept in the showcase clip. recipeToClip caps tracks at 24 keys, which drops quick wiggles in long motions. */
const FPS = 20;

/** Each joint's points (seconds, degrees): per-joint tracks, shared keyframes, or the sampled recipe. */
function points(m: ShowcaseMotion): { duration: number; exact: boolean; at: (id: string) => [number, number][] } {
  if (m.tracks || m.keys) {
    const keys = m.keys ?? [];
    const duration = Math.max(keys.at(-1)?.t ?? 0, ...Object.values(m.tracks ?? {}).map((tr) => tr.at(-1)?.[0] ?? 0));
    return {
      duration,
      exact: true,
      // a joint without its own track follows the shared keyframes, or rests at 0 for the whole loop
      at: (id) => m.tracks?.[id] ?? (keys.length ? keys.map((k) => [k.t, k.pose[id] ?? 0]) : [[0, 0], [duration, 0]]),
    };
  }
  const { frames, duration } = sampleRecipe(m.recipe ?? { steps: [] }, { speed: 1 }, FPS, robotOf(PURE_DESK_STRUCTURE));
  return { duration, exact: false, at: (id) => frames.map((f) => [f.t, f.pose[id] ?? 0]) };
}

/** The motion as one clip (same for the 3D view and the robot code), with per-joint gain and range applied. A boosted joint stays
 *  inside its joint range and, when it drives a motor, inside the range that maps onto that motor (the view never outruns the robot). */
export function showcaseClip(m: ShowcaseMotion): Clip {
  const p = points(m);
  const tracks: Clip["tracks"] = {};
  for (const j of PURE_DESK_STRUCTURE.joints) {
    const g = m.gain?.[j.id] ?? 1;
    const motor = REAL_ROBOT.motors.find((x) => x.joint === j.id);
    const [rMin, rMax] = m.range?.[j.id] ?? [-Infinity, Infinity];
    const lo = Math.max(rMin, g === 1 ? -Infinity : Math.max(j.min, motor ? Math.min(...motor.sim) : -Infinity));
    const hi = Math.min(rMax, g === 1 ? Infinity : Math.min(j.max, motor ? Math.max(...motor.sim) : Infinity));
    tracks[j.id] = p.at(j.id).map(([t, v]) => ({
      t,
      value: Math.min(hi, Math.max(lo, v * g)),
      // exact keys ease in-out (= the firmware's cosine); sampled frames are already dense
      easing: p.exact ? ("ease_in_out" as const) : ("linear" as const),
    }));
  }
  return { format: "lelamp.clip/1", duration: p.duration, tracks };
}

/** Robot code paths: exact keys go straight to the firmware, one path per motor on that joint's own timing (every path ends at
 *  the loop length, so the motors stay in step); sampled motions go through the clip. */
export function showcasePaths(m: ShowcaseMotion): Record<string, FirmwareKey[]> {
  const clip = showcaseClip(m);
  if (!points(m).exact) return firmwarePaths(clip, PURE_DESK_STRUCTURE.joints.map((j) => j.id));
  return Object.fromEntries(
    REAL_ROBOT.motors.map((mo) => {
      const keys = clip.tracks[mo.joint] ?? [];
      return [mo.key, keys.map((k, i) => [motorAngles([{ id: mo.joint, actual: k.value }])[mo.key], i ? Math.round((k.t - keys[i - 1].t) * 1000) : 0] as FirmwareKey)];
    }),
  );
}
