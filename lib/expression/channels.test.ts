import { describe, expect, it } from "vitest";
import { TILE_SLOTS, channelTiles, stepChannels, usedChannels } from "./channels";
import { sampleRecipe } from "./sample";

const recipe = {
  steps: [
    { behavior: "focus", speed: 1, amplitude: 1, repeat: 1 },
    { behavior: "shake", speed: 1, amplitude: 1, repeat: 1 },
    { behavior: "nod", speed: 1, amplitude: 1, repeat: 1 },
  ],
};

describe("stepChannels", () => {
  it("motion only when face is off and there are no cues", () => {
    const out = stepChannels(recipe, { preset: "" }, { cues: [] });
    expect(out.map((s) => s.behavior)).toEqual(["focus", "shake", "nod"]);
    expect(out.every((s) => s.channels.join() === "motion")).toBe(true);
    expect(usedChannels(out)).toEqual(["motion"]);
  });

  it("puts a cue on the step it starts in, face auto on every step", () => {
    const out = stepChannels(recipe, { preset: "auto" }, { cues: [{ id: "a", t: 0.1, sound: "chirp", pitchSt: 0, volumeDb: 0 }] });
    expect(out[0].channels).toEqual(["sound", "face", "motion"]);
    expect(out[1].channels).toEqual(["face", "motion"]);
    expect(usedChannels(out)).toEqual(["sound", "face", "motion"]);
  });

  it("empty recipe → no steps", () => {
    expect(stepChannels({ steps: [] }, undefined, undefined)).toEqual([]);
  });
});

describe("channelTiles", () => {
  it("merges consecutive steps of the same component into one tile", () => {
    const r = { steps: [recipe.steps[0], { ...recipe.steps[0] }, recipe.steps[1]] };
    const out = channelTiles(r, { preset: "" }, { cues: [] }, {}, (b) => (b === "focus" ? "approach" : b));
    expect(out.map((t) => t.group)).toEqual(["approach", "shake"]);
    expect(out[0].behaviors).toEqual(["focus", "focus"]);
  });

  it("marks motion where joints move and a cue in its slot", () => {
    const out = channelTiles(recipe, { preset: "" }, { cues: [{ id: "a", t: 0, sound: "chirp", pitchSt: 0, volumeDb: 0 }] });
    expect(out).toHaveLength(3);
    expect(out[0].rows.sound).toEqual([true, false, false, false]);
    expect(out.every((t) => t.rows.motion.length === TILE_SLOTS && t.rows.motion.some(Boolean))).toBe(true);
    expect(out.every((t) => !t.rows.face.some(Boolean))).toBe(true);
  });

  it("face keys only light the slots where a non-neutral face shows", () => {
    const tiles = channelTiles({ steps: [recipe.steps[0]] }, { preset: "neutral", keys: [{ t: 1000, preset: "smile" }] }, { cues: [] });
    expect(tiles[0].rows.face.every((f) => !f)).toBe(true);
  });
});

describe("channelTiles order", () => {
  it("orders channels by the slot they first come on in (ties: sound, face, motion)", () => {
    const [t] = channelTiles({ steps: [recipe.steps[0]] }, { preset: "auto" }, { cues: [{ id: "a", t: 0, sound: "chirp", pitchSt: 0, volumeDb: 0 }] });
    expect(t.order).toEqual(["sound", "face", "motion"]);
    const end = sampleRecipe({ steps: [recipe.steps[0]] }, {}, 20).duration;
    const [late] = channelTiles({ steps: [recipe.steps[0]] }, { preset: "" }, { cues: [{ id: "a", t: end * 0.9, sound: "chirp", pitchSt: 0, volumeDb: 0 }] });
    expect(late.order[late.order.length - 1]).toBe("sound");
  });
});
