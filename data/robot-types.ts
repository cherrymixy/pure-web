import type { Channel, RobotType } from "@/lib/models";

export interface RobotTypeInfo {
  id: RobotType;
  name: string;
  dof: string;
  description: string;
  /** Channels toggled on by default in the structure step */
  channels: Channel[];
  /** Only Joint Fixed can be selected in this demo (PRD appendix D) */
  selectable: boolean;
}

export const ROBOT_TYPES: RobotTypeInfo[] = [
  {
    id: "full-body",
    name: "Full-body",
    dof: "23–43 DoF",
    description: "Humanoid robots with arms, legs and a head. Expression spreads across the whole body.",
    channels: ["motion", "face", "sound"],
    selectable: false,
  },
  {
    id: "joint-walking",
    name: "Joint Walking",
    dof: "10–14 DoF",
    description: "Legged robots such as quadrupeds. Gait, posture and head carry the expression.",
    channels: ["motion", "sound"],
    selectable: false,
  },
  {
    id: "joint-driving",
    name: "Joint Driving",
    dof: "2–6 DoF + wheels",
    description: "Wheeled bases with a jointed neck or arm. Driving paths plus upper-body gestures.",
    channels: ["motion", "face", "sound"],
    selectable: false,
  },
  {
    id: "jointless-driving",
    name: "Jointless Driving",
    dof: "0 DoF · wheels",
    description: "Wheeled robots without joints. Movement paths, light and sound do the talking.",
    channels: ["motion", "face", "sound"],
    selectable: false,
  },
  {
    id: "joint-fixed",
    name: "Joint Fixed",
    dof: "5–9 DoF",
    description: "Stationary robots with a jointed arm and head, like PURE Desk. Motion, face and sound.",
    channels: ["motion", "face", "sound"],
    selectable: true,
  },
];
