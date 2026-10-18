import { describe, expect, it } from "vitest";
import { BEHAVIORS, HOME } from "./behaviors";
import { JOINT_NAMES, MotionPlayer, type JointName } from "./motion";
import { PURE_DESK_ROBOT, retargetMotion } from "./robots";

// public/pure-desk/model/robot.xml joint ranges (degrees), engine channel order.
const RIG: Record<JointName, [number, number]> = {
  base_yaw: [-150, 150],
  base_pitch: [-35, 55],
  elbow_pitch: [-120, 33],
  wrist_roll: [-160, 160],
  wrist_pitch: [-33, 42],
};

function overshoot(name: string) {
  const motion = retargetMotion(PURE_DESK_ROBOT, BEHAVIORS.find((b) => b.name === name)!);
  const player = new MotionPlayer(motion, HOME, 0.8);
  const span = motion.loop ? player.duration * 2 : player.duration;
  const worst: Partial<Record<JointName, number>> = {};
  for (let t = 0; t <= span; t += 1 / 60) {
    const pose = player.target(t);
    for (const j of JOINT_NAMES) {
      const [lo, hi] = RIG[j];
      const over = Math.max(pose[j] - hi, lo - pose[j], 0);
      if (over > (worst[j] ?? 0)) worst[j] = over;
    }
  }
  return worst;
}

describe("PURE Desk retarget", () => {
  it("has the robot's own joint ids", () => {
    expect(Object.values(PURE_DESK_ROBOT.jointKeys)).toEqual([
      "base_yaw", "shoulder_pitch", "elbow_pitch", "head_pan", "head_tilt",
    ]);
  });

  it.each(BEHAVIORS.map((b) => b.name))("%s stays inside the rig range", (name) => {
    expect(overshoot(name)).toEqual({});
  });
});
