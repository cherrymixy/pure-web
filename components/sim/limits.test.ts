import { describe, expect, it } from "vitest";
import { PURE_DESK_ROBOT } from "@/lib/sim/robots";
import { LimitMonitor } from "./limits";

const RIG = {
  base_yaw: [-150, 150],
  base_pitch: [-35, 55],
  elbow_pitch: [-120, 33],
  wrist_roll: [-160, 160],
  wrist_pitch: [-33, 42],
} as Record<"base_yaw" | "base_pitch" | "elbow_pitch" | "wrist_roll" | "wrist_pitch", [number, number]>;

describe("LimitMonitor", () => {
  it("reports an overshoot once per joint per playback, with the robot joint id", () => {
    const m = new LimitMonitor(PURE_DESK_ROBOT, RIG);
    expect(m.check({ base_pitch: 80 }, 0.5)).toEqual([{ joint: "shoulder_pitch", value: 80, limit: 55, t: 0.5 }]);
    expect(m.check({ base_pitch: 90 }, 0.6)).toEqual([]);
    m.reset();
    expect(m.check({ base_pitch: 90 }, 0)).toHaveLength(1);
  });

  it("ignores values inside the range and reports the lower bound", () => {
    const m = new LimitMonitor(PURE_DESK_ROBOT, RIG);
    expect(m.check({ base_pitch: 55, wrist_pitch: -33 }, 0)).toEqual([]);
    expect(m.check({ wrist_pitch: -40 }, 1)[0]).toMatchObject({ joint: "head_tilt", limit: -33 });
  });

  it("uses injected structure limits (narrowed in Edit limits)", () => {
    const m = new LimitMonitor(PURE_DESK_ROBOT, RIG);
    m.setLimits({ shoulder_pitch: [-20, 40] });
    expect(m.check({ base_pitch: 45 }, 0)).toEqual([{ joint: "shoulder_pitch", value: 45, limit: 40, t: 0 }]);
    expect(m.getLimits().elbow_pitch).toEqual([-120, 33]);
  });
});
