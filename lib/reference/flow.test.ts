import { describe, expect, it } from "vitest";
import { blockFlow, flowEnergy } from "./flow";

const SIZE = 32;
/** A bright 8×8 square at (x, y) on black, optionally with uniform brightness `bg`. */
function frame(x: number, y: number, bg = 0) {
  const px = new Uint8ClampedArray(SIZE * SIZE * 4).fill(bg);
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
    const p = ((y + j) * SIZE + x + i) * 4;
    px[p] = px[p + 1] = px[p + 2] = 250;
  }
  for (let p = 3; p < px.length; p += 4) px[p] = 255;
  return px;
}

describe("optical flow approximation", () => {
  it("is zero for a still frame and grows with the shift", () => {
    expect(blockFlow(frame(10, 10), frame(10, 10), SIZE)).toBe(0);
    const small = blockFlow(frame(10, 10), frame(11, 10), SIZE);
    const large = blockFlow(frame(10, 10), frame(13, 10), SIZE);
    expect(small).toBeGreaterThan(0);
    expect(large).toBeGreaterThan(small);
  });

  it("flowEnergy has one value per consecutive pair", () => {
    expect(flowEnergy([frame(10, 10), frame(12, 10), frame(12, 10)], SIZE)).toHaveLength(2);
  });
});
