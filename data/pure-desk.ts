import type { Structure } from "@/lib/models";

// PURE Desk structure seed. Ranges are the joint limits in
// public/pure-desk/model/robot.xml (joints "1"…"5", degrees).
export const PURE_DESK_JOINTS = [
  { id: "base_yaw", label: "Base yaw", rigMin: -150, rigMax: 150 },
  { id: "shoulder_pitch", label: "Shoulder", rigMin: -35, rigMax: 55 },
  { id: "elbow_pitch", label: "Elbow", rigMin: -120, rigMax: 33 },
  { id: "head_pan", label: "Head pan", rigMin: -160, rigMax: 160 },
  { id: "head_tilt", label: "Head tilt", rigMin: -33, rigMax: 42 },
] as const;

export const PURE_DESK_STRUCTURE: Structure = {
  type: "joint-fixed",
  source: "pure-desk",
  channels: ["motion", "face", "sound"],
  joints: PURE_DESK_JOINTS.map((j) => ({ ...j, min: j.rigMin, max: j.rigMax })),
};

export const PURE_DESK_NAME = "PURE Desk";
