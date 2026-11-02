import type { Channel, FaceSpec, Recipe, SoundSpec } from "../models";
import type { PlaybackParams } from "../sim/params";
import { sampleRecipe } from "./sample";
import { faceAtTime } from "./face";

/** One recipe step and the channels that are active while it plays (editor Context › Component card). */
export interface StepChannels {
  behavior: string;
  channels: Channel[];
}

/**
 * Per-step channel use, in recipe order. Motion is always on; face = the face channel is on ("auto" plays a video
 * per behavior, a fixed video with no keys, a step `face`, or a face key at or before the step ends — keys hold until
 * the next one); sound = a cue starts inside the step's time window.
 * Windows come from sampling the recipe at the playback params (the same clock as cue / face key times).
 */
export function stepChannels(recipe: Recipe, face: FaceSpec | undefined, sound: SoundSpec | undefined, params: PlaybackParams = {}): StepChannels[] {
  if (!recipe.steps.length) return [];
  const { frames, duration } = sampleRecipe(recipe, params, 20);
  const windows = recipe.steps.map(() => ({ start: Infinity, end: -Infinity }));
  for (const f of frames) {
    const w = windows[f.step];
    if (!w) continue;
    w.start = Math.min(w.start, f.t);
    w.end = Math.max(w.end, f.t);
  }
  const keys = face?.keys ?? [];
  const cues = sound?.cues ?? [];
  return recipe.steps.map((step, i) => {
    const w = windows[i];
    const last = i === recipe.steps.length - 1;
    const inside = (t: number) => Number.isFinite(w.start) && t >= w.start && (last ? t <= duration : t < w.end);
    const end = last ? duration : w.end;
    const faceOn = face !== undefined && face.preset !== "" && (face.preset === "auto" || !!step.face || keys.length === 0 || keys.some((k) => k.t < end));
    const channels: Channel[] = [];
    if (cues.some((c) => inside(c.t))) channels.push("sound");
    if (faceOn) channels.push("face");
    channels.push("motion");
    return { behavior: step.behavior, channels };
  });
}

/** Channels the whole expression uses (the card's "N Multimodal"). */
export function usedChannels(steps: { channels: Channel[] }[]): Channel[] {
  const all = new Set(steps.flatMap((s) => s.channels));
  return (["sound", "face", "motion"] as const).filter((c) => all.has(c));
}

/** Time slots per Component tile (the 4 columns of the Figma tile grid). */
export const TILE_SLOTS = 4;
/** Joints moving faster than this (summed °/s) count as motion in a slot. */
const MOTION_MIN_DEG_S = 6;

/** One Component tile: consecutive steps of the same component, with each channel's activity per time slot. */
export interface ChannelTile {
  group: string;
  behaviors: string[];
  channels: Channel[];
  /** rows[channel][slot] — the tile's time window split into TILE_SLOTS equal slots */
  rows: Record<Channel, boolean[]>;
  /** Channels in the order they first come on in the tile (ties: sound, face, motion) */
  order: Channel[];
}

/**
 * Component card tiles. Steps are grouped by `groupOf(behavior)` (consecutive only); each tile's window is cut into
 * TILE_SLOTS slots and every channel is marked where it is actually active:
 * motion = the joints move (sampled pose speed), face = the face showing then is not neutral (keys / fixed video;
 * "auto" plays the behavior's own video the whole time), sound = a cue starts in the slot.
 */
export function channelTiles(
  recipe: Recipe,
  face: FaceSpec | undefined,
  sound: SoundSpec | undefined,
  params: PlaybackParams = {},
  groupOf: (behavior: string) => string = (b) => b,
): ChannelTile[] {
  if (!recipe.steps.length) return [];
  const { frames, duration } = sampleRecipe(recipe, params, 20);
  const groups: { group: string; behaviors: string[]; steps: number[] }[] = [];
  recipe.steps.forEach((s, i) => {
    const g = groupOf(s.behavior);
    const last = groups[groups.length - 1];
    if (last && last.group === g) {
      last.behaviors.push(s.behavior);
      last.steps.push(i);
    } else groups.push({ group: g, behaviors: [s.behavior], steps: [i] });
  });
  const cues = sound?.cues ?? [];
  const faceOn = face !== undefined && face.preset !== "";
  return groups.map((g, gi) => {
    const own = frames.filter((f) => g.steps.includes(f.step));
    const start = own.length ? own[0].t : 0;
    const end = gi === groups.length - 1 ? duration : own.length ? own[own.length - 1].t : start;
    const span = Math.max(end - start, 1e-6);
    const slotOf = (t: number) => Math.min(TILE_SLOTS - 1, Math.max(0, Math.floor(((t - start) / span) * TILE_SLOTS)));
    const rows: Record<Channel, boolean[]> = {
      sound: Array(TILE_SLOTS).fill(false),
      face: Array(TILE_SLOTS).fill(false),
      motion: Array(TILE_SLOTS).fill(false),
    };
    // motion: mean joint speed per slot
    const speed = Array(TILE_SLOTS).fill(0);
    const count = Array(TILE_SLOTS).fill(0);
    for (let i = 1; i < own.length; i++) {
      const dt = own[i].t - own[i - 1].t;
      if (dt <= 0) continue;
      let d = 0;
      for (const [id, v] of Object.entries(own[i].pose)) d += Math.abs(v - (own[i - 1].pose[id] ?? v));
      const k = slotOf(own[i].t);
      speed[k] += d / dt;
      count[k] += 1;
    }
    for (let k = 0; k < TILE_SLOTS; k++) rows.motion[k] = count[k] > 0 && speed[k] / count[k] > MOTION_MIN_DEG_S;
    // face: what shows at each slot (keys hold until the next one)
    if (faceOn) {
      for (let k = 0; k < TILE_SLOTS; k++) {
        const a = start + (k / TILE_SLOTS) * span;
        const b = start + ((k + 1) / TILE_SLOTS) * span;
        const names = [faceAtTime(face, a), ...(face.keys ?? []).filter((x) => x.t > a && x.t < b).map((x) => x.preset)];
        const stepFace = g.steps.some((i) => recipe.steps[i].face && recipe.steps[i].face !== "neutral");
        rows.face[k] = names.some((n) => n !== "" && n !== "neutral") || stepFace;
      }
    }
    for (const c of cues) if (c.t >= start && (gi === groups.length - 1 ? c.t <= end : c.t < end)) rows.sound[slotOf(c.t)] = true;
    const channels = (["sound", "face", "motion"] as const).filter((c) => rows[c].some(Boolean));
    const first = (c: Channel) => rows[c].indexOf(true);
    const order = [...channels].sort((a, b) => first(a) - first(b));
    return { group: g.group, behaviors: g.behaviors, channels: [...channels], rows, order };
  });
}
