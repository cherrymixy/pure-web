/**
 * STEP 11 — the whole logic loop end to end (BuildPlay STEP 11), with FakeClient LLMs,
 * an injected clock and an in-memory repo. No UI, no sim: the same lib calls the routes and jobs make.
 */
import path from "node:path";
import { Memory } from "lowdb";
import { describe, expect, it } from "vitest";
import { ROBOT_DEVICE_STRUCTURES } from "@/data/robot-devices";
import { seedDb } from "@/data/seed";
import {
  autoAdjust, buildPureJson, compatibility, fallback, limitCheck, matchTiming, paramsToProps, parsePureJson, propsToParams, recipeToClip,
} from "./expression";
import { runGeneration } from "./jobs/generate";
import { LlmError } from "./llm/client";
import { OllamaExtraction } from "./llm/extraction";
import { FakeClient } from "./llm/fake";
import { OllamaGeneration, type GenerationOutput } from "./llm/generation";
import type { Clip, Db, MotionProps } from "./models";
import { diffEnergy, energySamples } from "./reference/energy";
import { RepoError } from "./repo";
import { LowRepo, SHARE_LOCK_MS } from "./repo-lowdb";
import { runAnalysis } from "./robot/run-analysis";
import { signatureToParams } from "./signature/axes";
import { extractFromPdf } from "./signature/extract";
import { buildDraft, toneFromSources } from "./signature/run";
import { emptyHistory, pushChange, undoChange } from "./ui/history";

const DAY = 86_400_000;
const PDF = path.join(process.cwd(), "public/demo/Purebot_Brand_Guide.pdf");
const TONE = {
  tone: [
    { keyword: "warm", page: 4, quote: "Purebot speaks warmly" },
    { keyword: "precise", page: 12, quote: "Every movement lands exactly" },
    { keyword: "playful", page: 7, quote: "A little play keeps the day light" },
  ],
};
const OUTPUT: GenerationOutput = {
  name: "Sleepy nod",
  currentStatus: "I'm nodding off because I'm tired.",
  reasoning: "The head droops and catches itself, like dozing at a desk.",
  motion: { steps: [{ behavior: "doze", speed: 0.9, amplitude: 1, repeat: 1, face: "sleepy" }, { behavior: "nod", speed: 0.8, amplitude: 0.8, repeat: 1 }] },
  face: { preset: "sleepy", tokens: { eyeSize: 1, eyeOpen: 0.25, eyeAngle: -8, browAngle: -12, brightness: 0.45, blinkRate: 4 } },
  sound: { cues: [{ preset: "soft-breath", t: 0.4 }, { preset: "low-warm", t: 2 }] },
};

function setup() {
  let now = new Date("2026-10-16T12:00:00.000Z");
  const clock = { advance: (ms: number) => (now = new Date(now.getTime() + ms)) };
  const repo = new LowRepo(new Memory<Db>(), { seed: seedDb, now: () => now });
  return { repo, clock };
}

const code = (p: Promise<unknown>) => p.then(() => null, (e: unknown) => (e instanceof RepoError || (e as { code?: string }).code ? (e as { code: string }).code : String(e)));

describe("v0.1-logic: full loop", () => {
  it("project → structure → signature → expression → edits → export → share → library", async () => {
    const { repo, clock } = setup();

    // 1. New project (PURE Desk) → analysis → structure with 5 joints.
    const project = await repo.projects.create({ name: "Untitled robot", type: "joint-fixed", source: "pure-desk", status: "analyzing" });
    const steps: string[] = [];
    const analysis = await runAnalysis({ repo, projectId: project.id, input: { source: "pure-desk" }, stepMs: 0, report: async (p) => void steps.push(p.stepLabel) });
    expect(steps).toHaveLength(4);
    expect(analysis.joints).toBe(5);
    let p = await repo.projects.get(project.id);
    expect(p.status).toBe("draft");

    // 2. Edit limits: narrow shoulder_pitch to −20…40 (widening is refused).
    const narrowed = { ...p.structure!, joints: p.structure!.joints.map((j) => (j.id === "shoulder_pitch" ? { ...j, min: -20, max: 40 } : j)) };
    await repo.projects.setStructure(project.id, narrowed);
    const widened = { ...narrowed, joints: narrowed.joints.map((j) => (j.id === "shoulder_pitch" ? { ...j, rigMax: 90, max: 90 } : j)) };
    expect(await code(repo.projects.setStructure(project.id, widened))).toBe("CONFLICT");
    p = await repo.projects.get(project.id);
    const structure = p.structure!;

    // 3. PDF → Fake tone warm / precise / playful → v0.1 → Regenerate v0.2 → Restore v0.1 = v0.3.
    const extracted = await extractFromPdf(PDF, "Purebot_Brand_Guide.pdf");
    const source = { kind: "pdf" as const, path: "demo/Purebot_Brand_Guide.pdf", name: "Purebot_Brand_Guide.pdf" };
    const tone1 = await toneFromSources(extracted, new OllamaExtraction(new FakeClient([JSON.stringify(TONE)])));
    expect(tone1.source).toBe("ollama");
    const v1 = await repo.signatures.addVersion(project.id, buildDraft(extracted, tone1.output, { source }));
    expect(v1.tone).toEqual(["warm", "precise", "playful"]);
    expect(v1.mapping.find((m) => m.page === 4)).toBeTruthy();
    const tone2 = await toneFromSources(extracted, new OllamaExtraction(new FakeClient([JSON.stringify({ tone: TONE.tone.slice().reverse() })])));
    const v2 = await repo.signatures.addVersion(project.id, buildDraft(extracted, tone2.output, { source }));
    const v3 = await repo.signatures.restore(project.id, 1);
    expect([v1.version, v2.version, v3.version]).toEqual([1, 2, 3]);
    expect(v3.axes).toEqual(v1.axes);
    expect((await repo.signatures.current(project.id))?.id).toBe(v3.id);

    // 4. Generate (Fake) → expression with signature snapshot v0.3.
    const gen = await runGeneration({
      repo,
      client: new OllamaGeneration(new FakeClient([JSON.stringify(OUTPUT)])),
      input: { projectId: project.id, prompt: "I'm so tired, I keep nodding off", components: ["doze"], pattern: "alone" },
    });
    expect(gen.source).toBe("ollama");
    let expr = await repo.expressions.get(gen.expressionId);
    expect(expr.signatureSnapshot.version).toBe(3);
    expect(expr.face.preset).toBe("sleepy");
    expect(expr.sound.cues.length).toBeGreaterThan(0);

    // 5. Speed → 60 → Undo restores the original (change chip history), each save is a version.
    const original: MotionProps = expr.motion.props;
    let history = pushChange(emptyHistory<MotionProps>(), "Speed", original, { ...original, speed: 60 });
    expr = await repo.expressions.update(expr.id, { motion: { ...expr.motion, props: { ...original, speed: 60 } } });
    expect(expr.motion.props.speed).toBe(60);
    const undo = undoChange(history)!;
    history = undo.history;
    expr = await repo.expressions.update(expr.id, { motion: { ...expr.motion, props: undo.restore } });
    expect(expr.motion.props.speed).toBe(original.speed);
    expect(expr.history).toHaveLength(2);

    // 6. An over-limit clip → limitCheck finds it → autoAdjust passes.
    const params = propsToParams(expr.motion.props, expr.signatureSnapshot.axes).params;
    const clip = recipeToClip(expr.motion.recipe, params, structure);
    const over: Clip = { ...clip, tracks: { ...clip.tracks, shoulder_pitch: [{ t: 0, value: 0, easing: "linear" }, { t: clip.duration / 2, value: 70, easing: "linear" }, { t: clip.duration, value: 0, easing: "linear" }] } };
    expect(limitCheck(over, structure).map((v) => v.joint)).toContain("shoulder_pitch");
    const adjusted = autoAdjust(over, structure);
    expect(limitCheck(adjusted.clip, structure)).toEqual([]);

    // 7. Reference frames (8) → motion peaks → matchTiming moves keys and keeps the original for undo.
    const frame = (v: number) => new Uint8ClampedArray(64 * 4).fill(v);
    const frames = [0, 0, 0, 200, 200, 200, 0, 0].map(frame);
    const energy = energySamples(diffEnergy(frames), 4);
    const keyed: Clip = {
      format: "lelamp.clip/1",
      duration: 4,
      tracks: { head_tilt: [0, 1, 2.2, 3, 4].map((t) => ({ t, value: t * 5, easing: "linear" as const })) },
    };
    const matched = matchTiming(keyed, energy, 0.6);
    expect(matched.moved).toBeGreaterThan(0);
    expect(matched.original).toEqual(keyed);

    // 8. Compatibility on Studio arm (6 joints, motion only) → channel issues → fallback clears them.
    const arm = { name: "Studio arm", structure: ROBOT_DEVICE_STRUCTURES["r-studio-arm"] };
    const issues = compatibility(expr, arm);
    expect(issues.filter((i) => i.kind === "channel").map((i) => i.channel).sort()).toEqual(["face", "sound"]);
    expect(compatibility(fallback(expr), arm).filter((i) => i.kind === "channel")).toEqual([]);
    expect(compatibility(expr, { name: "Purebot Desk", structure: ROBOT_DEVICE_STRUCTURES["r-purebot-desk"] }).filter((i) => i.kind === "channel")).toEqual([]);

    // 9. pure.json build ↔ parse round trip.
    const pure = buildPureJson(p, v3, expr, clip, { includeFallback: true, team: "Purebot Co." });
    const parsed = parsePureJson(pure.text);
    expect(parsed.expression.name).toBe("Sleepy nod");
    expect(parsed.signature.version).toBe(3);
    expect(parsed.fallback?.motion.duration).toBe(clip.duration);

    // 10. Export → Library → User Data (uploaded); share link with password, 5 wrong → lock, expiry.
    const saved = await repo.library.save(expr.id);
    expect((await repo.userData.list({ tab: "uploaded" })).map((u) => u.name)).toContain("Sleepy nod");
    const share = await repo.shares.create({ expressionIds: [saved.id], password: "pure", allowDownload: true });
    expect(await repo.shares.state(share.id)).toBe("password");
    for (let i = 0; i < 4; i++) expect(await code(repo.shares.unlock(share.id, "nope"))).toBe("WRONG_PASSWORD");
    expect(await code(repo.shares.unlock(share.id, "nope"))).toBe("LOCKED");
    expect(await code(repo.shares.unlock(share.id, "pure"))).toBe("LOCKED");
    clock.advance(SHARE_LOCK_MS + 1);
    expect(await code(repo.shares.unlock(share.id, "pure"))).toBeNull();
    expect((await repo.shares.contents(share.id))[0].name).toBe("Sleepy nod");
    clock.advance(7 * DAY);
    expect(await repo.shares.state(share.id)).toBe("expired");
  });

  it("Ollama unreachable → demo fallback expression, still validated and saved", async () => {
    const { repo } = setup();
    const fake = new FakeClient([new LlmError("network", "down")]);
    fake.available = async () => false;
    const res = await runGeneration({ repo, client: new OllamaGeneration(fake), input: { projectId: "p-test-01", prompt: "I'm so tired, I keep nodding off" } });
    expect(res.source).toBe("demo");
    const e = await repo.expressions.get(res.expressionId);
    expect(e.motion.recipe.steps.length).toBeGreaterThan(0);
    const sig = await repo.signatures.current("p-test-01");
    expect(e.motion.props).toEqual(paramsToProps(signatureToParams(sig!.axes).playback));
  });
});
