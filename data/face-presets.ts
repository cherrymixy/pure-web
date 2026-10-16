import type { FaceParams } from "@/components/sim/face-canvas";

// Canvas face presets (CLAUDE.md rule 9: presets live in data/).
// "video" is not here: it plays the per-behavior mp4s from public/pure-desk/faces/faces.json.
export const FACE_PRESETS = {
  neutral: { eyeSize: 1, eyeOpen: 1, eyeAngle: 0, browAngle: 0, brightness: 1, blinkRate: 12 },
  soft: { eyeSize: 0.9, eyeOpen: 0.75, eyeAngle: -4, browAngle: 0, brightness: 0.8, blinkRate: 10 },
  wide: { eyeSize: 1.3, eyeOpen: 1, eyeAngle: 0, browAngle: 10, brightness: 1, blinkRate: 6 },
  blink: { eyeSize: 1, eyeOpen: 1, eyeAngle: 0, browAngle: 0, brightness: 1, blinkRate: 36 },
  sleepy: { eyeSize: 0.95, eyeOpen: 0.22, eyeAngle: -8, browAngle: -12, brightness: 0.45, blinkRate: 4 },
  happy: { eyeSize: 1.05, eyeOpen: 0.5, eyeAngle: 14, browAngle: 8, brightness: 1, blinkRate: 14 },
} satisfies Record<string, FaceParams>;

export type FacePresetName = keyof typeof FACE_PRESETS;
