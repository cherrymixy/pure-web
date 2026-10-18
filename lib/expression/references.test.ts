import { describe, expect, it } from "vitest";
import { PURE_DESK_STRUCTURE } from "@/data/pure-desk";
import type { ReferenceSet } from "@/data/reference-sets";
import { PURE_DEFAULT_SIGNATURE } from "@/data/signature";
import { buildPureJson, parsePureJson } from "./purejson";
import { referenceCredits } from "./references";

const src = { title: "File:Cat.webm", page: "https://commons.wikimedia.org/wiki/File:Cat.webm", author: "Someone", license: "CC BY 4.0", excerpt: "full" };
const sets: ReferenceSet[] = [
  { behavior: "doze", items: [{ channel: "face", title: "Cat slow blink", note: "Eyelids close slowly.", file: "/x.jpg", poster: null, source: src }] },
  { behavior: "nod", items: [{ channel: "motion", title: "Horse nod", note: "Head dips twice.", file: "/y.webm", poster: null, source: src }] },
];

describe("reference credits", () => {
  it("one entry per item, each behavior once, in recipe order", () => {
    expect(referenceCredits(["nod", "doze", "nod", "happy"], sets).map((c) => `${c.behavior}:${c.channel}`)).toEqual(["nod:motion", "doze:face"]);
  });

  it("pure.json carries the credits with license and author", () => {
    const expression = {
      name: "Sleepy nod",
      currentStatus: "",
      motion: { mode: "recipe" as const, recipe: { steps: [{ behavior: "doze", speed: 1, amplitude: 1, repeat: 1 }] }, props: { amplitude: 50, duration: 50, smoothness: 50, speed: 50, frequency: 50 } },
      face: { preset: "sleepy" },
      sound: { cues: [] },
    };
    const clip = { format: "lelamp.clip/1" as const, duration: 2, tracks: {} };
    const { text } = buildPureJson({ name: "P", type: "joint-fixed", structure: PURE_DESK_STRUCTURE }, PURE_DEFAULT_SIGNATURE, expression, clip, { referenceSets: sets });
    const parsed = parsePureJson(text);
    expect(parsed.references).toEqual([{ behavior: "doze", channel: "face", title: "Cat slow blink", note: "Eyelids close slowly.", source: src }]);
  });
});
