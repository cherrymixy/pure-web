import { describe, expect, it } from "vitest";
import { frameTimes } from "./frames";

describe("frameTimes", () => {
  it("centres 8 samples in equal slices", () => {
    const t = frameTimes(8);
    expect(t).toHaveLength(8);
    expect(t[0]).toBeCloseTo(0.5);
    expect(t[7]).toBeCloseTo(7.5);
  });
});
