/**
 * Rotation ring math (editor joint gizmo). A hinge turns about its world axis through its anchor;
 * the drag is read on that plane, so the angle swept around the axis is the joint delta.
 *
 * Pure module: plain [x, y, z] vectors, no three.js.
 */

export type Vec3 = readonly [number, number, number];

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/**
 * Where a ray meets the plane through `point` with normal `normal`.
 * null when the ray runs along the plane (ring seen edge-on) or points away from it.
 */
export function rayPlane(origin: Vec3, dir: Vec3, point: Vec3, normal: Vec3): Vec3 | null {
  const denom = dot(dir, normal);
  if (Math.abs(denom) < 1e-4) return null;
  const s = dot(sub(point, origin), normal) / denom;
  if (s < 0) return null;
  return [origin[0] + dir[0] * s, origin[1] + dir[1] * s, origin[2] + dir[2] * s];
}

/** Signed angle (degrees) from `from` to `to` around `axis` (right hand: positive = counter-clockwise looking down the axis). */
export function signedAngleDeg(axis: Vec3, from: Vec3, to: Vec3): number {
  const n = Math.hypot(axis[0], axis[1], axis[2]) || 1;
  const unit: Vec3 = [axis[0] / n, axis[1] / n, axis[2] / n];
  return (Math.atan2(dot(cross(from, to), unit), dot(from, to)) * 180) / Math.PI;
}

/**
 * Accumulates a drag around a hinge: each pointer sample adds the small angle since the last one,
 * so sweeping past ±180° keeps counting instead of wrapping.
 */
export class RingDrag {
  private last: Vec3;
  total = 0;

  constructor(
    private readonly anchor: Vec3,
    private readonly axis: Vec3,
    start: Vec3,
  ) {
    this.last = sub(start, anchor);
  }

  /** Feed the pointer's hit on the ring plane; returns the total degrees swept so far. */
  move(hit: Vec3): number {
    const v = sub(hit, this.anchor);
    // Too close to the centre the direction is noise.
    if (Math.hypot(v[0], v[1], v[2]) < 1e-5) return this.total;
    this.total += signedAngleDeg(this.axis, this.last, v);
    this.last = v;
    return this.total;
  }
}
