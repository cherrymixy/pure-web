import { REAL_ROBOT } from "@/data/real-robot";

/** Sim joint angles (degrees, by structure joint id) → real motor angles, clamped to each motor's safe range. */
export function motorAngles(joints: { id: string; actual: number }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of REAL_ROBOT.motors) {
    const j = joints.find((x) => x.id === m.joint);
    if (!j || !Number.isFinite(j.actual)) continue;
    const v = m.motor[0] + ((j.actual - m.sim[0]) * (m.motor[1] - m.motor[0])) / (m.sim[1] - m.sim[0]);
    out[m.key] = Math.round(Math.min(Math.max(v, m.safe[0]), m.safe[1]) * 10) / 10;
  }
  return out;
}

/** GET /pose?m1=..&m2=.. on the robot. */
export const poseUrl = (angles: Record<string, number>) =>
  `${REAL_ROBOT.address}/pose?${new URLSearchParams(Object.entries(angles).map(([k, v]) => [k, String(v)]))}`;

/** True when the robot's ESP32 answers /status within the timeout. */
export async function robotReachable(timeoutMs = 1500): Promise<boolean> {
  try {
    const res = await fetch(`${REAL_ROBOT.address}/status`, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
