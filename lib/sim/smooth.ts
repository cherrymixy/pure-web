import { JOINT_NAMES, type JointName, type PartialPose, type Pose } from './motion';

/**
 * Command smoothing between the playback target and the servos.
 *
 * The servos are stiff and barely damped, so a fast keyframe edge makes the arm snap and
 * overshoot. Every joint command instead follows the target through a critically damped
 * spring with capped velocity and acceleration: slow motion is tracked closely, sharp edges
 * are rounded off, and nothing moves faster than `maxVel` (the same 120°/s that expression
 * validation allows).
 */
export interface SmoothOptions {
  /** Spring stiffness, rad/s (lag ≈ 2/omega seconds) */
  omega: number;
  /** °/s */
  maxVel: number;
  /** °/s² */
  maxAcc: number;
}

export const SMOOTH_DEFAULTS: SmoothOptions = { omega: 16, maxVel: 120, maxAcc: 900 };

const SUBSTEP = 1 / 240;

export class CommandSmoother {
  private readonly pos = {} as Pose;
  private readonly vel = {} as Pose;

  constructor(
    start: Pose,
    private readonly opts: SmoothOptions = SMOOTH_DEFAULTS,
  ) {
    this.reset(start);
  }

  /** Jump straight to a pose, at rest (seek, reload). */
  reset(pose: PartialPose): void {
    for (const j of JOINT_NAMES) {
      if (pose[j] !== undefined) this.pos[j] = pose[j]!;
      this.pos[j] ??= 0;
      this.vel[j] = 0;
    }
  }

  get pose(): Pose {
    return { ...this.pos };
  }

  /** Advance dt seconds toward `target` (joints missing from it hold their last target). */
  step(target: Pose, dt: number): Pose {
    const { omega, maxVel, maxAcc } = this.opts;
    let left = Math.max(dt, 0);
    while (left > 1e-9) {
      const h = Math.min(left, SUBSTEP);
      left -= h;
      for (const j of JOINT_NAMES) this.advance(j, target[j], h, omega, maxVel, maxAcc);
    }
    return this.pose;
  }

  private advance(j: JointName, target: number, h: number, omega: number, maxVel: number, maxAcc: number): void {
    const acc = Math.max(-maxAcc, Math.min(maxAcc, omega * omega * (target - this.pos[j]) - 2 * omega * this.vel[j]));
    this.vel[j] = Math.max(-maxVel, Math.min(maxVel, this.vel[j] + acc * h));
    this.pos[j] += this.vel[j] * h;
  }
}
