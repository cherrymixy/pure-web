import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Memory } from "lowdb";
import { describe, expect, it } from "vitest";
import { PURE_DESK_STRUCTURE } from "@/data/pure-desk";
import { seedDb } from "@/data/seed";
import { clipFromDirect } from "../expression/direct";
import { FakeClient } from "../llm/fake";
import { OllamaGeneration, type GenerationOutput } from "../llm/generation";
import type { Db } from "../models";
import { LowRepo } from "../repo-lowdb";
import { runGeneration } from "./generate";

const base: GenerationOutput = {
  name: "Sleepy drift",
  currentStatus: "I can barely keep my eyes open.",
  reasoning: "It droops and catches itself.",
  motion: { steps: [{ behavior: "doze", speed: 0.9, amplitude: 1, repeat: 1 }] },
  face: { preset: "sleepy" },
  sound: { cues: [] },
};
const moving = { duration: 3, tracks: [{ joint: "head_tilt", keys: [{ t: 0, value: 0 }, { t: 1.5, value: -25 }, { t: 3, value: 0 }] }] };
const flat = { duration: 3, tracks: [{ joint: "head_tilt", keys: [{ t: 0, value: 0 }, { t: 3, value: 1 }] }] };

async function setup(flag: boolean) {
  const repo = new LowRepo(new Memory<Db>(), { seed: seedDb });
  await repo.settings.update({ directClip: flag });
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "pure-dc-"));
  await fs.mkdir(path.join(root, "p/frame"), { recursive: true });
  await fs.writeFile(path.join(root, "p/frame/1.jpg"), "JPEG");
  const references = [{ id: "r", kind: "video" as const, path: "p/video/cat.mp4", thumb: "", frames: ["p/frame/1.jpg"], status: "ok" as const }];
  return { repo, root, input: { projectId: "p-test-01", prompt: "like the cat", references } };
}

describe("clipFromDirect", () => {
  it("validates model keyframes into a clip", () => {
    const r = clipFromDirect(moving, PURE_DESK_STRUCTURE);
    expect(r.clip?.tracks.head_tilt).toHaveLength(3);
    expect(r.reason).toBeUndefined();
  });

  it("rejects clips with no movement or a single key", () => {
    expect(clipFromDirect(flat, PURE_DESK_STRUCTURE).reason).toMatch(/barely move/);
    expect(clipFromDirect({ duration: 2, tracks: [{ joint: "head_tilt", keys: [{ t: 1, value: 5 }, { t: 1, value: 9 }] }] }, PURE_DESK_STRUCTURE).clip).toBeNull();
  });
});

describe("runGeneration with the directClip flag", () => {
  it("on + frames: the vision answer's keyframes play as a clip", async () => {
    const { repo, root, input } = await setup(true);
    const fake = new FakeClient([JSON.stringify({ ...base, clip: moving })]);
    const res = await runGeneration({ repo, client: new OllamaGeneration(fake, "text", "vision"), input, root });
    expect(res.directClip).toMatchObject({ used: true });
    expect(fake.calls[0].model).toBe("vision");
    expect(fake.calls[0].images).toHaveLength(1);
    const e = await repo.expressions.get(res.expressionId);
    expect(e.motion.mode).toBe("clip");
    expect(e.motion.recipe.steps[0].behavior).toBe("doze");
  });

  it("on + unusable keyframes: falls back to the same answer's recipe with a reason", async () => {
    const { repo, root, input } = await setup(true);
    const res = await runGeneration({ repo, client: new OllamaGeneration(new FakeClient([JSON.stringify({ ...base, clip: flat })])), input, root });
    expect(res.directClip?.used).toBe(false);
    expect(res.directClip?.reason).toMatch(/barely move/);
    expect((await repo.expressions.get(res.expressionId)).motion.mode).toBe("recipe");
  });

  it("on + broken vision answer: Tier 1 runs as before", async () => {
    const { repo, root, input } = await setup(true);
    const fake = new FakeClient(["{bad", "{bad", JSON.stringify({ summary: "A cat dozes." }), JSON.stringify(base)]);
    const res = await runGeneration({ repo, client: new OllamaGeneration(fake), input, root });
    expect(res.directClip?.used).toBe(false);
    expect(res.source).toBe("ollama");
    expect((await repo.expressions.get(res.expressionId)).motion.mode).toBe("recipe");
  });

  it("off: no Tier 2 call at all", async () => {
    const { repo, root, input } = await setup(false);
    const fake = new FakeClient([JSON.stringify({ summary: "A cat dozes." }), JSON.stringify(base)]);
    const res = await runGeneration({ repo, client: new OllamaGeneration(fake), input, root });
    expect(res.directClip).toBeUndefined();
    expect(fake.calls).toHaveLength(2);
  });
});
