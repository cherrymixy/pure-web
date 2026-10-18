import { describe, expect, it } from "vitest";
import { BEHAVIORS, HOME } from "./behaviors";
import { PURE_DESK_ROBOT, retargetMotion } from "./robots";
import { CommandSmoother, SMOOTH_DEFAULTS } from "./smooth";

describe("command smoothing", () => {
  it("a sudden 40° jump never moves faster than maxVel and settles without overshoot", () => {
    const s = new CommandSmoother({ ...HOME });
    const target = { ...HOME, base_pitch: 40 };
    let prev = 0;
    let peak = 0;
    for (let i = 0; i < 120; i++) {
      const p = s.step(target, 1 / 60).base_pitch;
      expect(Math.abs(p - prev) * 60).toBeLessThanOrEqual(SMOOTH_DEFAULTS.maxVel + 1e-6);
      peak = Math.max(peak, p);
      prev = p;
    }
    expect(prev).toBeCloseTo(40, 1);
    expect(peak).toBeLessThan(40.5);
  });

  it("reset jumps straight to a pose at rest", () => {
    const s = new CommandSmoother({ ...HOME });
    s.reset({ elbow_pitch: -20 });
    expect(s.step({ ...HOME, elbow_pitch: -20 }, 0.1).elbow_pitch).toBeCloseTo(-20, 6);
  });

  it("PURE Desk halves the backward shoulder swing, keeps the forward one", () => {
    const wake = BEHAVIORS.find((b) => b.name === "wake")!;
    const raw = retargetMotion({ ...PURE_DESK_ROBOT, backGain: undefined }, wake);
    const soft = retargetMotion(PURE_DESK_ROBOT, wake);
    const shoulder = (m: typeof raw) => m.keyframes.map((k) => k.pose.base_pitch!);
    expect(Math.min(...shoulder(soft))).toBeCloseTo(Math.min(...shoulder(raw)) / 2, 6);
    expect(Math.max(...shoulder(soft))).toBeCloseTo(Math.max(...shoulder(raw)), 6);
  });
});
