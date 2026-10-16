// Data model (PRD §7). Pure TS — no React, no I/O.
// STEP 3 defines the subset the simulator contract needs; STEP 4 adds the rest + zod schemas.

import type { EasingName } from "./sim/motion";

export type RobotType = "full-body" | "joint-walking" | "joint-driving" | "jointless-driving" | "joint-fixed";
export type Channel = "motion" | "face" | "sound";

/** Robot joint id, e.g. `shoulder_pitch` (PURE Desk `jointKeys`). */
export type JointId = string;

export interface Joint {
  id: JointId;
  label: string;
  /** Structure range (Edit limits can only narrow the rig range) */
  min: number;
  max: number;
  rigMin: number;
  rigMax: number;
}

export interface Structure {
  type: RobotType;
  joints: Joint[];
  channels: Channel[];
  source: "pure-desk" | "import";
  file?: { name: string; size: number; path: string };
}

export interface RecipeStep {
  behavior: string;
  speed: number;
  amplitude: number;
  repeat: number;
  /** Face preset name applied when this step starts */
  face?: string;
}

export interface Recipe {
  steps: RecipeStep[];
  loop?: boolean;
}

export interface Key {
  t: number;
  value: number;
  easing: EasingName;
}

export interface Clip {
  format: "lelamp.clip/1";
  duration: number;
  tracks: Record<JointId, Key[]>;
  loop?: boolean;
}

export interface FaceTokens {
  eyeSize: number;
  eyeAngle: number;
  browAngle: number;
  brightness: number;
  blinkRate: number;
  /** Lid openness 0…1, default 1 (added in STEP 3, see docs/decisions.md) */
  eyeOpen?: number;
}

export interface FaceSpec {
  /** Canvas preset name, or "video" for the per-behavior mp4 faces */
  preset: string;
  tokens: FaceTokens;
  keys?: { t: number; tokens: Partial<FaceTokens> }[];
}

export interface SoundCue {
  id: string;
  t: number;
  pitchSt: number;
  tempo: number;
  lengthS: number;
  timbre: "bright" | "soft";
  volumeDb: number;
}

export interface SoundSpec {
  cues: SoundCue[];
}
