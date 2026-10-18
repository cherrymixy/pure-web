import { describe, expect, it } from "vitest";
import type { Db } from "../models";
import { migrateComponents, migrateDbContext, migratePattern } from "./context";

describe("context migration (guideline v3 ids)", () => {
  it("maps old simulator-behavior chips to v3 components, drops the unmatched, dedupes", () => {
    expect(migrateComponents(["happy", "greet", "alert", "wake", "sleep"])).toEqual(["joy", "bow", "surprise", "stretch", "doze"]);
    expect(migrateComponents(["idle", "look_around", "sweep", "focus", "home"])).toEqual([]);
    expect(migrateComponents(["doze", "sleep", "keep_distance", "curious"])).toEqual(["doze", "keep_distance", "curious"]);
  });
  it("maps old situation ids and keeps new ones", () => {
    expect(["side-by-side", "at-a-distance", "alone", "passing-by", "touching", ""].map(migratePattern)).toEqual(["by-your-side", "by-your-side", "by-your-side", "pass-by", "touching", ""]);
  });
  it("rewrites expressions, history, library and job inputs but not recipe steps", () => {
    const step = { behavior: "happy", speed: 1, amplitude: 1, repeat: 1 };
    const db = {
      expressions: [{ components: ["happy"], pattern: "alone", motion: { recipe: { steps: [step] } }, history: [{ components: ["greet"], pattern: "passing-by" }] }],
      library: [{ components: ["sleep", "doze"], pattern: "side-by-side" }],
      jobs: [{ input: { components: ["alert"], pattern: "at-a-distance" } }, { input: { source: "pure-desk" } }],
    } as unknown as Db;
    migrateDbContext(db);
    const e = db.expressions[0];
    expect([e.components, e.pattern, e.motion.recipe.steps[0].behavior]).toEqual([["joy"], "by-your-side", "happy"]);
    expect(e.history[0]).toMatchObject({ components: ["bow"], pattern: "pass-by" });
    expect(db.library[0]).toMatchObject({ components: ["doze"], pattern: "by-your-side" });
    expect(db.jobs[0].input).toEqual({ components: ["surprise"], pattern: "by-your-side" });
    expect(db.jobs[1].input).toEqual({ source: "pure-desk" });
  });
});
