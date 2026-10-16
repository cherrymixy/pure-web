import { describe, expect, it } from "vitest";
import type { Reference } from "@/lib/models";
import { MAX_INPUTS, logInput, splitLog, withRef, type InputEntry } from "./input-log";

const ref: Reference = { id: "r1", kind: "video", path: "p/v.mp4", thumb: "", status: "ok" };
const entry = (n: number, attachments = [] as InputEntry["attachments"]): InputEntry => ({ id: `in-${n}`, at: "2026-10-17T00:00:00.000Z", text: `input ${n}`, attachments });

describe("input log", () => {
  it("logs newest first, clears the tray, stays bounded", () => {
    let c = { references: [ref], inputs: [] as InputEntry[] };
    c = logInput(c, entry(1, [ref]));
    expect(c.references).toEqual([]);
    expect(c.inputs[0].attachments).toEqual([ref]);
    for (let i = 2; i <= MAX_INPUTS + 5; i++) c = logInput(c, entry(i));
    expect(c.inputs).toHaveLength(MAX_INPUTS);
    expect(c.inputs[0].id).toBe(`in-${MAX_INPUTS + 5}`);
  });

  it("Current Status is the latest; three older entries until expanded", () => {
    const inputs = [5, 4, 3, 2, 1].map((n) => entry(n));
    const closed = splitLog(inputs, false);
    expect(closed.latest?.id).toBe("in-5");
    expect(closed.shown.map((e) => e.id)).toEqual(["in-4", "in-3", "in-2"]);
    expect(closed.hidden).toBe(1);
    expect(splitLog(inputs, true).shown).toHaveLength(4);
    expect(splitLog([], false)).toEqual({ latest: undefined, shown: [], hidden: 0 });
  });

  it("patches an attachment in the tray and in logged inputs", () => {
    const c = withRef({ references: [ref], inputs: [entry(1, [ref])] }, "r1", { summary: "A cat yawns." });
    expect(c.references[0].summary).toBe("A cat yawns.");
    expect(c.inputs[0].attachments[0].summary).toBe("A cat yawns.");
  });
});
