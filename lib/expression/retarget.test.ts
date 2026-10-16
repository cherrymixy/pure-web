import { Memory } from "lowdb";
import { describe, expect, it } from "vitest";
import { PURE_DESK_STRUCTURE } from "@/data/pure-desk";
import { seedDb } from "@/data/seed";
import { ExpressionInputSchema, type Db, type Structure } from "../models";
import { LowRepo } from "../repo-lowdb";
import { applyToRobot } from "./retarget";

const saved = async () => (await new LowRepo(new Memory<Db>(), { seed: seedDb }).library.list()).find((s) => s.channels.includes("sound"))!;

describe("applyToRobot", () => {
  it("copies everything onto the same structure", async () => {
    const s = await saved();
    const { expression, dropped } = applyToRobot(s, PURE_DESK_STRUCTURE);
    expect(dropped).toEqual([]);
    expect(expression.sound.cues).toEqual(s.sound.cues);
    expect(expression).not.toHaveProperty("savedAt");
    expect(expression).not.toHaveProperty("id");
    expect(() => ExpressionInputSchema.parse(expression)).not.toThrow(); // POST /api/projects/[id]/expressions body
  });

  it("maps channels only onto a robot without face/sound, and drops clips it can't play", async () => {
    const s = await saved();
    const withClip = { ...s, motion: { ...s.motion, mode: "clip" as const, clip: { format: "lelamp.clip/1" as const, duration: 2, tracks: { head_tilt: [{ t: 0, value: 0, easing: "linear" as const }] } } } };
    const arm: Structure = { type: "joint-fixed", source: "import", channels: ["motion"], joints: [{ id: "elbow", label: "Elbow", min: -90, max: 90, rigMin: -90, rigMax: 90 }] };
    const { expression, dropped, clipDropped } = applyToRobot(withClip, arm);
    expect(dropped).toEqual(["face", "sound"]);
    expect(clipDropped).toBe(true);
    expect(expression.motion.mode).toBe("recipe");
    expect(expression.sound.cues).toEqual([]);
  });
});
