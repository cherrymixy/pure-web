import { Memory } from "lowdb";
import { describe, expect, it } from "vitest";
import { seedDb } from "@/data/seed";
import type { Db, Structure } from "@/lib/models";
import { LowRepo } from "@/lib/repo-lowdb";
import { fitDbToRig, fitToRig } from "./rig";

const joint = (id: string, rigMin: number, rigMax: number, min = rigMin, max = rigMax) => ({ id, label: id, rigMin, rigMax, min, max });

describe("fitToRig", () => {
  it("moves an earlier body's ranges onto the current rig, clamping Edit limits", () => {
    const s: Structure = {
      type: "joint-fixed",
      source: "pure-desk",
      channels: ["motion"],
      joints: [joint("head_pan", -160, 160, -90, 30), joint("head_tilt", -33, 42, -30, -10)],
    };
    expect(fitToRig(s)).toBe(true);
    expect(s.joints[0]).toMatchObject({ rigMin: -48, rigMax: 56, min: -48, max: 30 });
    // −30…−10 no longer fits −2…21 → full rig range
    expect(s.joints[1]).toMatchObject({ rigMin: -2, rigMax: 21, min: -2, max: 21 });
  });

  it("leaves current and non-PURE structures alone", () => {
    const s: Structure = { type: "joint-fixed", source: "pure-desk", channels: ["motion"], joints: [joint("head_pan", -48, 56, -20, 20)] };
    expect(fitToRig(s)).toBe(false);
    expect(s.joints[0]).toMatchObject({ min: -20, max: 20 });
  });
});

describe("fitDbToRig on load", () => {
  it("fits projects saved for the earlier body when the DB file loads", async () => {
    const db = seedDb();
    db.projects.push({
      id: "p-old", name: "Old", type: "joint-fixed", status: "ready", progress: 100, signatureHistory: [], channelsUsed: [], updatedAt: "2026-10-01T00:00:00.000Z",
      structure: { type: "joint-fixed", source: "pure-desk", channels: ["motion"], joints: [joint("head_pan", -160, 160)] },
    });
    const adapter = new Memory<Db>();
    await adapter.write(db);
    const repo = new LowRepo(adapter, { seed: seedDb, migrate: fitDbToRig });
    expect((await repo.projects.get("p-old")).structure!.joints[0]).toMatchObject({ rigMin: -48, rigMax: 56, min: -48, max: 56 });
  });
});
