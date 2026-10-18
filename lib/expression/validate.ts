// Validation every LLM output passes through before it reaches the simulator (docs/conventions.md rule 11):
// allow lists, range clamps, joint limits, angular velocity. Each change is reported.

import { SIM_BEHAVIORS } from "@/data/sim-behaviors";
import { BEHAVIORS as BEHAVIOR_LIST } from "../sim/behaviors";
import { SOUND_CUES, cueAt } from "@/data/sound-cues";
import { FACE_AUTO } from "@/data/face-videos";
import { faceName } from "./face";
import type { Clip, FaceSpec, Key, Recipe, RecipeStep, SoundCue, Structure } from "../models";
import type { PlaybackParams } from "../sim/params";
import { reduceTrack, MAX_KEYS } from "./clip";
import { MAX_DEG_PER_S, jointIds, rangeOf, sampleRecipe } from "./sample";

export interface Issue {
  field: string;
  message: string;
}

const clampTo = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const BEHAVIORS = new Set<string>(SIM_BEHAVIORS.map((c) => c.id));

export const RECIPE_LIMITS = { steps: 6, speed: [0.5, 1.5], amplitude: [0.3, 1.3], repeat: [1, 3], minVelocitySpeed: 0.2, maxSeconds: 15 } as const;

// ---------------------------------------------------------------- recipe

function overshootBySteps(recipe: Recipe, params: PlaybackParams, structure: Structure): Set<number> {
  const bad = new Set<number>();
  const ids = jointIds(structure);
  for (const f of sampleRecipe(recipe, params, 30).frames) {
    for (const id of ids) {
      const [lo, hi] = rangeOf(structure, id);
      if (f.pose[id] > hi + 1e-6 || f.pose[id] < lo - 1e-6) bad.add(f.step);
    }
  }
  return bad;
}

const allowanceCache = new Map<string, number>();

/** max(120°/s, the behavior's own peak at speed 1 / amplitude 1 / default params). */
export function velocityAllowance(behavior: string, structure: Structure): number {
  const key = `${behavior}|${structure.joints.map((j) => `${j.min},${j.max}`).join(";")}`;
  let v = allowanceCache.get(key);
  if (v === undefined) {
    v = Math.max(MAX_DEG_PER_S, stepVelocities({ steps: [{ behavior, speed: 1, amplitude: 1, repeat: 1 }] }, {}, structure)[0] * 1.02);
    allowanceCache.set(key, v);
  }
  return v;
}

/** Peak angular velocity per step, in real time (°/s). */
export function stepVelocities(recipe: Recipe, params: PlaybackParams, structure: Structure): number[] {
  const { frames } = sampleRecipe(recipe, params, 60);
  const peaks = recipe.steps.map(() => 0);
  const ids = jointIds(structure);
  for (let i = 1; i < frames.length; i++) {
    const dt = frames[i].t - frames[i - 1].t;
    if (dt <= 0) continue;
    for (const id of ids) {
      const v = Math.abs(frames[i].pose[id] - frames[i - 1].pose[id]) / dt;
      if (v > peaks[frames[i].step]) peaks[frames[i].step] = v;
    }
  }
  return peaks;
}

/**
 * Allow list → clamps → amplitude pre-clamp into the structure range (STEP 0 decision)
 * → angular velocity ≤ 120°/s by slowing the step (stretch time, never cut values).
 */
export function validateRecipe(input: { steps: Partial<RecipeStep>[]; loop?: boolean }, structure: Structure, params: PlaybackParams = {}): { recipe: Recipe; issues: Issue[] } {
  const issues: Issue[] = [];
  let steps: RecipeStep[] = [];
  input.steps.forEach((s, i) => {
    if (!s.behavior || !BEHAVIORS.has(s.behavior)) {
      issues.push({ field: `steps[${i}].behavior`, message: `Dropped unknown behavior "${s.behavior ?? ""}"` });
      return;
    }
    const step: RecipeStep = {
      behavior: s.behavior,
      speed: clampTo(Number.isFinite(s.speed) ? s.speed! : 1, ...RECIPE_LIMITS.speed),
      amplitude: clampTo(Number.isFinite(s.amplitude) ? s.amplitude! : 1, ...RECIPE_LIMITS.amplitude),
      repeat: clampTo(Math.round(Number.isFinite(s.repeat) ? s.repeat! : 1), ...RECIPE_LIMITS.repeat),
    };
    if (s.face) {
      const face = faceName(s.face);
      if (face) step.face = face;
      else issues.push({ field: `steps[${i}].face`, message: `Dropped unknown face video "${s.face}"` });
    }
    for (const k of ["speed", "amplitude", "repeat"] as const) {
      if (s[k] !== undefined && step[k] !== s[k]) issues.push({ field: `steps[${i}].${k}`, message: `${k} ${s[k]} → ${step[k]}` });
    }
    steps.push(step);
  });
  if (steps.length > RECIPE_LIMITS.steps) {
    issues.push({ field: "steps", message: `Kept the first ${RECIPE_LIMITS.steps} of ${steps.length} steps` });
    steps = steps.slice(0, RECIPE_LIMITS.steps);
  }
  if (steps.length === 0) {
    issues.push({ field: "steps", message: "No valid steps — using idle" });
    steps = [{ behavior: "idle", speed: 1, amplitude: 1, repeat: 1 }];
  }
  let recipe: Recipe = { steps, ...(input.loop !== undefined ? { loop: input.loop } : {}) };
  recipe = capDuration(recipe, params, issues, true);

  // Amplitude pre-clamp: shrink each overshooting step until the whole recipe fits.
  for (const i of overshootBySteps(recipe, params, structure)) {
    const original = recipe.steps[i].amplitude;
    let lo = 0;
    let hi = original;
    for (let iter = 0; iter < 10; iter++) {
      const mid = (lo + hi) / 2;
      const trial = { ...recipe, steps: recipe.steps.map((s, j) => (j === i ? { ...s, amplitude: mid } : s)) };
      if (overshootBySteps(trial, params, structure).has(i)) hi = mid;
      else lo = mid;
    }
    const amplitude = Math.floor(lo * 100) / 100;
    recipe = { ...recipe, steps: recipe.steps.map((s, j) => (j === i ? { ...s, amplitude } : s)) };
    issues.push({ field: `steps[${i}].amplitude`, message: `amplitude ${original} → ${amplitude} to stay within joint limits` });
  }

  // Angular velocity: slow the step down (stretch time). The library's own snaps (doze waking,
  // alert, happy) are allowed at their authored speed; the model may not make anything faster.
  stepVelocities(recipe, params, structure).forEach((v, i) => {
    const allowed = velocityAllowance(recipe.steps[i].behavior, structure);
    if (v <= allowed) return;
    const original = recipe.steps[i].speed;
    const speed = Math.max(RECIPE_LIMITS.minVelocitySpeed, Math.floor(original * (allowed / v) * 0.97 * 100) / 100);
    recipe = { ...recipe, steps: recipe.steps.map((s, j) => (j === i ? { ...s, speed } : s)) };
    issues.push({ field: `steps[${i}].speed`, message: `speed ${original} → ${speed} (peak ${Math.round(v)}°/s > ${Math.round(allowed)}°/s)` });
  });
  // Slowing steps can push the length back over the cap: drop trailing steps only.
  recipe = capDuration(recipe, params, issues, false);
  return { recipe, issues };
}

const recipeSeconds = (recipe: Recipe, params: PlaybackParams) => sampleRecipe(recipe, params, 10).duration;

const LOOPING = new Set<string>(SIM_BEHAVIORS.map((c) => c.id).filter((id) => BEHAVIOR_LIST.find((b) => b.name === id)?.loop));

/**
 * Keep the recipe ≤ 15 s. Looping behaviors run 5–13 s per cycle, so small models'
 * "repeat: 3" on idle would play for most of a minute. In order:
 *  1. repeat → 1, longest step first   2. looping steps slower than 1× → 1×
 *  3. drop later duplicates of a behavior   4. drop the longest step (keeping one)
 * The second pass (after velocity fixes) only runs step 4.
 */
function capDuration(recipe: Recipe, params: PlaybackParams, issues: Issue[], full: boolean): Recipe {
  const max = RECIPE_LIMITS.maxSeconds;
  let out = recipe;
  const over = () => recipeSeconds(out, params) > max;
  const alone = (st: RecipeStep) => recipeSeconds({ steps: [st] }, params);
  const longest = (filter: (st: RecipeStep) => boolean) =>
    out.steps.reduce((best, st, i) => (filter(st) && (best < 0 || alone(st) > alone(out.steps[best])) ? i : best), -1);
  const setStep = (i: number, patch: Partial<RecipeStep>) => (out = { ...out, steps: out.steps.map((st, j) => (j === i ? { ...st, ...patch } : st)) });

  if (full) {
    while (over()) {
      const i = longest((st) => st.repeat > 1);
      if (i < 0) break;
      issues.push({ field: `steps[${i}].repeat`, message: `repeat ${out.steps[i].repeat} → 1 (recipe over ${max}s)` });
      setStep(i, { repeat: 1 });
    }
    out.steps.forEach((st, i) => {
      if (!over() || !LOOPING.has(st.behavior) || st.speed >= 1) return;
      issues.push({ field: `steps[${i}].speed`, message: `speed ${st.speed} → 1 (looping behavior, recipe over ${max}s)` });
      setStep(i, { speed: 1 });
    });
    for (let i = out.steps.length - 1; i > 0 && over(); i--) {
      const behavior = out.steps[i].behavior;
      if (!out.steps.slice(0, i).some((st) => st.behavior === behavior)) continue;
      issues.push({ field: "steps", message: `Dropped repeated "${behavior}" (recipe over ${max}s)` });
      out = { ...out, steps: out.steps.filter((_, j) => j !== i) };
    }
  }
  while (over() && out.steps.length > 1) {
    const i = longest(() => true);
    issues.push({ field: "steps", message: `Dropped "${out.steps[i].behavior}", the longest step (recipe over ${max}s)` });
    out = { ...out, steps: out.steps.filter((_, j) => j !== i) };
  }
  return out;
}

// ---------------------------------------------------------------- clip (Tier 2 / timeline edits)

/** Peak slope of an easing relative to linear (for the velocity check between keys). */
const EASE_PEAK: Record<Key["easing"], number> = {
  linear: 1, ease_in_out: Math.PI / 2, ease_in: 2, ease_out: 2, ease_out_back: 2.7, ease_out_elastic: 4, ease_out_bounce: 3,
};

export const CLIP_LIMITS = { minDuration: 1, maxDuration: 8, maxKeys: MAX_KEYS } as const;

/** Clamp to the structure, stretch time where a segment exceeds 120°/s, length 1–8 s, ≤ 24 keys per track. */
export function validateClip(clip: Clip, structure: Structure): { clip: Clip; issues: Issue[] } {
  const issues: Issue[] = [];
  const ids = new Set(jointIds(structure));
  let tracks: Clip["tracks"] = {};
  for (const [id, keys] of Object.entries(clip.tracks)) {
    if (!ids.has(id)) {
      issues.push({ field: `tracks.${id}`, message: `Dropped track for unknown joint ${id}` });
      continue;
    }
    const [lo, hi] = rangeOf(structure, id);
    tracks[id] = [...keys].sort((a, b) => a.t - b.t).map((k) => {
      const value = clampTo(k.value, lo, hi);
      if (value !== k.value) issues.push({ field: `tracks.${id}`, message: `${k.value.toFixed(1)}° → ${value.toFixed(1)}° at ${k.t.toFixed(2)}s (joint range)` });
      return { ...k, value };
    });
  }

  // Velocity: every track segment a→b needs |Δ|·easePeak / 120 seconds. Each interval between
  // consecutive key times (across all tracks) is stretched by the largest factor among the
  // track segments covering it, so tracks stay in sync.
  const times = [...new Set(Object.values(tracks).flatMap((ks) => ks.map((k) => k.t)))].sort((a, b) => a - b);
  const factors = times.slice(1).map(() => 1);
  for (const ks of Object.values(tracks)) {
    for (let i = 1; i < ks.length; i++) {
      const a = ks[i - 1];
      const b = ks[i];
      const span = b.t - a.t;
      if (span <= 0) continue;
      const factor = (Math.abs(b.value - a.value) * EASE_PEAK[a.easing]) / MAX_DEG_PER_S / span;
      if (factor <= 1 + 1e-9) continue;
      times.forEach((t, j) => {
        if (j > 0 && times[j - 1] >= a.t && t <= b.t) factors[j - 1] = Math.max(factors[j - 1], factor);
      });
    }
  }
  const remap = new Map<number, number>();
  let extra = 0;
  times.forEach((t, j) => {
    if (j > 0) {
      const gap = t - times[j - 1];
      const added = gap * (factors[j - 1] - 1);
      if (added > 1e-9) {
        issues.push({ field: "timing", message: `Stretched ${times[j - 1].toFixed(2)}–${t.toFixed(2)}s by ${added.toFixed(2)}s (≤ ${MAX_DEG_PER_S}°/s)` });
        extra += added;
      }
    }
    remap.set(t, t + extra);
  });
  if (extra > 0) {
    tracks = Object.fromEntries(Object.entries(tracks).map(([id, ks]) => [id, ks.map((k) => ({ ...k, t: Math.round((remap.get(k.t) ?? k.t) * 1000) / 1000 }))]));
  }
  let duration = clip.duration + extra;

  if (duration > CLIP_LIMITS.maxDuration) {
    issues.push({ field: "duration", message: `Trimmed ${duration.toFixed(2)}s to ${CLIP_LIMITS.maxDuration}s` });
    duration = CLIP_LIMITS.maxDuration;
    tracks = Object.fromEntries(Object.entries(tracks).map(([id, ks]) => [id, ks.filter((k) => k.t <= duration)]));
  }
  if (duration < CLIP_LIMITS.minDuration) {
    issues.push({ field: "duration", message: `Extended ${duration.toFixed(2)}s to ${CLIP_LIMITS.minDuration}s` });
    duration = CLIP_LIMITS.minDuration;
  }
  for (const [id, ks] of Object.entries(tracks)) {
    if (ks.length <= CLIP_LIMITS.maxKeys) continue;
    issues.push({ field: `tracks.${id}`, message: `Simplified ${ks.length} keys to ≤ ${CLIP_LIMITS.maxKeys}` });
    tracks[id] = reduceTrack(ks.map((k) => ({ t: k.t, v: k.value })));
  }
  return { clip: { ...clip, duration: Math.round(duration * 1000) / 1000, tracks }, issues };
}

// ---------------------------------------------------------------- face & sound

/** The face must be one of the face videos (or "auto"); anything else falls back to auto. */
export function validateFace(spec: { preset: string }): { face: FaceSpec; issues: Issue[] } {
  const preset = faceName(spec.preset);
  if (preset) return { face: { preset }, issues: [] };
  return { face: { preset: FACE_AUTO }, issues: [{ field: "face.preset", message: `Unknown face video "${spec.preset}" → ${FACE_AUTO}` }] };
}

const CUES = new Set(SOUND_CUES.map((c) => c.id));

/** Allow-listed cues placed in [0, duration], capped by the signature's density, pitched by its pitch. */
export function validateSound(
  cues: { preset: string; t: number }[],
  opts: { duration: number; maxCues?: number; pitchSt?: number },
): { cues: SoundCue[]; issues: Issue[] } {
  const issues: Issue[] = [];
  const out: SoundCue[] = [];
  cues.forEach((c, i) => {
    if (!CUES.has(c.preset)) return issues.push({ field: `sound.cues[${i}]`, message: `Dropped unknown sound "${c.preset}"` });
    const t = clampTo(Number.isFinite(c.t) ? c.t : 0, 0, Math.max(opts.duration - 0.1, 0));
    if (t !== c.t) issues.push({ field: `sound.cues[${i}].t`, message: `t ${c.t} → ${t.toFixed(2)}` });
    const cue = cueAt(c.preset, Math.round(t * 100) / 100, `cue-${i + 1}`);
    out.push({ ...cue, pitchSt: Math.round((cue.pitchSt + (opts.pitchSt ?? 0)) * 10) / 10 });
  });
  const max = opts.maxCues ?? 4;
  if (out.length > max) {
    issues.push({ field: "sound.cues", message: `Kept ${max} of ${out.length} cues (signature density)` });
    out.splice(max);
  }
  return { cues: out.sort((a, b) => a.t - b.t), issues };
}

// ---------------------------------------------------------------- names

const ROBOT_WORDS = /\b(pure\s*desk|purebot|pure|robot|bot|lelamp)\b/gi;

/** Small models write identifiers ("sunshine_morning"): make it 2–4 plain words. */
export function sanitizeName(name: string, fallbackFrom = ""): string {
  const words = name.replace(/[_\-./]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(ROBOT_WORDS, " ").replace(/[^\w\s']/g, " ").split(/\s+/).filter(Boolean).slice(0, 4);
  if (words.length === 0) return suggestName(fallbackFrom);
  const text = words.join(" ").toLowerCase();
  return text[0].toUpperCase() + text.slice(1);
}

const STOP = new Set(["i'm", "im", "i", "am", "so", "the", "a", "an", "and", "my", "me", "is", "it", "that", "this", "very", "just", "keep", "really", "because", "of", "to", "in", "on", "today"]);

export function suggestName(currentStatus: string): string {
  const words = currentStatus.toLowerCase().replace(/[^\w\s']/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)).slice(0, 2);
  if (words.length === 0) return "New expression";
  const text = words.join(" ");
  return text[0].toUpperCase() + text.slice(1);
}
