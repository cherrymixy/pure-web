import { describe, expect, it } from "vitest";
import { PURE_DESK_STRUCTURE } from "@/data/pure-desk";
import type { Clip, FaceSpec } from "../models";
import { addFaceKey, addKey, deleteFaceKey, deleteKey, formatTime, moveFaceKey, snapTime, updateKey } from "./keys";

const clip: Clip = {
  format: "lelamp.clip/1",
  duration: 2,
  tracks: { head_tilt: [{ t: 0, value: 0, easing: "linear" }, { t: 2, value: 20, easing: "linear" }] },
};
const S = PURE_DESK_STRUCTURE;

describe("timeline keys", () => {
  it("snaps to 30 fps and formats", () => {
    expect(snapTime(1.26, 2)).toBeCloseTo(1.267);
    expect(snapTime(5, 2)).toBe(2);
    expect(formatTime(1.25)).toBe("00:01.25");
  });

  it("+Keyframe samples the clip at the playhead and reuses a key on the same frame", () => {
    const { clip: c, index } = addKey(clip, "head_tilt", 1, S);
    expect(index).toBe(1);
    expect(c.tracks.head_tilt[1]).toMatchObject({ t: 1, value: 10 });
    expect(addKey(c, "head_tilt", 1.01, S).index).toBe(1);
  });

  it("updates keep order between neighbours and the value inside the structure range", () => {
    const { clip: c } = addKey(clip, "head_tilt", 1, S);
    const moved = updateKey(c, "head_tilt", 1, { t: 5, value: -500, easing: "ease_out" }, S);
    expect(moved.tracks.head_tilt[1].t).toBeCloseTo(2 - 1 / 30, 3);
    expect(moved.tracks.head_tilt[1].value).toBe(-2);
    expect(moved.tracks.head_tilt[1].easing).toBe("ease_out");
    expect(clip.tracks.head_tilt).toHaveLength(2); // input untouched
  });

  it("delete keeps at least one key", () => {
    const one = deleteKey(clip, "head_tilt", 0);
    expect(one.tracks.head_tilt).toHaveLength(1);
    expect(deleteKey(one, "head_tilt", 0).tracks.head_tilt).toHaveLength(1);
  });

  it("face keys add / move / delete", () => {
    const face: FaceSpec = { preset: "neutral" };
    const a = addFaceKey(face, 0.5, 2, "smile").face;
    const b = addFaceKey(a, 1.5, 2, "sleepy").face;
    expect(b.keys).toEqual([{ t: 0.5, preset: "smile" }, { t: 1.5, preset: "sleepy" }]);
    expect(moveFaceKey(b, 0, 1.6, 2).keys![0].t).toBeCloseTo(1.5 - 1 / 30, 3);
    expect(deleteFaceKey(deleteFaceKey(b, 0), 0).keys).toBeUndefined();
  });
});
