import { REAL_ROBOT } from "@/data/real-robot";
import type { Clip, JointId } from "./models";
import { sampleModelClip } from "./expression/sample";
import { motorAngles } from "./robot-link";

/** Firmware key: {angle, ms since the previous key}. */
export type FirmwareKey = [number, number];

/** Keys per second baked into the firmware. */
export const FIRMWARE_HZ = 10;

/** The clip as one key path per motor (same mapping and clamps as the live link). speed = playback speed. */
export function firmwarePaths(clip: Clip, joints: JointId[], speed = 1): Record<string, FirmwareKey[]> {
  const step = 1 / FIRMWARE_HZ;
  const n = Math.max(1, Math.ceil(clip.duration / step));
  const poses = Array.from({ length: n + 1 }, (_, i) => {
    const t = Math.min(i * step, clip.duration);
    return { t, pose: sampleModelClip(clip, t, joints) };
  });
  return posePaths(poses, speed);
}

/** Exact poses (seconds, degrees by joint id) → one key path per motor. The firmware eases each segment with the same
 *  cosine as the sim's ease_in_out, so keyframed motions play on the robot exactly as in the 3D view. */
export function posePaths(poses: { t: number; pose: Record<string, number> }[], speed = 1): Record<string, FirmwareKey[]> {
  const out: Record<string, FirmwareKey[]> = Object.fromEntries(REAL_ROBOT.motors.map((m) => [m.key, []]));
  poses.forEach(({ t, pose }, i) => {
    const ms = i === 0 ? 0 : Math.round(((t - poses[i - 1].t) / (speed > 0 ? speed : 1)) * 1000);
    const angles = motorAngles(Object.entries(pose).map(([id, actual]) => ({ id, actual })));
    for (const key of Object.keys(out)) {
      if (angles[key] !== undefined) out[key].push([angles[key], ms]);
    }
  });
  return out;
}

/** Fill the firmware template (hardware/esp32_servo_wifi) with the paths; the robot plays them in a loop from boot. */
export function fillFirmware(template: string, paths: Record<string, FirmwareKey[]>, name: string): string {
  let text = template;
  for (const [key, keys] of Object.entries(paths)) {
    if (!keys.length) continue;
    const line = new RegExp(`^const Key PATH_${key.toUpperCase()}\\[\\] = .*$`, "m");
    if (!line.test(text)) throw new Error(`firmware template: PATH_${key.toUpperCase()} not found`);
    text = text.replace(line, `const Key PATH_${key.toUpperCase()}[] = { ${keys.map(([a, ms]) => `{${a}, ${ms}}`).join(", ")} };`);
  }
  const end = "  lastTick = millis();\n}";
  if (!text.includes(end)) throw new Error("firmware template: end of setup() not found");
  const autoplay = Object.keys(paths)
    .filter((k) => paths[k].length)
    .map((k) => `  startPath(${k}, PATH_${k.toUpperCase()}, LEN(PATH_${k.toUpperCase()}));`);
  // M2 only exists when USE_M2 is on.
  const lines = autoplay.map((l) => (l.includes("(m2,") ? `#if USE_M2\n${l}\n#endif` : l));
  text = text.replace(end, `${end.slice(0, -1)}  // PURE export: play "${name.replace(/[^\w .-]/g, "")}" in a loop from boot\n${lines.join("\n")}\n}`);
  return text;
}
