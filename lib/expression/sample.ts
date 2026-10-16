// Sampling helpers shared by validation, clips and compatibility. Reads the sealed sim
// modules (no changes): recipes are built exactly like SimController.recipeSource.

import { BEHAVIORS, HOME } from "../sim/behaviors";
import { sampleTrack } from "../sim/clip";
import { JOINT_NAMES, type Pose } from "../sim/motion";
import { applyParams, resolveParams, scaleTime, type PlaybackParams } from "../sim/params";
import { PURE_DESK_ROBOT, retargetMotion, type RobotSpec } from "../sim/robots";
import { SequencePlayer } from "../sim/sequence";
import type { Clip, JointId, Recipe, Structure } from "../models";

/** Same lead-ins as components/sim/sim-controller.ts (LEAD_IN / JOIN_IN). */
export const LEAD_IN = 0.8;
export const JOIN_IN = 0.35;
export const MAX_DEG_PER_S = 120;

export type JointPose = Record<JointId, number>;

export function toJointPose(pose: Pose, robot: RobotSpec = PURE_DESK_ROBOT): JointPose {
  const out: JointPose = {};
  for (const j of JOINT_NAMES) out[robot.jointKeys[j]] = pose[j];
  return out;
}

/** The recipe as the simulator plays it, from HOME. */
export function recipePlayer(recipe: Recipe, params: PlaybackParams = {}, robot: RobotSpec = PURE_DESK_ROBOT) {
  const p = resolveParams(params);
  const steps = recipe.steps.flatMap((step) => {
    const motion = BEHAVIORS.find((b) => b.name === step.behavior);
    if (!motion) return [];
    const scaled = scaleTime(retargetMotion(robot, motion), step.speed > 0 ? step.speed : 1);
    return [{ motion: applyParams(scaled, { ...p, amplitude: p.amplitude * step.amplitude }, HOME), repeat: step.repeat }];
  });
  return new SequencePlayer(steps, HOME, LEAD_IN, JOIN_IN);
}

export interface Frame {
  /** Seconds of playback time (already divided by params.speed) */
  t: number;
  pose: JointPose;
  step: number;
}

/** Sample a recipe at `fps`, in wall-clock time (the sim clock runs at params.speed). */
export function sampleRecipe(recipe: Recipe, params: PlaybackParams = {}, fps = 60): { frames: Frame[]; duration: number } {
  const player = recipePlayer(recipe, params);
  const speed = resolveParams(params).speed;
  const frames: Frame[] = [];
  const n = Math.ceil(player.duration * fps);
  for (let i = 0; i <= n; i++) {
    const tp = Math.min(i / fps, player.duration);
    frames.push({ t: tp / speed, pose: toJointPose(player.target(tp)), step: player.stepAt(tp) });
  }
  return { frames, duration: player.duration / speed };
}

/** Value of every track at t (missing tracks read 0, like the engine). */
export function sampleModelClip(clip: Clip, t: number, joints: JointId[]): JointPose {
  const out: JointPose = {};
  for (const id of joints) {
    const keys = clip.tracks[id];
    out[id] = keys?.length ? sampleTrack({ joint: "base_yaw", keys }, t, clip.duration, !!clip.loop) : 0;
  }
  return out;
}

export function jointIds(structure: Structure): JointId[] {
  return structure.joints.map((j) => j.id);
}

export function rangeOf(structure: Structure, id: JointId): [number, number] {
  const j = structure.joints.find((x) => x.id === id);
  return j ? [j.min, j.max] : [-Infinity, Infinity];
}
