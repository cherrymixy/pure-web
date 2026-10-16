import { describe, expect, it } from "vitest";
import { PROMPT_DEMOS, COMPONENT_DEMOS } from "@/data/demo-recipes";
import { LlmError } from "./client";
import { DemoExtraction, OllamaExtraction } from "./extraction";
import { FakeClient } from "./fake";
import { DemoGeneration, GenerationOutputSchema, OllamaGeneration, demoToOutput, pickDemo, type GenerationOutput } from "./generation";

const good: GenerationOutput = {
  name: "Sleepy drift",
  currentStatus: "I can barely keep my eyes open.",
  reasoning: "It slowly droops and catches itself.",
  motion: { steps: [{ behavior: "doze", speed: 0.8, amplitude: 0.9, repeat: 1, face: "sleepy" }] },
  face: { preset: "sleepy", tokens: { eyeSize: 1, eyeOpen: 0.3, eyeAngle: -5, browAngle: -10, brightness: 0.5, blinkRate: 4 } },
  sound: { cues: [{ preset: "soft-breath", t: 0.5 }] },
};
const json = (v: unknown) => JSON.stringify(v);
const req = { prompt: "I'm so tired, I keep nodding off" };

describe("OllamaGeneration with FakeClient", () => {
  it("returns parsed output on a clean answer", async () => {
    const fake = new FakeClient([json(good)]);
    const r = await new OllamaGeneration(fake, "m", "v").generate(req);
    expect(r).toMatchObject({ source: "ollama", retried: false, output: good, model: "m" });
    expect(fake.calls[0].user).toContain("Moment: I'm so tired");
    expect(fake.calls[0].schema).toHaveProperty("properties.motion");
  });

  it("retries once on broken JSON, quoting the problem", async () => {
    const fake = new FakeClient(["{not json", json(good)]);
    const r = await new OllamaGeneration(fake).generate(req);
    expect(r.source).toBe("ollama");
    expect(r.retried).toBe(true);
    expect(fake.calls[1].user).toContain("broke the JSON schema");
  });

  it("rejects behaviors outside the allow list, then falls back to demo", async () => {
    const bad = json({ ...good, motion: { steps: [{ behavior: "backflip", speed: 1, amplitude: 1, repeat: 1 }] } });
    const fake = new FakeClient([bad, bad]);
    const r = await new OllamaGeneration(fake).generate(req);
    expect(fake.calls).toHaveLength(2);
    expect(r.source).toBe("demo");
    expect(r.fallbackReason).toMatch(/Schema mismatch/);
    expect(r.output.name).toBe("Sleepy nod");
  });

  it("falls back on timeout and when Ollama is down (no call made)", async () => {
    const r1 = await new OllamaGeneration(new FakeClient([new LlmError("timeout", "No answer within 60s")])).generate(req);
    expect(r1).toMatchObject({ source: "demo", fallbackReason: "No answer within 60s" });
    const down = new FakeClient([json(good)], false);
    const r2 = await new OllamaGeneration(down).generate(req);
    expect(r2.source).toBe("demo");
    expect(down.calls).toHaveLength(0);
  });

  it("re-throws cancel instead of falling back", async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(new OllamaGeneration(new FakeClient([json(good)])).generate(req, { signal: ctrl.signal })).rejects.toMatchObject({ kind: "canceled" });
  });

  it("with images: vision model describes first, text model generates", async () => {
    const fake = new FakeClient([json({ summary: "A cat slowly nods off on a sofa." }), json(good)]);
    const r = await new OllamaGeneration(fake, "text-m", "vision-m").generate({ ...req, images: ["data:image/png;base64,AAAA"] });
    expect(fake.calls.map((c) => c.model)).toEqual(["vision-m", "text-m"]);
    expect(fake.calls[0].images).toHaveLength(1);
    expect(fake.calls[1].images).toBeUndefined();
    expect(fake.calls[1].user).toContain("A cat slowly nods off");
    expect(r.referenceSummary).toBe("A cat slowly nods off on a sofa.");
  });
});

describe("demo fallback", () => {
  it("picks suggested prompts, then components, then keywords", () => {
    expect(pickDemo({ prompt: "Wow, that startled me!" }).name).toBe(PROMPT_DEMOS.startled.name);
    expect(pickDemo({ prompt: "whatever", components: ["curious"] }).name).toBe(COMPONENT_DEMOS.curious.name);
    expect(pickDemo({ prompt: "so sleepy today" }).name).toBe("Sleepy nod");
    expect(pickDemo({ prompt: "qwerty" }).name).toBe(PROMPT_DEMOS.here.name);
  });

  it("every demo converts to a schema-valid generation output", async () => {
    for (const d of [...Object.values(PROMPT_DEMOS), ...Object.values(COMPONENT_DEMOS)]) {
      expect(GenerationOutputSchema.safeParse(demoToOutput(d)).success).toBe(true);
    }
    const r = await new DemoGeneration().generate(req);
    expect(r).toMatchObject({ source: "demo", fallbackReason: "Demo mode" });
  });
});

describe("extraction", () => {
  it("validates tone keywords against the dictionary and falls back to the Purebot tone", async () => {
    const ok = json({ tone: [{ keyword: "warm", page: 2, quote: "a" }, { keyword: "calm", page: 3, quote: "b" }, { keyword: "bold", page: 5, quote: "c" }] });
    expect((await new OllamaExtraction(new FakeClient([ok])).extract({ pages: [{ page: 1, text: "x" }] })).source).toBe("ollama");
    const bad = json({ tone: [{ keyword: "sparkly", page: 1, quote: "a" }] });
    const r = await new OllamaExtraction(new FakeClient([bad, bad])).extract({ pages: [{ page: 1, text: "x" }] });
    expect(r.source).toBe("demo");
    expect(r.output.tone.map((t) => t.keyword)).toEqual(["warm", "precise", "playful"]);
    expect((await new DemoExtraction().extract()).source).toBe("demo");
  });
});
