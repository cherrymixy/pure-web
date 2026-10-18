import { LEGACY_SOUNDS, SOUND_CUES, soundOf } from "@/data/sound-cues";
import type { Db, SoundCue, SoundSpec } from "../models";

// Saved sounds made before the recorded robot sounds: synthesized cues
// ({ timbre, tempo, lengthS, pitchSt, volumeDb }, preset only in the id) → { sound, pitchSt, volumeDb }.

/** Old preset settings, to recognise cues whose id doesn't name the preset ("cue-1"). */
const LEGACY_SHAPES: [string, { timbre: string; tempo: number; lengthS: number }][] = [
  ["low-warm", { timbre: "soft", tempo: 0.9, lengthS: 0.6 }],
  ["soft-breath", { timbre: "soft", tempo: 0.7, lengthS: 1.2 }],
  ["rising-chirp", { timbre: "bright", tempo: 1.2, lengthS: 0.35 }],
  ["falling-tone", { timbre: "soft", tempo: 0.8, lengthS: 0.7 }],
  ["signature", { timbre: "bright", tempo: 1, lengthS: 0.5 }],
];
const LEGACY_PITCH: Record<string, number> = { "low-warm": -5, "soft-breath": -2, "rising-chirp": 7, "falling-tone": 3, signature: 0 };

type OldCue = Partial<SoundCue> & { timbre?: string; tempo?: number; lengthS?: number };

export function migrateCue(raw: OldCue): SoundCue {
  if (raw.sound && soundOf(raw.sound)) return { id: raw.id!, t: raw.t ?? 0, sound: raw.sound, pitchSt: raw.pitchSt ?? 0, volumeDb: raw.volumeDb ?? -6 };
  const byId = Object.keys(LEGACY_SOUNDS).find((k) => raw.id?.startsWith(k));
  const byShape = LEGACY_SHAPES.find(([, s]) => s.timbre === raw.timbre && s.tempo === raw.tempo && s.lengthS === raw.lengthS)?.[0];
  const legacy = byId ?? byShape;
  const sound = soundOf(legacy ? LEGACY_SOUNDS[legacy] : "") ?? SOUND_CUES[0];
  // Keep only the signature's pitch offset, not the old synth note.
  const offset = legacy && typeof raw.pitchSt === "number" ? raw.pitchSt - LEGACY_PITCH[legacy] : 0;
  return { id: raw.id ?? `${sound.id}@${raw.t ?? 0}`, t: raw.t ?? 0, sound: sound.id, pitchSt: Math.round(offset * 10) / 10, volumeDb: sound.volumeDb };
}

export const migrateSound = (spec: SoundSpec | undefined): SoundSpec => ({ cues: (spec?.cues ?? []).map((c) => migrateCue(c as OldCue)) });

type Holder = { sound: SoundSpec; history?: Holder[] };
const migrateHolder = (e: Holder): void => {
  e.sound = migrateSound(e.sound);
  e.history?.forEach(migrateHolder);
};

/** Repo load migration. */
export function migrateDbSounds(db: Db): void {
  db.expressions.forEach(migrateHolder);
  db.library.forEach(migrateHolder);
}
