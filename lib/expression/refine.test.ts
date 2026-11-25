import { describe, expect, it } from "vitest";
import type { GenerationOutput } from "../llm/generation";
import { baseText, refineByWords, refineProps } from "./refine";

const base = {
  name: "Tired",
  currentStatus: "I'm tired",
  reasoning: "",
  motion: { steps: [{ behavior: "doze", speed: 1, amplitude: 1, repeat: 1 }] },
  face: { preset: "sleepy" },
  sound: { cues: [] },
} as unknown as GenerationOutput;

describe("refineByWords", () => {
  it("bigger / 크게 scales amplitude, keeps the name", () => {
    expect(refineByWords(base, "좀 더 크게 숙여").motion.steps[0].amplitude).toBe(1.3);
    expect(refineByWords(base, "make it bigger").name).toBe("Tired");
  });
  it("slower and one more time together", () => {
    const s = refineByWords(base, "천천히 한 번 더").motion.steps[0];
    expect(s.speed).toBe(0.75);
    expect(s.repeat).toBe(2);
  });
  it("smaller wins over the 'more' in 'less'", () => {
    expect(refineByWords(base, "less, smaller").motion.steps[0].amplitude).toBe(0.7);
  });
  it("no known word keeps the base", () => {
    expect(refineByWords(base, "hmm").motion.steps).toEqual(base.motion.steps);
  });
  it("refineProps moves the Amplitude and Speed dials, clamped to 0–100", () => {
    const p = { amplitude: 90, duration: 50, smoothness: 50, speed: 10, frequency: 50 };
    expect(refineProps(p, "bigger and slower")).toMatchObject({ amplitude: 100, speed: 0 });
    expect(refineProps(p, "hmm")).toEqual(p);
  });
  it("baseText names the motion and its steps", () => {
    expect(baseText(base)).toContain('"Tired": doze (speed 1, amplitude 1, repeat 1)');
  });
});
