import type { Axis, Signature } from "@/lib/models";

// 8-axis brand signature (W02C). Values 0–100; PURE Default = 50 on every axis.
export const AXIS_INFO: Record<Axis, { label: string; description: string; low: string; high: string }> = {
  tempo: { label: "Tempo", description: "Overall playback speed of movements.", low: "Unhurried", high: "Brisk" },
  amp: { label: "Amplitude", description: "How far joints travel from rest.", low: "Subtle", high: "Expansive" },
  settle: { label: "Settle", description: "How a move lands: overshoot or soft stop.", low: "Springy", high: "Soft landing" },
  antic: { label: "Anticipation", description: "Small counter-move before the main move.", low: "Direct", high: "Wound up" },
  rhythm: { label: "Rhythm", description: "Repetition and oscillation frequency.", low: "Sparse", high: "Lively" },
  eyes: { label: "Eyes", description: "Default eye size and openness on the face display.", low: "Narrow", high: "Wide" },
  pitch: { label: "Pitch", description: "Base pitch of sound cues.", low: "Low", high: "High" },
  density: { label: "Density", description: "How many sound cues accompany a motion.", low: "Quiet", high: "Chatty" },
};

export const AXIS_ORDER: Axis[] = ["tempo", "amp", "settle", "antic", "rhythm", "eyes", "pitch", "density"];

export const DEFAULT_AXES: Record<Axis, number> = {
  tempo: 50, amp: 50, settle: 50, antic: 50, rhythm: 50, eyes: 50, pitch: 50, density: 50,
};

export const PURE_DEFAULT_SIGNATURE: Signature = {
  id: "sig-pure-default",
  name: "PURE Default",
  version: 1,
  axes: DEFAULT_AXES,
  tone: [],
  mapping: [],
  sources: [{ kind: "default", name: "PURE Default" }],
  note: "Neutral starting point. Every axis at 50.",
  createdAt: "2026-10-01T09:00:00.000Z",
};

/**
 * Tone keyword → axis offsets (added to 50, result clamped 0–100).
 * The signature engine (STEP 7) sums offsets of the 3–5 extracted keywords.
 */
export const TONE_DICTIONARY: Record<string, Partial<Record<Axis, number>>> = {
  warm: { tempo: -8, settle: 14, pitch: -10, eyes: 6 },
  precise: { settle: 18, antic: -12, rhythm: -8, density: -6 },
  playful: { amp: 14, rhythm: 16, antic: 12, pitch: 10, density: 8 },
  calm: { tempo: -16, amp: -10, rhythm: -12, density: -10 },
  confident: { amp: 10, antic: -6, settle: 8, tempo: 4 },
  bold: { amp: 18, tempo: 8, antic: 10, density: 6 },
  gentle: { tempo: -10, amp: -8, settle: 16, pitch: -4 },
  energetic: { tempo: 18, rhythm: 14, amp: 10, density: 10 },
  friendly: { eyes: 12, pitch: 6, rhythm: 6, settle: 4 },
  minimal: { amp: -12, density: -16, rhythm: -8 },
  premium: { tempo: -6, settle: 14, density: -8 },
  trustworthy: { settle: 12, rhythm: -6, antic: -4 },
  innovative: { antic: 8, rhythm: 8, pitch: 8 },
  soft: { settle: 14, pitch: -6, amp: -6 },
  dynamic: { tempo: 12, amp: 12, antic: 8 },
  elegant: { tempo: -8, settle: 16, amp: -4, density: -6 },
};

/** "How it maps" sentence. {keyword} {page} {axis} {direction} {value} are replaced by the engine. */
export const HOW_IT_MAPS_TEMPLATE = "“{keyword}” on p.{page} {direction} {axis} to {value}.";
export const HOW_IT_MAPS_NO_PAGE = "“{keyword}” {direction} {axis} to {value}.";
export const MAP_DIRECTION = { up: "raises", down: "lowers" } as const;

/** Signature axis → playback / face / sound ranges (PRD §6 rule 7). lerp(lo, hi, axis/100). */
export const PARAM_MAPPING = {
  speed: [0.7, 1.4],
  amplitude: [0.6, 1.3],
  rhythm: [0.6, 1.6],
  eyeSize: [0.8, 1.25],
  pitchSt: [-4, 4],
  maxCues: [1, 4],
} as const;
