/**
 * Range-exceeded detection.
 *
 * LampSim.setJoint silently clamps to the physical ctrlrange. The structure step
 * (W02B-4 Edit limits) can only narrow those ranges, so the runtime checks every
 * commanded pose against the injected structure limits *before* the clamp and
 * reports the first overshoot per joint per playback.
 *
 * Pure module: no three, no MuJoCo.
 */

import { JOINT_NAMES, type JointName, type Pose } from '@/lib/sim/motion';
import type { RobotSpec } from '@/lib/sim/robots';

/** Keyed by the robot's own joint id (`RobotSpec.jointKeys`, e.g. `shoulder_pitch`). */
export type JointLimits = Record<string, [number, number]>;

export interface LimitEvent {
  /** Robot joint id (e.g. `shoulder_pitch`) */
  joint: string;
  /** Commanded value before clamping, degrees */
  value: number;
  /** The bound that was crossed, degrees */
  limit: number;
  /** Playback time, seconds */
  t: number;
}

const EPS = 1e-6;

export class LimitMonitor {
  private limits: Record<JointName, [number, number]>;
  private readonly reported = new Set<JointName>();

  constructor(
    private readonly robot: RobotSpec,
    defaults: Record<JointName, [number, number]>,
  ) {
    this.limits = { ...defaults };
  }

  /** Inject structure limits. Joints not listed keep their current range. */
  setLimits(limits: JointLimits): void {
    for (const joint of JOINT_NAMES) {
      const range = limits[this.robot.jointKeys[joint]];
      if (range) this.limits[joint] = [range[0], range[1]];
    }
    this.reported.clear();
  }

  getLimits(): JointLimits {
    const out: JointLimits = {};
    for (const joint of JOINT_NAMES) out[this.robot.jointKeys[joint]] = [...this.limits[joint]];
    return out;
  }

  /** Clamp a pose into the current limits (start pose of a new playback). */
  clamp(pose: Pose): Pose {
    const out = { ...pose };
    for (const joint of JOINT_NAMES) {
      const [lo, hi] = this.limits[joint];
      out[joint] = Math.min(Math.max(out[joint], lo), hi);
    }
    return out;
  }

  /** Start of a new playback — every joint may report again. */
  reset(): void {
    this.reported.clear();
  }

  /** Returns events for joints that crossed a bound for the first time in this playback. */
  check(pose: Partial<Pose>, t: number): LimitEvent[] {
    const events: LimitEvent[] = [];
    for (const joint of JOINT_NAMES) {
      const value = pose[joint];
      if (value === undefined || this.reported.has(joint)) continue;
      const [lo, hi] = this.limits[joint];
      const limit = value > hi + EPS ? hi : value < lo - EPS ? lo : null;
      if (limit === null) continue;
      this.reported.add(joint);
      events.push({ joint: this.robot.jointKeys[joint], value, limit, t });
    }
    return events;
  }
}
