import { describe, expect, it } from "vitest";
import { BEHAVIORS, HOME } from "./behaviors";
import { ANTIC_RATIO, applyParams, resolveParams, scaleTime, settleEasing } from "./params";
import { PURE_DESK_ROBOT, retargetMotion } from "./robots";

const greet = retargetMotion(PURE_DESK_ROBOT, BEHAVIORS.find((b) => b.name === "greet")!);

describe("playback params", () => {
  it("fills defaults and clamps", () => {
    expect(resolveParams({})).toEqual({ speed: 1, amplitude: 1, settle: 0.5, antic: 0, rhythm: 1 });
    expect(resolveParams({ speed: 99, amplitude: -1, settle: NaN })).toMatchObject({ speed: 4, amplitude: 0, settle: 0.5 });
  });

  it("defaults leave the motion unchanged", () => {
    expect(applyParams(greet, {}, HOME)).toEqual(greet);
  });

  it("amplitude scales each joint's offset from HOME", () => {
    const out = applyParams(greet, { amplitude: 1.5 }, HOME);
    out.keyframes.forEach((kf, i) => {
      for (const [j, v] of Object.entries(kf.pose)) {
        expect(v).toBeCloseTo((greet.keyframes[i].pose as Record<string, number>)[j] * 1.5);
      }
    });
  });

  it("settle picks overshoot / authored / soft easing", () => {
    expect(settleEasing(0.1)).toBe("ease_out_back");
    expect(settleEasing(0.5)).toBeNull();
    expect(settleEasing(0.9)).toBe("ease_out");
    expect(applyParams(greet, { settle: 0.1 }, HOME).keyframes.every((k) => k.easing === "ease_out_back")).toBe(true);
  });

  it("antic prepends a pre-move opposite to the first target", () => {
    const out = applyParams(greet, { antic: 1 }, HOME);
    expect(out.keyframes).toHaveLength(greet.keyframes.length + 1);
    const first = greet.keyframes[0].pose as Record<string, number>;
    for (const [j, v] of Object.entries(out.keyframes[0].pose)) expect(v).toBeCloseTo(-first[j] * ANTIC_RATIO);
  });

  it("rhythm shortens oscillation periods; scaleTime shortens durations", () => {
    const idle = retargetMotion(PURE_DESK_ROBOT, BEHAVIORS.find((b) => b.name === "idle")!);
    const fast = applyParams(idle, { rhythm: 2 }, HOME);
    expect(fast.overlays![0].period).toBeCloseTo(idle.overlays![0].period / 2);
    expect(scaleTime(greet, 2).keyframes[0].duration).toBeCloseTo(greet.keyframes[0].duration / 2);
  });
});
