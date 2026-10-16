import type { Recipe, Structure } from "@/lib/models";

// /dev/sim test fixtures (not product content; real seeds arrive in STEP 4).
export const DEV_RECIPES: Record<string, Recipe> = {
  greeting: {
    steps: [
      { behavior: "wake", speed: 1, amplitude: 1, repeat: 1, face: "wide" },
      { behavior: "greet", speed: 1, amplitude: 1, repeat: 1, face: "happy" },
      { behavior: "nod", speed: 1.2, amplitude: 0.8, repeat: 2, face: "soft" },
    ],
  },
  overdrive: {
    steps: [
      { behavior: "curious", speed: 1, amplitude: 1, repeat: 1 },
      { behavior: "focus", speed: 1, amplitude: 1.5, repeat: 1 },
    ],
  },
};

const rig = (id: string, label: string, min: number, max: number) => ({ id, label, min, max, rigMin: min, rigMax: max });

// PURE Desk rig ranges (public/pure-desk/model/robot.xml).
export const DEV_STRUCTURE: Structure = {
  type: "joint-fixed",
  source: "pure-desk",
  channels: ["motion", "face", "sound"],
  joints: [
    rig("base_yaw", "Base yaw", -150, 150),
    rig("shoulder_pitch", "Shoulder", -35, 55),
    rig("elbow_pitch", "Elbow", -120, 33),
    rig("head_pan", "Head pan", -160, 160),
    rig("head_tilt", "Head tilt", -33, 42),
  ],
};

// Edit-limits example from STEP 10②: shoulder narrowed to −20…40.
export const DEV_STRUCTURE_NARROW: Structure = {
  ...DEV_STRUCTURE,
  joints: DEV_STRUCTURE.joints.map((j) => (j.id === "shoulder_pitch" ? { ...j, min: -20, max: 40 } : j)),
};
