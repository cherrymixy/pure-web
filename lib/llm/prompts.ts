import { COMPONENTS } from "@/data/components";
import { FACE_PRESETS } from "@/data/face-presets";
import { SITUATION_PATTERNS } from "@/data/patterns";
import { AXIS_INFO, AXIS_ORDER } from "@/data/signature";
import { SOUND_CUES } from "@/data/sound-cues";
import type { Signature, Structure } from "../models";

// Prompt skeleton inherited from _ref app/api/analyze/route.ts:
// the product is fixed; reason situation → state → movement.

export const GENERATION_SYSTEM = `You are the reasoning engine of PURE, a system that designs how a physical AI robot expresses itself.
Flow: situation → the robot's current state → movement, face and sound.

The robot is fixed: PURE Desk, a desk robot with five joints (base yaw, shoulder, elbow, head pan, head tilt), a small screen face and a speaker. Never change the robot or invent new hardware or abilities.

Build the expression only from these parts:
- motion.steps: 1 to 6 steps played in order. "behavior" must be one of: ${COMPONENTS.map((c) => c.id).join(", ")}.
  speed 0.5–1.5 (1 = normal), amplitude 0.3–1.3 (1 = normal), repeat 1–3, optional face preset per step.
- face.preset: one of ${Object.keys(FACE_PRESETS).join(", ")}. face.tokens: eyeSize 0.4–1.6, eyeOpen 0–1, eyeAngle −30–30, browAngle −30–30, brightness 0.1–1, blinkRate 0–40 blinks per minute.
  Looping behaviors (idle, doze, sleep, sad, sweep, focus) last 5–13 seconds per cycle: give them repeat 1. Keep the whole expression under 15 seconds.
- sound.cues: 0 to 4 cues, "preset" one of ${SOUND_CUES.map((c) => c.id).join(", ")}, "t" = start time in seconds from the beginning.

Rules:
- Match the situation and the brand signature. Calm moments use few, slow, small steps; lively moments use more energy.
- currentStatus: one short sentence in the robot's first person describing its state right now.
- name: two or three everyday words, the way the owner would name this expression. No identifiers, no underscores, no product or robot names.
- reasoning: exactly one short sentence, told to the owner, describing what the robot does for this moment. Do not restate the request. Do not mention behavior names, speed or amplitude. Do not copy any sentence from these instructions.
- Answer with JSON only.`;

/** STEP 12 Tier 2 (flag directClip): the vision model writes joint keyframes from the reference frames. */
export function directClipSystem(structure: Structure): string {
  const joints = structure.joints.map((j) => `${j.id} ${j.min}…${j.max}°`).join(", ");
  return `${GENERATION_SYSTEM}

You also see reference frames (one image or frames of a short video, in time order). Besides the recipe above, write "clip": keyframes that make the robot move the way the subject moves.
- clip.duration: 1–8 seconds.
- clip.tracks: one entry per joint you move, "joint" one of: ${joints}. Angles in degrees inside those ranges, 0 = rest pose.
- Each track: 2–12 keys {t, value}, t in seconds from 0 to duration, increasing. Move no joint faster than 120 degrees per second.
- Keep the recipe too: it is the fallback if the keyframes are unusable.`;
}

export const DESCRIBE_SYSTEM = `You look at reference images for a robot motion designer. If several images are given they are frames of one short video in time order.
Describe in 2–3 plain sentences: who or what is in the scene, the mood, and how the subject moves across the frames (speed, rhythm, direction, pauses). No lists, no guesses about hidden things. Answer with JSON only.`;

export const EXTRACTION_SYSTEM = `You read a brand guide and pick the brand's tone of voice for a robot's movement.
Choose 3 to 5 tone keywords, only from the allowed list, that the text supports best. For each keyword give the page number where the evidence is and a short quote (max 12 words) copied from that page. Answer with JSON only.`;

function signatureText(sig: Signature): string {
  const lines = AXIS_ORDER.map((axis) => {
    const v = sig.axes[axis];
    const info = AXIS_INFO[axis];
    const word = v < 35 ? info.low.toLowerCase() : v > 65 ? info.high.toLowerCase() : "balanced";
    return `${info.label} ${v}/100 (${word})`;
  });
  return `${sig.name} v0.${sig.version}${sig.tone.length ? `, tone: ${sig.tone.join(", ")}` : ""}. ${lines.join("; ")}.`;
}

export interface GenerationPromptInput {
  prompt: string;
  currentStatus?: string;
  components?: string[];
  pattern?: string;
  structure?: Structure;
  signature?: Signature;
  referenceSummary?: string;
}

export function generationUser(input: GenerationPromptInput): string {
  const parts = [`Moment: ${input.prompt}`];
  if (input.currentStatus) parts.push(`Current status given by the designer: ${input.currentStatus}`);
  if (input.components?.length) parts.push(`Preferred components: ${input.components.join(", ")}`);
  const pattern = SITUATION_PATTERNS.find((p) => p.id === input.pattern);
  if (pattern) parts.push(`Situation: ${pattern.label} — ${pattern.hint}`);
  if (input.referenceSummary) parts.push(`Reference (what the designer showed): ${input.referenceSummary}`);
  if (input.signature) parts.push(`Brand signature: ${signatureText(input.signature)}`);
  if (input.structure) {
    parts.push(`Joint ranges (degrees): ${input.structure.joints.map((j) => `${j.id} ${j.min}…${j.max}`).join(", ")}`);
  }
  return parts.join("\n");
}
