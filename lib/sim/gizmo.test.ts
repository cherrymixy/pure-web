import { describe, expect, it } from "vitest";
import { RingDrag, rayPlane, signedAngleDeg } from "./gizmo";

describe("joint gizmo math", () => {
  it("signed angle follows the right-hand rule around the axis", () => {
    expect(signedAngleDeg([0, 0, 1], [1, 0, 0], [0, 1, 0])).toBeCloseTo(90);
    expect(signedAngleDeg([0, 0, 1], [0, 1, 0], [1, 0, 0])).toBeCloseTo(-90);
    expect(signedAngleDeg([0, 0, -1], [1, 0, 0], [0, 1, 0])).toBeCloseTo(-90);
    expect(signedAngleDeg([0, 0, 2], [1, 0, 0], [-1, 0.0001, 0])).toBeCloseTo(180, 1);
  });

  it("ray meets the ring plane; edge-on or behind gives null", () => {
    expect(rayPlane([0, 0, 5], [0, 0, -1], [0, 0, 0], [0, 0, 1])).toEqual([0, 0, 0]);
    expect(rayPlane([0, 0, 5], [1, 0, 0], [0, 0, 0], [0, 0, 1])).toBeNull();
    expect(rayPlane([0, 0, 5], [0, 0, 1], [0, 0, 0], [0, 0, 1])).toBeNull();
  });

  it("a drag keeps counting past half a turn", () => {
    const d = new RingDrag([0, 0, 0], [0, 0, 1], [1, 0, 0]);
    for (let deg = 10; deg <= 270; deg += 10) {
      const r = (deg * Math.PI) / 180;
      d.move([Math.cos(r), Math.sin(r), 0]);
    }
    expect(d.total).toBeCloseTo(270);
  });
});
