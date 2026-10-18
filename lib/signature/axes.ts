import { AXIS_INFO, AXIS_ORDER, DEFAULT_AXES, EYES_FACE, HOW_IT_MAPS_NO_PAGE, HOW_IT_MAPS_TEMPLATE, MAP_DIRECTION, PARAM_MAPPING, TONE_DICTIONARY } from "@/data/signature";
import type { FaceVideoName } from "@/data/face-videos";
import type { Axis, Signature } from "../models";
import type { PlaybackParams } from "../sim/params";

export interface ToneEvidence {
  keyword: string;
  page?: number;
  quote?: string;
}

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const lerp = ([lo, hi]: readonly [number, number], axis: number) => lo + (hi - lo) * (axis / 100);

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

/** Tone keywords → 8 axes (50 + dictionary offsets) and one "How it maps" line per moved axis. */
export function axesFromTone(tone: ToneEvidence[]): { axes: Record<Axis, number>; mapping: Signature["mapping"] } {
  const axes = { ...DEFAULT_AXES };
  const contributions: Partial<Record<Axis, { ev: ToneEvidence; offset: number }[]>> = {};
  for (const ev of tone) {
    for (const [axis, offset] of Object.entries(TONE_DICTIONARY[ev.keyword] ?? {}) as [Axis, number][]) {
      axes[axis] += offset;
      (contributions[axis] ??= []).push({ ev, offset });
    }
  }
  for (const axis of AXIS_ORDER) axes[axis] = clamp(axes[axis]);

  const mapping: Signature["mapping"] = [];
  for (const axis of AXIS_ORDER) {
    if (axes[axis] === 50) continue;
    // Credit the keyword that pushed hardest in the direction the axis actually moved.
    const up = axes[axis] > 50;
    const top = (contributions[axis] ?? [])
      .filter((c) => (up ? c.offset > 0 : c.offset < 0))
      .sort((a, b) => Math.abs(b.offset) - Math.abs(a.offset))[0];
    if (!top) continue;
    const vars = {
      keyword: top.ev.keyword,
      page: top.ev.page ?? "",
      axis: AXIS_INFO[axis].label,
      direction: axes[axis] > 50 ? MAP_DIRECTION.up : MAP_DIRECTION.down,
      value: axes[axis],
    };
    const effect = paramEffect(axis, axes[axis]);
    const sentence = fill(top.ev.page ? HOW_IT_MAPS_TEMPLATE : HOW_IT_MAPS_NO_PAGE, vars);
    mapping.push({
      axis,
      value: axes[axis],
      reason: effect ? sentence.replace(/\.$/, ` (${effect}).`) : sentence,
      ...(top.ev.page ? { page: top.ev.page } : {}),
    });
  }
  return { axes, mapping };
}

/** Short note on what an axis value does to playback, e.g. "speed ×0.99". */
export function paramEffect(axis: Axis, value: number): string | null {
  switch (axis) {
    case "tempo": return `speed ×${lerp(PARAM_MAPPING.speed, value).toFixed(2)}`;
    case "amp": return `amplitude ×${lerp(PARAM_MAPPING.amplitude, value).toFixed(2)}`;
    case "settle": return value > 66 ? "soft landing" : value < 34 ? "springy overshoot" : null;
    case "antic": return value > 0 ? `anticipation ${value}%` : null;
    case "rhythm": return `rhythm ×${lerp(PARAM_MAPPING.rhythm, value).toFixed(2)}`;
    case "eyes": return `face ${eyesFace(value)}`;
    case "pitch": return `${lerp(PARAM_MAPPING.pitchSt, value) >= 0 ? "+" : ""}${lerp(PARAM_MAPPING.pitchSt, value).toFixed(1)} st`;
    case "density": return `up to ${Math.round(lerp(PARAM_MAPPING.maxCues, value))} cues`;
  }
}

export interface SignatureParams {
  playback: Required<PlaybackParams>;
  face: { video: FaceVideoName };
  sound: { pitchSt: number; maxCues: number };
}

/** Eyes axis → the default face video. */
export function eyesFace(value: number): FaceVideoName {
  return (EYES_FACE.find(([below]) => value < below) ?? EYES_FACE[EYES_FACE.length - 1])[1];
}

/** PRD §6 rule 7: signature axes → playback parameters, default face video, sound base. */
export function signatureToParams(axes: Record<Axis, number>): SignatureParams {
  return {
    playback: {
      speed: lerp(PARAM_MAPPING.speed, axes.tempo),
      amplitude: lerp(PARAM_MAPPING.amplitude, axes.amp),
      settle: axes.settle / 100,
      antic: axes.antic / 100,
      rhythm: lerp(PARAM_MAPPING.rhythm, axes.rhythm),
    },
    face: { video: eyesFace(axes.eyes) },
    sound: { pitchSt: lerp(PARAM_MAPPING.pitchSt, axes.pitch), maxCues: Math.round(lerp(PARAM_MAPPING.maxCues, axes.density)) },
  };
}

export function compareSignatures(a: Signature, b: Signature): { axis: Axis; from: number; to: number; delta: number }[] {
  return AXIS_ORDER.map((axis) => ({ axis, from: a.axes[axis], to: b.axes[axis], delta: b.axes[axis] - a.axes[axis] }));
}
