import type { FaceSpec, Recipe, SoundSpec, Structure } from "@/lib/models";
import { cueAt } from "./sound-cues";

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
    rig("base_yaw", "Base yaw", -170, 170),
    rig("shoulder_pitch", "Shoulder", -28, 41),
    rig("elbow_pitch", "Elbow", -135, 10),
    rig("head_pan", "Head pan", -48, 56),
    rig("head_tilt", "Head tilt", -2, 21),
  ],
};

// Edit-limits example from STEP 10②: shoulder narrowed to −20…40.
export const DEV_STRUCTURE_NARROW: Structure = {
  ...DEV_STRUCTURE,
  joints: DEV_STRUCTURE.joints.map((j) => (j.id === "shoulder_pitch" ? { ...j, min: -20, max: 40 } : j)),
};

// STEP 9: "greeting" with cues on the motion clock and a face that dozes off along the timeline.
export const DEV_SOUND: SoundSpec = {
  cues: [cueAt("rising-chirp", 0.3), cueAt("signature", 1.6), cueAt("low-warm", 3.2)],
};

export const DEV_FACE_KEYS: FaceSpec = {
  preset: "neutral",
  tokens: { eyeSize: 1, eyeOpen: 1, eyeAngle: 0, browAngle: 0, brightness: 1, blinkRate: 12 },
  keys: [
    { t: 1, tokens: { eyeOpen: 1, browAngle: 0 } },
    { t: 3, tokens: { eyeOpen: 0.2, browAngle: -12, eyeAngle: -8, brightness: 0.45 } },
  ],
};
