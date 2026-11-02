import { describe, expect, it } from "vitest";
import { PURE_DESK_STRUCTURE } from "@/data/pure-desk";
import type { Clip, Expression } from "../models";
import { applyBehavior, isNeutralBehavior, lateralJoints, playableExpression } from "./behavior";

const S = PURE_DESK_STRUCTURE;
const clip: Clip = {
  format: "lelamp.clip/1",
  duration: 2,
  tracks: {
    base_yaw: [{ t: 0, value: 10, easing: "linear" }, { t: 2, value: 30, easing: "linear" }],
    head_pan: [{ t: 0, value: 0, easing: "linear" }, { t: 1, value: 55, easing: "linear" }],
    head_tilt: [{ t: 0, value: 5, easing: "linear" }, { t: 2, value: 15, easing: "linear" }],
  },
};

describe("motion behavior", () => {
  it("neutral changes nothing", () => {
    expect(isNeutralBehavior(undefined)).toBe(true);
    expect(isNeutralBehavior({ direction: "left", delay: 0 })).toBe(true);
    expect(applyBehavior(clip, { direction: "left", delay: 0 }, S)).toBe(clip);
  });

  it("mirrors lateral joints (yaw / pan) into range, keeps pitch / tilt", () => {
    expect(lateralJoints(S).sort()).toEqual(["base_yaw", "head_pan"]);
    const c = applyBehavior(clip, { direction: "right", delay: 0 }, S);
    expect(c.tracks.base_yaw.map((k) => k.value)).toEqual([-10, -30]);
    // head pan range is -48..56: mirrored 55 clamps to -48
    expect(c.tracks.head_pan[1].value).toBe(-48);
    expect(c.tracks.head_tilt).toEqual(clip.tracks.head_tilt);
  });

  it("delay holds the first pose and shifts every key", () => {
    const c = applyBehavior(clip, { direction: "left", delay: 1.5 }, S);
    expect(c.duration).toBe(3.5);
    expect(c.tracks.base_yaw.map((k) => [k.t, k.value])).toEqual([[0, 10], [1.5, 10], [3.5, 30]]);
  });

  it("easing replaces every key's easing", () => {
    const c = applyBehavior(clip, { easing: "ease_out_back", direction: "left", delay: 0 }, S);
    for (const keys of Object.values(c.tracks)) for (const k of keys) expect(k.easing).toBe("ease_out_back");
  });

  it("playableExpression turns a recipe into a clip and delays face keys and sound cues", () => {
    const expr = {
      motion: { mode: "recipe", recipe: { steps: [{ behavior: "nod", speed: 1, amplitude: 1, repeat: 1 }] }, props: { amplitude: 50, duration: 50, smoothness: 50, speed: 50, frequency: 50 } },
      face: { preset: "auto", keys: [{ t: 0.5, preset: "smile" }] },
      sound: { cues: [{ id: "c1", t: 1, sound: "beep", pitchSt: 0, volumeDb: 0 }] },
    } as unknown as Pick<Expression, "motion" | "face" | "sound">;
    expect(playableExpression(expr, S)).toBe(expr);
    const delayed = playableExpression({ ...expr, motion: { ...expr.motion, behavior: { direction: "right", delay: 2 } } }, S);
    expect(delayed.motion.mode).toBe("clip");
    expect(delayed.motion.clip!.tracks.base_yaw[0].t).toBe(0);
    expect(delayed.face.keys![0].t).toBe(2.5);
    expect(delayed.sound.cues[0].t).toBe(3);
  });
});
