/**
 * STEP 12 (flag directClip): optical-flow approximation for Match timing.
 * Block matching on luma: for each block, the shift (within ±search px) with the lowest
 * sum of absolute differences. Energy = mean displacement magnitude over textured blocks, so a
 * lighting change scores low while a moving subject scores high (unlike the plain luma diff).
 */
const luma = (px: Uint8ClampedArray, i: number) => 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];

function toLuma(px: Uint8ClampedArray, n: number): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = luma(px, i * 4);
  return out;
}

export function blockFlow(a: Uint8ClampedArray, b: Uint8ClampedArray, size: number, block = 8, search = 4): number {
  const A = toLuma(a, size * size);
  const B = toLuma(b, size * size);
  let total = 0;
  let counted = 0;
  for (let by = search; by + block + search <= size; by += block) {
    for (let bx = search; bx + block + search <= size; bx += block) {
      // Flat blocks have no trackable texture.
      let lo = Infinity;
      let hi = -Infinity;
      for (let y = 0; y < block; y++) for (let x = 0; x < block; x++) {
        const v = A[(by + y) * size + bx + x];
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
      if (hi - lo < 8) continue;
      let best = Infinity;
      let bestD = 0;
      for (let dy = -search; dy <= search; dy++) for (let dx = -search; dx <= search; dx++) {
        let sad = 0;
        for (let y = 0; y < block; y++) for (let x = 0; x < block; x++) {
          sad += Math.abs(A[(by + y) * size + bx + x] - B[(by + y + dy) * size + bx + x + dx]);
        }
        const d = Math.hypot(dx, dy);
        if (sad < best - 1e-6 || (Math.abs(sad - best) <= 1e-6 && d < bestD)) {
          best = sad;
          bestD = d;
        }
      }
      total += bestD;
      counted++;
    }
  }
  return counted ? total / counted : 0;
}

/** Flow energy between consecutive square RGBA frames (same size as readFramePixels). */
export function flowEnergy(frames: Uint8ClampedArray[], size: number): number[] {
  return frames.slice(1).map((f, i) => blockFlow(frames[i], f, size));
}
