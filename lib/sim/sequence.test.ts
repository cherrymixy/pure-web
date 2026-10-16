import { describe, expect, it } from "vitest";
import { BEHAVIORS, HOME } from "./behaviors";
import { cycleTime, JOINT_NAMES } from "./motion";
import { PURE_DESK_ROBOT, retargetMotion } from "./robots";
import { SequencePlayer, motionPlayable } from "./sequence";

const m = (name: string) => retargetMotion(PURE_DESK_ROBOT, BEHAVIORS.find((b) => b.name === name)!);

describe("SequencePlayer", () => {
  const steps = [
    { motion: m("greet"), repeat: 1 },
    { motion: m("nod"), repeat: 2 },
  ];
  const seq = new SequencePlayer(steps, HOME, 0.8, 0.35);

  it("duration = lead-ins + cycles × repeat", () => {
    expect(seq.duration).toBeCloseTo(0.8 + cycleTime(steps[0].motion) + 0.35 + 2 * cycleTime(steps[1].motion));
  });

  it("reports step boundaries", () => {
    const boundary = 0.8 + cycleTime(steps[0].motion);
    expect(seq.stepAt(0)).toBe(0);
    expect(seq.stepAt(boundary - 0.01)).toBe(0);
    expect(seq.stepAt(boundary + 0.01)).toBe(1);
    expect(seq.stepAt(seq.duration + 5)).toBe(1);
  });

  it("is deterministic in t (exact seek) and continuous across steps", () => {
    const again = new SequencePlayer(steps, HOME, 0.8, 0.35);
    expect(again.target(1.2)).toEqual(seq.target(1.2));
    const b = 0.8 + cycleTime(steps[0].motion);
    const before = seq.target(b - 1e-4);
    const after = seq.target(b + 1e-4);
    for (const j of JOINT_NAMES) expect(Math.abs(after[j] - before[j])).toBeLessThan(0.5);
  });

  it("looping behaviours play forever as a single motion", () => {
    expect(motionPlayable(m("idle"), HOME, 0.8).duration).toBe(Infinity);
    expect(motionPlayable(m("greet"), HOME, 0.8).duration).toBeCloseTo(0.8 + cycleTime(m("greet")));
  });
});

describe("loop continuity (contract change, STEP 8)", () => {
  it.each(["focus", "sleep", "idle", "doze", "sad", "sweep"])("%s has no jump at cycle boundaries", (name) => {
    const motion = m(name);
    const player = motionPlayable(motion, HOME, 0.8);
    const cycle = cycleTime(motion);
    for (const k of [1, 2]) {
      const t = 0.8 + cycle * k;
      const a = player.target(t - 1 / 120);
      const b = player.target(t + 1 / 120);
      for (const j of JOINT_NAMES) expect(Math.abs(b[j] - a[j])).toBeLessThan(1.5);
    }
  });
});
