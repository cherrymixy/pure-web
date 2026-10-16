import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Memory } from "lowdb";
import { describe, expect, it } from "vitest";
import { seedDb } from "@/data/seed";
import { LlmError } from "../llm/client";
import { FakeClient } from "../llm/fake";
import { DemoGeneration, OllamaGeneration, type GenerationOutput } from "../llm/generation";
import type { Db } from "../models";
import { LowRepo } from "../repo-lowdb";
import { referenceImages, runGeneration } from "./generate";

const good: GenerationOutput = {
  name: "Sleepy drift",
  currentStatus: "I can barely keep my eyes open.",
  reasoning: "It droops and catches itself.",
  motion: { steps: [{ behavior: "doze", speed: 0.8, amplitude: 0.9, repeat: 1, face: "sleepy" }] },
  face: { preset: "sleepy", tokens: { eyeSize: 1, eyeOpen: 0.3, eyeAngle: -5, browAngle: -10, brightness: 0.5, blinkRate: 4 } },
  sound: { cues: [{ preset: "soft-breath", t: 0.5 }] },
};
const repo = () => new LowRepo(new Memory<Db>(), { seed: seedDb });
const input = { projectId: "p-test-01", prompt: "I'm so tired, I keep nodding off", components: ["doze"], pattern: "alone" };

describe("runGeneration", () => {
  it("saves a validated expression with the project's signature snapshot", async () => {
    const r = repo();
    const fake = new FakeClient([JSON.stringify(good)]);
    const steps: string[] = [];
    const res = await runGeneration({ repo: r, client: new OllamaGeneration(fake), input, report: async (p) => void steps.push(p.stepLabel) });
    expect(res.source).toBe("ollama");
    expect(steps).toHaveLength(5);
    const e = await r.expressions.get(res.expressionId);
    expect(e).toMatchObject({ name: "Sleepy drift", components: ["doze"], pattern: "alone", motion: { mode: "recipe" } });
    expect(e.signatureSnapshot.id).toBe((await r.signatures.current("p-test-01"))!.id);
    expect(fake.calls[0].user).toContain("Preferred components: doze");
  });

  it("falls back to the demo when Ollama is unreachable", async () => {
    const fake = new FakeClient([new LlmError("network", "down")]);
    fake.available = async () => false;
    const res = await runGeneration({ repo: repo(), client: new OllamaGeneration(fake), input });
    expect(res.source).toBe("demo");
    expect(res.fallbackReason).toBeTruthy();
  });

  it("regenerating into an expression keeps the previous version in history", async () => {
    const r = repo();
    const client = new DemoGeneration();
    const first = await runGeneration({ repo: r, client, input });
    const second = await runGeneration({ repo: r, client, input: { ...input, prompt: "Wow, that startled me!", expressionId: first.expressionId } });
    expect(second.expressionId).toBe(first.expressionId);
    const e = await r.expressions.get(first.expressionId);
    expect(e.version).toBe(2);
    expect(e.history).toHaveLength(1);
  });

  it("cancel propagates and saves nothing", async () => {
    const r = repo();
    const before = (await r.expressions.listByProject("p-test-01")).length;
    const fake = new FakeClient([new LlmError("canceled", "stop")]);
    await expect(runGeneration({ repo: r, client: new OllamaGeneration(fake), input })).rejects.toThrow();
    expect(await r.expressions.listByProject("p-test-01")).toHaveLength(before);
  });

  it("an aborted run saves nothing even if the client returned (demo fallback)", async () => {
    const r = repo();
    const before = (await r.expressions.listByProject("p-test-01")).length;
    const ctl = new AbortController();
    ctl.abort();
    await expect(runGeneration({ repo: r, client: new DemoGeneration(), input, signal: ctl.signal })).rejects.toMatchObject({ code: "CANCELED" });
    expect(await r.expressions.listByProject("p-test-01")).toHaveLength(before);
  });

  it("needs a confirmed structure", async () => {
    await expect(runGeneration({ repo: repo(), client: new DemoGeneration(), input: { ...input, projectId: "p-purebot-dog" } })).rejects.toMatchObject({ code: "NO_STRUCTURE" });
  });
});

describe("referenceImages", () => {
  it("reads ok frames as base64, skips failed refs and paths outside uploads", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "pure-ref-"));
    await fs.mkdir(path.join(root, "p1/frame"), { recursive: true });
    await fs.writeFile(path.join(root, "p1/frame/a.png"), "AAA");
    const ref = { id: "r", kind: "video" as const, path: "p1/video/v.mp4", thumb: "", status: "ok" as const };
    const imgs = await referenceImages(
      [
        { ...ref, frames: ["p1/frame/a.png", "../../etc/passwd", "p1/frame/missing.png"] },
        { ...ref, id: "r2", status: "failed", frames: ["p1/frame/a.png"] },
      ],
      root,
    );
    expect(imgs).toEqual([Buffer.from("AAA").toString("base64")]);
  });
});
