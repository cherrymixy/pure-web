import type { SoundCue } from "@/lib/models";

// Robot sounds (W02E Sound panel): recorded clips in public/sounds, played as they are.
// A cue places one of them on the timeline; pitch (semitones, signature shifts it) and volume are the only tweaks.
export const SOUND_DIR = "/sounds/";

export interface RobotSound {
  id: string;
  label: string;
  file: string;
  /** Clip length in seconds (at pitch 0) */
  durationS: number;
  /** What it says — for the generator prompt */
  hint: string;
  /** Default volume, dB */
  volumeDb: number;
}

export const SOUND_CUES: RobotSound[] = [
  { id: "yes", label: "Yes", file: "yes.m4a", durationS: 0.14, hint: "short positive blip, agreeing", volumeDb: -6 },
  { id: "cute-fond", label: "Cute fond", file: "cute-fond.m4a", durationS: 0.58, hint: "cute, liking something", volumeDb: -6 },
  { id: "cute-excited", label: "Cute excited", file: "cute-excited.m4a", durationS: 0.48, hint: "cute and excited, greeting", volumeDb: -6 },
  { id: "excited", label: "Excited", file: "excited.m4a", durationS: 2.15, hint: "excited, joyful", volumeDb: -6 },
  { id: "surprise", label: "Surprise", file: "surprise.m4a", durationS: 1.08, hint: "surprised, startled, alert", volumeDb: -6 },
  { id: "tilt", label: "Curious tilt", file: "tilt.m4a", durationS: 1.04, hint: "curious, puzzled", volumeDb: -6 },
  { id: "refuse", label: "Refuse", file: "refuse.m4a", durationS: 2.75, hint: "refusing, disagreeing", volumeDb: -6 },
  { id: "sulk", label: "Sulk", file: "sulk.m4a", durationS: 1.7, hint: "sulky, pouting", volumeDb: -6 },
  { id: "sad", label: "Sad", file: "sad.m4a", durationS: 0.53, hint: "sad, short", volumeDb: -6 },
  { id: "sad-long", label: "Sad (long)", file: "sad-long.m4a", durationS: 2.89, hint: "sad, drawn out, tired", volumeDb: -6 },
];

/** Old synthesized cue presets → the sound that replaces them (saved projects, old pure.json). */
export const LEGACY_SOUNDS: Record<string, string> = {
  "low-warm": "yes",
  "soft-breath": "sad-long",
  "rising-chirp": "excited",
  "falling-tone": "sad",
  signature: "cute-excited",
};

export const soundOf = (id: string): RobotSound | undefined => SOUND_CUES.find((s) => s.id === id);

/** Place a sound on the timeline. */
export function cueAt(soundId: string, t: number, id = `${soundId}@${t}`): SoundCue {
  const sound = soundOf(soundId) ?? SOUND_CUES[0];
  return { id, t, sound: sound.id, pitchSt: 0, volumeDb: sound.volumeDb };
}
