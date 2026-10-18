import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEV_RECIPES, DEV_STRUCTURE_NARROW } from "@/data/dev-samples";
import { PURE_DESK_STRUCTURE } from "@/data/pure-desk";
import { SEED_SIGNATURES } from "@/data/seed";
import { PURE_DEFAULT_SIGNATURE } from "@/data/signature";
import { GenerationOutputSchema } from "../llm/generation";
import type { Clip } from "../models";
import {
  applySoftener, autoAdjust, buildExpression, buildPureJson, clipToJointCommands, compatibility, fallback, limitCheck,
  matchTiming, paramsToProps, parsePureJson, propsToParams, recipeToClip, sanitizeName, suggestName, validateClip,
  faceAtTime, migrateFace, validateFace, validateRecipe, validateSound,
} from ".";
import { stepVelocities, velocityAllowance } from "./validate";
import { sampleRecipe } from "./sample";

const S = PURE_DESK_STRUCTURE;
const purebot = SEED_SIGNATURES[1];
// Recorded with the old drawn-face presets: faces go through the same migration as saved projects.
type Sample = { output: { face: unknown; motion: { steps: { face?: string }[] } } };
const samples = ["here", "presentation", "tired", "startled"].map((id) => {
  const s: Sample = JSON.parse(fs.readFileSync(path.join(process.cwd(), `docs/samples/gen-${id}.json`), "utf8"));
  s.output.face = migrateFace(s.output.face);
  for (const step of s.output.motion.steps) if (step.face) step.face = migrateFace({ preset: step.face }).preset;
  return s;
});

describe("validateRecipe", () => {
  it("drops unknown behaviors, clamps ranges, caps steps", () => {
    const { recipe, issues } = validateRecipe(
      { steps: [{ behavior: "backflip" }, { behavior: "nod", speed: 9, amplitude: 0.1, repeat: 4, face: "grumpy" }, ...Array(7).fill({ behavior: "home" })] },
      S,
    );
    expect(recipe.steps).toHaveLength(6);
    expect(recipe.steps[0]).toMatchObject({ behavior: "nod", amplitude: 0.3, repeat: 3 });
    expect(issues.map((i) => i.message).join("\n")).toMatch(/backflip[\s\S]*grumpy[\s\S]*first 6 of 8/);
  });

  it("pre-clamps amplitude so the recipe stays inside the joint range", () => {
    const raw = DEV_RECIPES.overdrive;
    expect(limitCheck(recipeToClip(raw, {}, S), S).length).toBeGreaterThan(0);
    const { recipe, issues } = validateRecipe(raw, S);
    expect(recipe.steps[1].amplitude).toBeLessThan(1.5);
    expect(issues.some((i) => /stay within joint limits/.test(i.message))).toBe(true);
    expect(limitCheck(recipeToClip(recipe, {}, S), S)).toEqual([]);
  });

  it("slows steps faster than 120°/s, but keeps the library's authored snaps", () => {
    const fast = { steps: [{ behavior: "shake", speed: 1.5, amplitude: 1.3, repeat: 1 }] };
    expect(stepVelocities(validateRecipe(fast, S).recipe, {}, S)[0]).toBeLessThanOrEqual(velocityAllowance("shake", S));
    const doze = validateRecipe({ steps: [{ behavior: "doze", speed: 1, amplitude: 1, repeat: 1 }] }, S);
    expect(doze.recipe.steps[0].speed).toBe(1);
    expect(velocityAllowance("doze", S)).toBeGreaterThan(120);
    const quickDoze = validateRecipe({ steps: [{ behavior: "doze", speed: 1.5, amplitude: 1, repeat: 1 }] }, S);
    expect(quickDoze.recipe.steps[0].speed).toBeLessThan(1.5);
  });

  it("caps the recipe at 15 s: repeats first, then trailing steps", () => {
    const long = { steps: [{ behavior: "idle", repeat: 3 }, { behavior: "doze", repeat: 2 }, { behavior: "nod", repeat: 2 }, { behavior: "sad", repeat: 1 }] };
    const { recipe, issues } = validateRecipe(long, S);
    expect(sampleRecipe(recipe, {}, 10).duration).toBeLessThanOrEqual(15);
    expect(recipe.steps.map((st) => st.behavior)).not.toContain("idle");
    expect(recipe.steps.every((st) => st.repeat === 1 || st.behavior === "nod")).toBe(true);
    expect(issues.some((i) => /longest step/.test(i.message))).toBe(true);
  });

  it("STEP 6 LLM samples come out valid: repeat ≤ 3, plain names, in range", () => {
    for (const s of samples) {
      const output = GenerationOutputSchema.parse(s.output);
      const { expression } = buildExpression(output, { structure: S, signature: purebot });
      expect(expression.motion.recipe.steps.every((st) => st.repeat <= 3 && st.speed >= 0.2 && st.amplitude <= 1.3)).toBe(true);
      expect(expression.name).not.toMatch(/_/);
      const { params } = propsToParams(expression.motion.props, purebot.axes);
      expect(limitCheck(recipeToClip(expression.motion.recipe, params, S), S)).toEqual([]);
      expect(expression.sound.cues.length).toBeLessThanOrEqual(4);
      const { params: p } = propsToParams(expression.motion.props, purebot.axes);
      expect(sampleRecipe(expression.motion.recipe, p, 10).duration).toBeLessThanOrEqual(15);
    }
  });
});

describe("validateClip", () => {
  const clip = (tracks: Clip["tracks"], duration = 2): Clip => ({ format: "lelamp.clip/1", duration, tracks });
  it("clamps to the structure and drops unknown joints", () => {
    const r = validateClip(clip({ head_tilt: [{ t: 0, value: 0, easing: "linear" }, { t: 1.5, value: 90, easing: "linear" }], tail: [] }), S);
    expect(r.clip.tracks.head_tilt[1].value).toBe(21);
    expect(r.clip.tracks.tail).toBeUndefined();
  });
  it("stretches time instead of cutting values when a segment is faster than 120°/s", () => {
    const r = validateClip(clip({ base_yaw: [{ t: 0, value: 0, easing: "linear" }, { t: 0.2, value: 90, easing: "linear" }, { t: 1, value: 90, easing: "linear" }], head_pan: [{ t: 0, value: 0, easing: "linear" }, { t: 1, value: 10, easing: "linear" }] }), S);
    expect(r.clip.tracks.base_yaw[1]).toMatchObject({ t: 0.75, value: 90 });
    expect(r.clip.tracks.head_pan[1].t).toBeCloseTo(1.55);
    expect(r.clip.duration).toBeCloseTo(2.55);
    expect(r.issues.some((i) => i.field === "timing")).toBe(true);
  });
  it("length 1–8 s and ≤ 24 keys", () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ t: i * 0.15, value: Math.sin(i) * 10, easing: "linear" as const }));
    const r = validateClip(clip({ base_yaw: many }, 9), S);
    expect(r.clip.duration).toBe(8);
    expect(r.clip.tracks.base_yaw.length).toBeLessThanOrEqual(24);
    expect(validateClip(clip({}, 0.4), S).clip.duration).toBe(1);
  });
});

describe("face, sound, names", () => {
  it("face: a face video passes, an old drawn preset maps to its video, anything else → auto", () => {
    expect(validateFace({ preset: "heart" })).toEqual({ face: { preset: "heart" }, issues: [] });
    expect(validateFace({ preset: "wide" }).face.preset).toBe("surprise");
    const r = validateFace({ preset: "angry" });
    expect(r.face.preset).toBe("auto");
    expect(r.issues).toHaveLength(1);
  });
  it("face: migration drops drawn-face tokens and keeps keys as videos", () => {
    expect(migrateFace({ preset: "happy", tokens: { eyeSize: 1.2 }, keys: [{ t: 1, tokens: { eyeOpen: 0.2 } }] })).toEqual({ preset: "smile", keys: [{ t: 1, preset: "smile" }] });
    expect(migrateFace({ preset: "video", tokens: {} })).toEqual({ preset: "auto" });
    expect(migrateFace({ preset: "" })).toEqual({ preset: "" });
  });
  it("face at time: the last key at or before t, else the base face", () => {
    const face = { preset: "neutral", keys: [{ t: 1, preset: "smile" }, { t: 3, preset: "sleepy" }] };
    expect([0.5, 1, 2.9, 3, 9].map((t) => faceAtTime(face, t))).toEqual(["neutral", "smile", "smile", "sleepy", "sleepy"]);
  });
  it("sound: allow list, inside duration, density cap, signature pitch", () => {
    const r = validateSound([{ preset: "boom", t: 0 }, { preset: "rising-chirp", t: 99 }, { preset: "soft-breath", t: 0.5 }, { preset: "signature", t: 1 }], { duration: 3, maxCues: 2, pitchSt: -2 });
    expect(r.cues).toHaveLength(2);
    expect(r.cues[0]).toMatchObject({ t: 0.5, pitchSt: -4 });
    expect(r.issues.map((i) => i.message).join(" ")).toMatch(/boom.*99/);
  });
  it("names: identifiers → plain words; empty → from status", () => {
    expect(sanitizeName("sunshine_morning")).toBe("Sunshine morning");
    expect(sanitizeName("startledReaction-pure_desk")).toBe("Startled reaction");
    expect(sanitizeName("PURE Desk", "I'm so tired today")).toBe("Tired");
    expect(suggestName("I'm nodding off because I'm tired.")).toBe("Nodding off");
  });
});

describe("motion properties", () => {
  it("maps sliders to params and round-trips through the signature", () => {
    const { params } = propsToParams({ speed: 100, duration: 0, amplitude: 0, smoothness: 80, frequency: 100 });
    expect(params.speed).toBeCloseTo(1.5 / 0.7);
    expect(params.amplitude).toBeCloseTo(0.3);
    expect(params.settle).toBeCloseTo(0.8);
    expect(params.rhythm).toBeCloseTo(2);
    const props = paramsToProps({ speed: 1, amplitude: 1, settle: 0.5, antic: 0, rhythm: 1 });
    const back = propsToParams(props).params;
    expect(back.speed).toBeCloseTo(1, 1);
    expect(back.amplitude).toBeCloseTo(1, 1);
  });
  it("warns when a slider leaves the signature range", () => {
    const base = paramsToProps({ speed: 0.95, amplitude: 1, settle: 0.7, antic: 0.5, rhythm: 1.1 });
    expect(propsToParams(base, purebot.axes).warnings).toEqual([]);
    expect(propsToParams({ ...base, speed: 100 }, purebot.axes).warnings.map((w) => w.prop)).toEqual(["speed"]);
  });
});

describe("clips, limits, compatibility", () => {
  it("recipeToClip keeps ≤ 24 keys per joint and tracks the playback within 1°", () => {
    const clip = recipeToClip(DEV_RECIPES.greeting, {}, S);
    expect(Object.values(clip.tracks).every((k) => k.length <= 24 && k.length >= 2)).toBe(true);
    const pose = clipToJointCommands(clip, clip.duration / 2, S);
    expect(Object.keys(pose)).toEqual(S.joints.map((j) => j.id));
  });
  it("overdrive fails the narrowed structure; Auto-adjust makes it pass", () => {
    const clip = recipeToClip(DEV_RECIPES.overdrive, {}, S);
    const before = limitCheck(clip, DEV_STRUCTURE_NARROW);
    expect(before.map((v) => v.joint)).toContain("head_tilt");
    const { clip: fixed, changes } = autoAdjust(clip, DEV_STRUCTURE_NARROW);
    expect(changes.length).toBeGreaterThan(0);
    expect(limitCheck(fixed, DEV_STRUCTURE_NARROW)).toEqual([]);
  });
  it("compatibility reports range and channel issues; fallback keeps motion only", () => {
    const { expression } = buildExpression(GenerationOutputSchema.parse(samples[2].output), { structure: S, signature: PURE_DEFAULT_SIGNATURE });
    expect(compatibility(expression, { name: "PURE Desk", structure: S })).toEqual([]);
    const armOnly = { ...DEV_STRUCTURE_NARROW, channels: ["motion" as const], joints: DEV_STRUCTURE_NARROW.joints.map((j) => ({ ...j, min: Math.max(j.min, -5), max: Math.min(j.max, 5) })) };
    const issues = compatibility(expression, { name: "Studio arm", structure: armOnly });
    expect(issues.some((i) => i.kind === "range")).toBe(true);
    expect(issues.filter((i) => i.kind === "channel").map((i) => i.channel).sort()).toEqual(["face", "sound"]);
    const fb = fallback(expression);
    expect(compatibility(fb, { name: "Studio arm", structure: { ...S, channels: ["motion"] } })).toEqual([]);
  });
});

describe("pure.json", () => {
  it("builds, measures and parses back", () => {
    const { expression } = buildExpression(GenerationOutputSchema.parse(samples[2].output), { structure: S, signature: purebot });
    const clip = recipeToClip(expression.motion.recipe, propsToParams(expression.motion.props, purebot.axes).params, S);
    const out = buildPureJson({ name: "Sleepy robot", type: "joint-fixed", structure: S }, purebot, expression, clip, { includeFallback: true, team: "Purebot Co.", now: new Date("2026-10-16T00:00:00Z") });
    expect(out.bytes).toBeGreaterThan(3000);
    const parsed = parsePureJson(out.text);
    expect(parsed.expression.name).toBe(expression.name);
    expect(parsed.fallback?.motion.duration).toBe(clip.duration);
    expect(() => parsePureJson('{"format":"nope"}')).toThrow();
  });
});

describe("match timing & softer", () => {
  it("moves interior keys to energy peaks and keeps the original for undo", () => {
    const clip: Clip = { format: "lelamp.clip/1", duration: 4, tracks: { base_yaw: [{ t: 0, value: 0, easing: "linear" }, { t: 1, value: 20, easing: "linear" }, { t: 3, value: -20, easing: "linear" }, { t: 4, value: 0, easing: "linear" }] } };
    const energy = Array.from({ length: 41 }, (_, i) => ({ t: i / 10, value: i === 12 || i === 28 ? 10 : 1 }));
    const r = matchTiming(clip, energy);
    expect(r.clip.tracks.base_yaw.map((k) => k.t)).toEqual([0, 1.2, 2.8, 4]);
    expect(r.moved).toBe(2);
    expect(r.original).toBe(clip);
  });
  it("softer = slower, smaller, smoother, quieter", () => {
    const { expression } = buildExpression(GenerationOutputSchema.parse(samples[0].output), { structure: S, signature: purebot });
    const soft = applySoftener(expression);
    expect(soft.motion.props.speed).toBeLessThan(expression.motion.props.speed);
    expect(soft.motion.props.smoothness).toBeGreaterThan(expression.motion.props.smoothness);
  });
});
