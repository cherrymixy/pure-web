import type { SoundCue } from "@/lib/models";

export type SoundCuePreset = Omit<SoundCue, "id" | "t"> & { id: string; label: string };

// Sound cue presets (W02E Sound panel). Synthesized with Web Audio in STEP 9.
export const SOUND_CUES: SoundCuePreset[] = [
  { id: "low-warm", label: "low warm cue", timbre: "soft", pitchSt: -5, tempo: 0.9, lengthS: 0.6, volumeDb: -8 },
  { id: "soft-breath", label: "soft breath", timbre: "soft", pitchSt: -2, tempo: 0.7, lengthS: 1.2, volumeDb: -14 },
  { id: "rising-chirp", label: "rising chirp", timbre: "bright", pitchSt: 7, tempo: 1.2, lengthS: 0.35, volumeDb: -10 },
  { id: "falling-tone", label: "falling tone", timbre: "soft", pitchSt: 3, tempo: 0.8, lengthS: 0.7, volumeDb: -10 },
  { id: "signature", label: "signature tone", timbre: "bright", pitchSt: 0, tempo: 1, lengthS: 0.5, volumeDb: -10 },
];

/** Place a preset on the timeline. */
export function cueAt(presetId: string, t: number, id = `${presetId}@${t}`): SoundCue {
  const preset = SOUND_CUES.find((c) => c.id === presetId) ?? SOUND_CUES[0];
  const { label: _label, id: _id, ...rest } = preset;
  return { ...rest, id, t };
}
