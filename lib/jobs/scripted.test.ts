import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Memory } from "lowdb";
import { afterAll, describe, expect, it } from "vitest";
import { seedDb } from "@/data/seed";
import { SCRIPTED_REFERENCES } from "@/data/scripted-references";
import { FakeClient } from "../llm/fake";
import { OllamaGeneration } from "../llm/generation";
import type { Db, Reference } from "../models";
import { LowRepo } from "../repo-lowdb";
import { runGeneration } from "./generate";
import { matchScripted } from "./scripted";

const bytes = Buffer.from("scripted-reference-test-video");
const digest = createHash("sha256").update(bytes).digest("hex");
const script = { ...SCRIPTED_REFERENCES[0], id: "test", sha256: [digest], minMs: 3 };
SCRIPTED_REFERENCES.push(script);
afterAll(() => void SCRIPTED_REFERENCES.splice(SCRIPTED_REFERENCES.indexOf(script), 1));

async function upload(name: string, data: Buffer) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scripted-"));
  await fs.mkdir(path.join(root, "p", "video"), { recursive: true });
  await fs.writeFile(path.join(root, "p", "video", name), data);
  const ref: Reference = { id: "ref-1", kind: "video", path: `p/video/${name}`, thumb: "", status: "ok", summary: "a person" };
  return { root, ref };
}

describe("scripted references", () => {
  it("matches a video by file hash, not by name", async () => {
    const hit = await upload("anything.mp4", bytes);
    expect((await matchScripted([hit.ref], hit.root))?.id).toBe("test");
    const miss = await upload("happy.mp4", Buffer.from("other"));
    expect(await matchScripted([miss.ref], miss.root)).toBeNull();
  });

  it("the matched video skips the LLM and saves the scripted expression", async () => {
    const { root, ref } = await upload("clip.mp4", bytes);
    const repo = new LowRepo(new Memory<Db>(), { seed: seedDb });
    const fake = new FakeClient([]);
    const steps: string[] = [];
    const res = await runGeneration({
      repo, client: new OllamaGeneration(fake), root,
      input: { projectId: "p-test-01", prompt: "Make it like this", references: [ref] },
      report: async (p) => void steps.push(p.stepLabel),
    });
    expect(fake.calls).toHaveLength(0);
    expect(res.source).toBe("ollama");
    expect(steps).toHaveLength(5);
    const e = await repo.expressions.get(res.expressionId);
    expect(e.components).toEqual(["approach", "joy"]);
    expect(e.motion.recipe.steps.map((s) => s.behavior)).toEqual(["happy", "happy"]);
    expect(res.issues.filter((i) => !i.message.includes("joint limits"))).toEqual([]);
    expect(e.sound.cues).toHaveLength(5);
    expect(e.sound.cues.every((c) => c.sound === "robot-happy" && c.pitchSt === 0)).toBe(true);
  });
});
