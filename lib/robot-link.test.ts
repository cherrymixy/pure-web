import { describe, expect, it } from "vitest";
import { motorAngles, poseUrl } from "./robot-link";

const pose = (v: Record<string, number>) => Object.entries(v).map(([id, actual]) => ({ id, actual }));

describe("real robot link", () => {
  it("maps sim joints to motors and never leaves the confirmed ranges", () => {
    const a = motorAngles(pose({ base_yaw: 10, shoulder_pitch: -28, elbow_pitch: 10, head_pan: -20, head_tilt: 5 }));
    expect(a).toEqual({ m4: 10, m3: 5, m2: 40, m1: -20 });
    const far = motorAngles(pose({ base_yaw: 170, shoulder_pitch: 90, elbow_pitch: -135, head_pan: -90 }));
    expect(far).toEqual({ m4: 45, m3: -60, m2: 80, m1: -45 });
  });

  it("builds the pose request", () => {
    expect(poseUrl({ m1: 1.5, m4: -2 })).toBe("http://192.168.4.1/pose?m1=1.5&m4=-2");
  });
});
