import type { Structure } from "@/lib/models";
import { PURE_DESK_STRUCTURE } from "./pure-desk";

// Structures of the dummy robots in "Test on your robot" / Export (W02F). The compatibility
// check runs against these. Studio arm: 6 joints, tighter limits, motion only.
export const ROBOT_DEVICE_STRUCTURES: Record<string, Structure> = {
  "r-purebot-desk": PURE_DESK_STRUCTURE,
  "r-studio-arm": {
    type: "joint-fixed",
    source: "import",
    channels: ["motion"],
    joints: [
      { id: "base_yaw", label: "Base yaw", min: -90, max: 90, rigMin: -90, rigMax: 90 },
      { id: "shoulder_pitch", label: "Shoulder", min: -20, max: 40, rigMin: -20, rigMax: 40 },
      { id: "elbow_pitch", label: "Elbow", min: -90, max: 20, rigMin: -90, rigMax: 20 },
      { id: "head_pan", label: "Wrist pan", min: -90, max: 90, rigMin: -90, rigMax: 90 },
      { id: "head_tilt", label: "Wrist tilt", min: -20, max: 30, rigMin: -20, rigMax: 30 },
      { id: "gripper", label: "Gripper", min: 0, max: 60, rigMin: 0, rigMax: 60 },
    ],
  },
};
