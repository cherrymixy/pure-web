import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { BEHAVIORS } from "@/lib/sim/behaviors";
import { PURE_DESK_ROBOT } from "@/lib/sim/robots";
import {
  ExpressionSchema, FaceSpecSchema, ProfileSchema, ProjectSchema, RecipeSchema, RobotDeviceSchema,
  SavedExpressionSchema, SignatureSchema, SoundCueSchema, StructureSchema, UserDataMotionSchema,
} from "@/lib/models";
import { COMPONENTS, guidelineSlugFor } from "./components";
import { SIM_BEHAVIORS } from "./sim-behaviors";
import { GUIDELINE, findEntry } from "./guideline";
import { COMPONENT_DEMOS, PROMPT_DEMOS, applySofterDemo } from "./demo-recipes";
import { FACE_NAMES } from "./face-videos";
import { SUGGESTED_PROMPTS } from "./prompts";
import { PURE_DESK_STRUCTURE } from "./pure-desk";
import { ROBOT_TYPES } from "./robot-types";
import { SEED_EXPRESSIONS, SEED_LIBRARY, SEED_PROFILE, SEED_PROJECTS, SEED_ROBOTS, SEED_SIGNATURES, SEED_USER_DATA, addMissingSeedMotions, seedDb } from "./seed";
import { CATEGORY_PATTERNS, COMMUNITY_REVIEWS, WAVEFORM_SRC, communityCard } from "./community";
import { AXIS_INFO, TONE_DICTIONARY } from "./signature";
import { SITUATION_PATTERNS } from "./patterns";
import { SOUND_CUES, cueAt } from "./sound-cues";

const behaviorNames = new Set(BEHAVIORS.map((b) => b.name));
const ok = <T,>(schema: z.ZodType<T>, value: unknown) => {
  const r = schema.safeParse(value);
  if (!r.success) throw new Error(z.prettifyError(r.error));
};

describe("content counts (PRD §5)", () => {
  it("has 5 types, 5 joints, 16 components, 15 sim behaviors, 11 patterns, 4 prompts", () => {
    expect(ROBOT_TYPES).toHaveLength(5);
    expect(ROBOT_TYPES.filter((t) => t.selectable).map((t) => t.id)).toEqual(["joint-fixed"]);
    expect(PURE_DESK_STRUCTURE.joints).toHaveLength(5);
    expect(COMPONENTS).toHaveLength(16);
    expect(SIM_BEHAVIORS).toHaveLength(15);
    expect(SITUATION_PATTERNS).toHaveLength(11);
    expect(SUGGESTED_PROMPTS).toHaveLength(4);
  });

  it("sim behaviors are exactly the simulator behaviors, and every component plays one", () => {
    expect(new Set(SIM_BEHAVIORS.map((b) => b.id))).toEqual(behaviorNames);
    for (const c of COMPONENTS) expect(behaviorNames.has(c.sim.behavior)).toBe(true);
  });
});

describe("PURE Desk structure", () => {
  it("matches robot.xml ranges and the robot joint ids", () => {
    const xml = fs.readFileSync(path.join(process.cwd(), "public/pure-desk/model/robot.xml"), "utf8");
    const ranges = [...xml.matchAll(/<joint name="(\d)"[^>]*range="([-\d.]+) ([-\d.]+)"/g)].map((m) => [Number(m[2]), Number(m[3])]);
    expect(PURE_DESK_STRUCTURE.joints.map((j) => [j.rigMin, j.rigMax])).toEqual(ranges);
    expect(PURE_DESK_STRUCTURE.joints.map((j) => j.id)).toEqual(Object.values(PURE_DESK_ROBOT.jointKeys));
    ok(StructureSchema, PURE_DESK_STRUCTURE);
  });
});

describe("demo recipes", () => {
  const demos = [...Object.values(PROMPT_DEMOS), ...Object.values(COMPONENT_DEMOS)];
  it("cover every prompt and component", () => {
    expect(Object.keys(PROMPT_DEMOS).sort()).toEqual(SUGGESTED_PROMPTS.map((p) => p.id).sort());
    expect(new Set(Object.keys(COMPONENT_DEMOS))).toEqual(behaviorNames);
  });
  it.each(demos.map((d) => [d.name, d] as const))("%s is valid", (_, d) => {
    ok(RecipeSchema, d.motion.recipe);
    ok(FaceSpecSchema, d.face);
    d.sound.cues.forEach((c) => ok(SoundCueSchema, c));
    for (const s of d.motion.recipe.steps) {
      expect(behaviorNames.has(s.behavior)).toBe(true);
      if (s.face) expect(FACE_NAMES).toContain(s.face);
    }
    expect(FACE_NAMES).toContain(d.face.preset);
  });
  it("softer variant is slower, smaller and quieter", () => {
    const soft = applySofterDemo(PROMPT_DEMOS.here);
    expect(soft.motion.recipe.steps[0].amplitude).toBeLessThan(PROMPT_DEMOS.here.motion.recipe.steps[0].amplitude);
    expect(soft.sound.cues[0].volumeDb).toBeLessThan(PROMPT_DEMOS.here.sound.cues[0].volumeDb);
  });
});

describe("signature", () => {
  it("tone dictionary only touches the 8 axes", () => {
    for (const offsets of Object.values(TONE_DICTIONARY)) {
      for (const axis of Object.keys(offsets)) expect(axis in AXIS_INFO).toBe(true);
    }
  });
  it.each(SEED_SIGNATURES.map((s) => [s.name, s] as const))("%s is valid", (_, s) => ok(SignatureSchema, s));
});

describe("seed", () => {
  it("profile, projects, robots, user data validate", () => {
    ok(ProfileSchema, SEED_PROFILE);
    expect(SEED_PROFILE.team).toHaveLength(4);
    SEED_PROJECTS.forEach((p) => ok(ProjectSchema, p));
    expect(SEED_PROJECTS.map((p) => p.name)).toEqual(["Test-01", "Sleepy robot", "Surprising", "Test- final", "Mini rover", "Pure bot - dog"]);
    SEED_ROBOTS.forEach((r) => ok(RobotDeviceSchema, r));
    SEED_USER_DATA.forEach((u) => ok(UserDataMotionSchema, u));
    // 15 behaviors + Stretch / Surprise / Fear from the Community Figma list
    expect(SEED_USER_DATA).toHaveLength(18);
    SEED_USER_DATA.forEach((u) => u.preview.steps.forEach((s) => expect(behaviorNames.has(s.behavior)).toBe(true)));
  });
  it("older databases get the new seed motions, before user uploads", () => {
    const db = seedDb();
    const upload = { ...db.userData[0], id: "ud-mine", name: "Mine", source: "user" as const };
    db.userData = [...db.userData.slice(0, 15), upload];
    addMissingSeedMotions(db);
    expect(db.userData.map((u) => u.id).slice(-4)).toEqual(["ud-stretch", "ud-surprise", "ud-fear", "ud-mine"]);
    addMissingSeedMotions(db);
    expect(db.userData).toHaveLength(19);
  });
  it("every community motion has card art on disk and its situation patterns exist", () => {
    for (const m of SEED_USER_DATA) {
      const { art, wave } = communityCard(m);
      expect(fs.existsSync(path.join(process.cwd(), "public", art)), art).toBe(true);
      expect(fs.existsSync(path.join(process.cwd(), "public", WAVEFORM_SRC[wave ?? "flat"]))).toBe(true);
      CATEGORY_PATTERNS[m.category].forEach((id) => expect(SITUATION_PATTERNS.some((p) => p.id === id)).toBe(true));
    }
    COMMUNITY_REVIEWS.forEach((r) => expect(fs.existsSync(path.join(process.cwd(), "public", r.src))).toBe(true));
  });
  it("expressions and library validate and point at real projects", () => {
    const ids = new Set(SEED_PROJECTS.map((p) => p.id));
    SEED_EXPRESSIONS.forEach((e) => { ok(ExpressionSchema, e); expect(ids.has(e.projectId)).toBe(true); });
    SEED_LIBRARY.forEach((e) => ok(SavedExpressionSchema, e));
    expect(SEED_LIBRARY.map((e) => e.name)).toEqual(["Sleepy nod", "Hello wave", "Curious tilt", "Startled hop"]);
  });
  it("sound cue presets build valid cues", () => {
    SOUND_CUES.forEach((c) => ok(SoundCueSchema, cueAt(c.id, 1)));
  });
});


describe("guideline", () => {
  const section = (id: string) => GUIDELINE.find((s) => s.id === id)!;
  const refs = (id: string, prefix: string) => section(id).entries.filter((e) => e.ref?.startsWith(prefix));
  it("has the v3 structure: Foundation → Component → Pattern → Template → Style → Validation", () => {
    expect(GUIDELINE.map((s) => s.id)).toEqual(["overview", "principles", "primitive-tokens", "behavior", "situation", "templates", "style", "validation"]);
    expect(refs("principles", "sp.").length + refs("principles", "gr.").length + refs("principles", "cmb.").length).toBe(3);
    expect(refs("principles", "op.")).toHaveLength(1);
    expect(refs("principles", "ch.").map((e) => e.ref)).toEqual(["ch.common", "ch.body", "ch.face", "ch.sound"]); // Figma 808:1657… order: Common · Motion · Face · Sound
    expect(refs("primitive-tokens", "tok.")).toHaveLength(18);
    expect(refs("behavior", "cmp.").filter((e) => e.slug !== "emphasis")).toHaveLength(16);
    expect(refs("templates", "ff.")).toHaveLength(5);
    for (const id of ["overview", "style", "validation"]) expect(section(id).entries.length).toBeGreaterThan(0);
  });
  it("pattern and form-factor slugs match data/patterns.ts and data/robot-types.ts", () => {
    expect(refs("situation", "pat.").map((e) => e.slug)).toEqual(SITUATION_PATTERNS.map((p) => p.id));
    expect(refs("templates", "ff.").map((e) => e.slug)).toEqual(ROBOT_TYPES.map((t) => t.id));
  });
  it("every component links to a guideline behavior", () => {
    for (const c of COMPONENTS) expect(findEntry("behavior", guidelineSlugFor(c.id)!)).toBeTruthy();
  });
  it("related links resolve", () => {
    const keys = new Set(GUIDELINE.flatMap((s) => s.entries.flatMap((e) => [e.slug, `${s.id}/${e.slug}`])));
    for (const s of GUIDELINE) for (const e of s.entries) for (const r of e.related ?? []) expect(keys.has(r), `${s.id}/${e.slug} → ${r}`).toBe(true);
  });
  it("is English only and slugs are unique per section", () => {
    const text = JSON.stringify(GUIDELINE);
    expect(/[ㄱ-힝]/.test(text)).toBe(false);
    for (const s of GUIDELINE) expect(new Set(s.entries.map((e) => e.slug)).size).toBe(s.entries.length);
  });
});


describe("reference keywords", () => {
  it("picks the set the user's words point to", async () => {
    const { referenceSetForText, REFERENCE_KEYWORDS, referenceSetFor } = await import("./reference-sets");
    for (const [, behavior] of REFERENCE_KEYWORDS) expect(referenceSetFor(behavior)).toBeDefined();
    expect(referenceSetForText("Do this A man laughs and pumps his fists — pure joy.")?.behavior).toBe("happy");
    expect(referenceSetForText("I'm so tired, I keep nodding off")?.behavior).toBe("doze");
    expect(referenceSetForText("Wow, that startled me!")?.behavior).toBe("alert");
    expect(referenceSetForText("a bright day")?.behavior).not.toBe("nod");
    expect(referenceSetForText("make something")).toBeUndefined();
  });
});
