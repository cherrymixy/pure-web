import { describe, expect, it } from "vitest";
import { FACE_PRESETS } from "@/data/face-presets";
import { FACE_RANGES, clampFace, faceAt, type FaceParams } from "./face-canvas";

describe("face params", () => {
  it.each(Object.entries(FACE_PRESETS))("preset %s is inside FACE_RANGES", (_, preset) => {
    for (const [k, v] of Object.entries(preset) as [keyof FaceParams, number][]) {
      const [lo, hi] = FACE_RANGES[k];
      expect(v).toBeGreaterThanOrEqual(lo);
      expect(v).toBeLessThanOrEqual(hi);
    }
  });

  it("clamps out-of-range and drops non-finite values", () => {
    expect(clampFace({ eyeSize: 9, brightness: -1, eyeAngle: NaN })).toEqual({ eyeSize: 1.6, brightness: 0.1 });
  });
});

describe("faceAt", () => {
  const base = FACE_PRESETS.neutral;
  const keys = [
    { t: 1, tokens: { eyeOpen: 1 } },
    { t: 3, tokens: { eyeOpen: 0.2, browAngle: -12 } },
  ];

  it("holds base, interpolates between keys, holds the last key", () => {
    expect(faceAt(base, keys, 0.5).eyeOpen).toBe(1);
    expect(faceAt(base, keys, 2).eyeOpen).toBeCloseTo(0.6);
    expect(faceAt(base, keys, 5).eyeOpen).toBeCloseTo(0.2);
  });

  it("interpolates each token from its own previous point", () => {
    expect(faceAt(base, keys, 1.5).browAngle).toBeCloseTo(-6); // from base (t=0) to key at 3
    expect(faceAt(base, keys, 2).eyeSize).toBe(base.eyeSize);
  });

  it("clamps key values", () => {
    expect(faceAt(base, [{ t: 0, tokens: { eyeSize: 9 } }], 1).eyeSize).toBe(1.6);
  });
});
