import { describe, expect, it } from "vitest";
import { diffEnergy, energySamples } from "./energy";

const frame = (v: number) => new Uint8ClampedArray([v, v, v, 255, v, v, v, 255]);

describe("reference motion energy", () => {
  it("measures luma change between consecutive frames", () => {
    expect(diffEnergy([frame(0), frame(0), frame(100), frame(100)])).toEqual([0, 100, 0]);
  });

  it("places samples between frame times", () => {
    const s = energySamples([1, 2, 3, 4, 5, 6, 7], 8);
    expect(s).toHaveLength(7);
    expect(s[0].t).toBeCloseTo(1);
    expect(s[6].t).toBeCloseTo(7);
  });
});
