import { describe, expect, it } from "vitest";
import { FACE_PRESETS } from "@/data/face-presets";
import { FACE_RANGES, clampFace, type FaceParams } from "./face-canvas";

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
