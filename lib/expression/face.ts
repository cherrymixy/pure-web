import { FACE_AUTO, FACE_AUTO_LABEL, FACE_DIR, FACE_NAMES, FACE_VIDEOS, LEGACY_FACES } from "@/data/face-videos";
import type { Db, FaceSpec, Recipe } from "../models";

// Face = one of the face videos (data/face-videos.ts). Pure helpers shared by validation, the editor and the sim.

const NAMES = new Set<string>(FACE_NAMES);

/** A known video name or "auto"; old drawn-face presets map to their video; anything else → null. */
export function faceName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (NAMES.has(raw)) return raw;
  return LEGACY_FACES[raw] ?? null;
}

/** Old saved faces ({ preset, tokens, keys: [{ t, tokens }] }) → { preset, keys: [{ t, preset }] }. */
export function migrateFace(face: unknown): FaceSpec {
  const f = (face ?? {}) as { preset?: unknown; keys?: unknown };
  const preset = f.preset === "" ? "" : faceName(f.preset) ?? FACE_AUTO;
  const keys = Array.isArray(f.keys)
    ? f.keys.flatMap((k: { t?: unknown; preset?: unknown }) =>
        typeof k?.t === "number" ? [{ t: k.t, preset: faceName(k.preset) ?? (preset || FACE_AUTO) }] : [],
      )
    : [];
  return keys.length ? { preset, keys } : { preset };
}

/** The face at time t: the last key at or before t, else the base face. */
export function faceAtTime(face: FaceSpec, t: number): string {
  let name = face.preset;
  for (const k of face.keys ?? []) if (k.t <= t + 1e-6) name = k.preset;
  return name;
}

const VIDEOS = FACE_VIDEOS as Record<string, { file: string; label: string }>;

/** "Smile", or "Auto" for the per-behavior video. */
export function faceLabel(name: string): string {
  return VIDEOS[name]?.label ?? FACE_AUTO_LABEL;
}

/** The mp4 for a face; "auto" previews the neutral video (what plays between behaviors). */
export function faceVideoUrl(name: string): string {
  return FACE_DIR + (VIDEOS[name] ?? FACE_VIDEOS.neutral).file;
}

type FaceHolder = { face: FaceSpec; motion: { recipe: Recipe }; history?: FaceHolder[] };

function migrateRecipe(recipe: Recipe): void {
  for (const step of recipe.steps) {
    if (step.face === undefined) continue;
    const name = faceName(step.face);
    if (name) step.face = name;
    else delete step.face;
  }
}

function migrateHolder(e: FaceHolder): void {
  e.face = migrateFace(e.face);
  migrateRecipe(e.motion.recipe);
  e.history?.forEach(migrateHolder);
}

/** Repo load migration: drawn-face tokens and presets saved before the video-only face → face video names. */
export function migrateDbFaces(db: Db): void {
  db.expressions.forEach(migrateHolder);
  db.library.forEach(migrateHolder);
  for (const m of db.userData) migrateRecipe(m.preview);
}
