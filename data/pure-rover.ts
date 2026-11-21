import type { Structure } from "@/lib/models";

// PURE Rover structure seed (Jointless Driving). Ranges are the joint limits in
// public/pure-rover/model/robot.xml (joints "1"…"5", degrees). Drive is a slide: its command
// reads as metres × 180/π, so ±20.05 = ±35 cm.
export const PURE_ROVER_JOINTS = [
  { id: "body_yaw", label: "Turn", rigMin: -170, rigMax: 170 },
  { id: "drive", label: "Drive", rigMin: -20.05, rigMax: 20.05 },
  { id: "rock", label: "Rock", rigMin: -22, rigMax: 22 },
  { id: "roll", label: "Roll", rigMin: -12, rigMax: 12 },
  { id: "nod", label: "Nod", rigMin: -18, rigMax: 18 },
] as const;

export const PURE_ROVER_STRUCTURE: Structure = {
  type: "jointless-driving",
  source: "pure-rover",
  channels: ["motion", "face", "sound"],
  joints: PURE_ROVER_JOINTS.map((j) => ({ ...j, min: j.rigMin, max: j.rigMax })),
};
