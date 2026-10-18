import type { Structure } from "@/lib/models";

// PURE Desk structure seed. Ranges are the joint limits in
// public/pure-desk/model/robot.xml (joints "1"…"5", degrees).
export const PURE_DESK_JOINTS = [
  { id: "base_yaw", label: "Base yaw", rigMin: -170, rigMax: 170 },
  { id: "shoulder_pitch", label: "Shoulder", rigMin: -28, rigMax: 41 },
  { id: "elbow_pitch", label: "Elbow", rigMin: -135, rigMax: 10 },
  { id: "head_pan", label: "Head pan", rigMin: -48, rigMax: 56 },
  { id: "head_tilt", label: "Head tilt", rigMin: -2, rigMax: 21 },
] as const;

export const PURE_DESK_STRUCTURE: Structure = {
  type: "joint-fixed",
  source: "pure-desk",
  channels: ["motion", "face", "sound"],
  joints: PURE_DESK_JOINTS.map((j) => ({ ...j, min: j.rigMin, max: j.rigMax })),
};

export const PURE_DESK_NAME = "PURE Desk";
