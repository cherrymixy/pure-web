import { describe, expect, it } from "vitest";
import type { Clip } from "../models";
import { engineJoint, fromEngineClip, toEngineClip } from "./clip-map";
import { PURE_DESK_ROBOT } from "./robots";

describe("clip-map", () => {
  const clip: Clip = {
    format: "lelamp.clip/1",
    duration: 2,
    loop: false,
    tracks: {
      shoulder_pitch: [{ t: 0, value: 0, easing: "ease_in_out" }, { t: 1, value: 30, easing: "linear" }],
      head_tilt: [{ t: 0, value: -10, easing: "ease_out" }],
    },
  };

  it("maps robot joint ids to engine channels", () => {
    const engine = toEngineClip(clip, PURE_DESK_ROBOT);
    expect(engine.tracks.map((t) => t.joint)).toEqual(["base_pitch", "wrist_pitch"]);
    expect(engineJoint(PURE_DESK_ROBOT, "head_pan")).toBe("wrist_roll");
    expect(engineJoint(PURE_DESK_ROBOT, "nope")).toBeNull();
  });

  it("round-trips", () => {
    expect(fromEngineClip(toEngineClip(clip, PURE_DESK_ROBOT), PURE_DESK_ROBOT)).toEqual(clip);
  });
});
