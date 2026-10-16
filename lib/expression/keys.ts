import type { Clip, FaceSpec, Key, Structure } from "../models";

type Easing = Key["easing"];
import { CLIP_FPS } from "./clip";
import { sampleModelClip } from "./sample";

// W02E timeline edits on model clips and face keys. Pure: every function returns a new value.

const round3 = (v: number) => Math.round(v * 1000) / 1000;

/** Snap to the 30 fps grid, inside [0, duration]. */
export function snapTime(t: number, duration: number): number {
  return round3(Math.min(Math.max(Math.round(t * CLIP_FPS) / CLIP_FPS, 0), duration));
}

/** "00:01.25" */
export function formatTime(t: number): string {
  const s = Math.max(0, t);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${(s - m * 60).toFixed(2).padStart(5, "0")}`;
}

export function clampToJoint(value: number, joint: string, structure: Structure): number {
  const j = structure.joints.find((x) => x.id === joint);
  return round3(j ? Math.min(Math.max(value, j.min), j.max) : value);
}

function withTrack(clip: Clip, joint: string, keys: Key[]): Clip {
  return { ...clip, tracks: { ...clip.tracks, [joint]: keys } };
}

/** +Keyframe at the playhead: the value is what the clip plays there; an existing key on that frame is reused. */
export function addKey(clip: Clip, joint: string, t: number, structure: Structure, easing: Easing = "ease_in_out"): { clip: Clip; index: number } {
  const time = snapTime(t, clip.duration);
  const keys = clip.tracks[joint] ?? [];
  const existing = keys.findIndex((k) => Math.abs(k.t - time) < 1 / (2 * CLIP_FPS));
  if (existing >= 0) return { clip, index: existing };
  const value = clampToJoint(sampleModelClip(clip, time, [joint])[joint] ?? 0, joint, structure);
  const next = [...keys, { t: time, value, easing }].sort((a, b) => a.t - b.t);
  return { clip: withTrack(clip, joint, next), index: next.findIndex((k) => k.t === time) };
}

/** Drag / inspector edit. Time stays between its neighbours (one frame apart); value stays inside the structure range. */
export function updateKey(clip: Clip, joint: string, index: number, patch: Partial<Key>, structure: Structure): Clip {
  const keys = clip.tracks[joint];
  if (!keys?.[index]) return clip;
  const frame = 1 / CLIP_FPS;
  const lo = index > 0 ? keys[index - 1].t + frame : 0;
  const hi = index < keys.length - 1 ? keys[index + 1].t - frame : clip.duration;
  const k = keys[index];
  const next: Key = {
    t: patch.t === undefined ? k.t : Math.min(Math.max(snapTime(patch.t, clip.duration), round3(lo)), round3(hi)),
    value: patch.value === undefined ? k.value : clampToJoint(patch.value, joint, structure),
    easing: patch.easing ?? k.easing,
  };
  return withTrack(clip, joint, keys.map((x, i) => (i === index ? next : x)));
}

/** Delete keeps at least one key per track. */
export function deleteKey(clip: Clip, joint: string, index: number): Clip {
  const keys = clip.tracks[joint];
  if (!keys || keys.length <= 1 || !keys[index]) return clip;
  return withTrack(clip, joint, keys.filter((_, i) => i !== index));
}

// ---------------------------------------------------------------- face keys

export function addFaceKey(face: FaceSpec, t: number, duration: number, tokens: FaceSpec["tokens"]): { face: FaceSpec; index: number } {
  const time = snapTime(t, duration);
  const keys = face.keys ?? [];
  const existing = keys.findIndex((k) => Math.abs(k.t - time) < 1 / (2 * CLIP_FPS));
  if (existing >= 0) return { face, index: existing };
  const next = [...keys, { t: time, tokens: { ...tokens } }].sort((a, b) => a.t - b.t);
  return { face: { ...face, keys: next }, index: next.findIndex((k) => k.t === time) };
}

export function moveFaceKey(face: FaceSpec, index: number, t: number, duration: number): FaceSpec {
  const keys = face.keys ?? [];
  if (!keys[index]) return face;
  const frame = 1 / CLIP_FPS;
  const lo = index > 0 ? keys[index - 1].t + frame : 0;
  const hi = index < keys.length - 1 ? keys[index + 1].t - frame : duration;
  const time = Math.min(Math.max(snapTime(t, duration), round3(lo)), round3(hi));
  return { ...face, keys: keys.map((k, i) => (i === index ? { ...k, t: time } : k)) };
}

export function deleteFaceKey(face: FaceSpec, index: number): FaceSpec {
  const keys = (face.keys ?? []).filter((_, i) => i !== index);
  return { ...face, keys: keys.length ? keys : undefined };
}
