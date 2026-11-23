import { describe, expect, it } from "vitest";
import { motorAngles, poseUrl } from "./robot-link";

const pose = (v: Record<string, number>) => Object.entries(v).map(([id, actual]) => ({ id, actual }));

describe("real robot link", () => {
  it("maps sim joints to motors and never leaves the confirmed ranges", () => {
    const a = motorAngles(pose({ base_yaw: 10, shoulder_pitch: -28, elbow_pitch: 10, head_pan: -20, head_tilt: 5 }));
    expect(a).toEqual({ m4: 10, m3: 5, m2: 40, m1: -20 });
    const far = motorAngles(pose({ base_yaw: 170, shoulder_pitch: 90, elbow_pitch: -135, head_pan: -90 }));
    expect(far).toEqual({ m4: 45, m3: -60, m2: 80, m1: -45 });
  });

  it("builds the pose request", () => {
    expect(poseUrl({ m1: 1.5, m4: -2 })).toBe("http://192.168.4.1/pose?m1=1.5&m4=-2");
  });
});

describe("firmware export", () => {
  it("bakes the clip into the sketch and plays it from boot", async () => {
    const { readFileSync } = await import("node:fs");
    const { firmwarePaths, fillFirmware } = await import("./robot-firmware");
    const clip = { duration: 1, tracks: { base_yaw: [{ t: 0, value: 0, easing: "linear" }, { t: 1, value: 90, easing: "linear" }] } } as never;
    const paths = firmwarePaths(clip, ["base_yaw", "shoulder_pitch", "elbow_pitch", "head_pan"], 2);
    expect(paths.m4[0]).toEqual([0, 0]);
    expect(paths.m4[1][1]).toBe(50); // 100 ms step at 2× speed
    expect(Math.max(...paths.m4.map(([a]) => a))).toBe(45); // clamped to the safe range
    const ino = fillFirmware(readFileSync("hardware/esp32_servo_wifi/esp32_servo_wifi.ino", "utf8"), paths, "Wave");
    expect(ino).toMatch(/const Key PATH_M4\[\] = \{ \{0, 0\}, /);
    expect(ino).toContain("startPath(m4, PATH_M4, LEN(PATH_M4));");
    expect(ino).toContain("#if USE_M2\n  startPath(m2,");
  });
});

describe("showcase motions", () => {
  it("each motion uses a real behavior and builds robot code", async () => {
    const { SHOWCASE_MOTIONS } = await import("@/data/showcase");
    const { BEHAVIORS } = await import("./sim/behaviors");
    const { PURE_DESK_STRUCTURE } = await import("@/data/pure-desk");
    const { showcaseClip } = await import("@/app/showcase/_components/showcase-clip");
    const { showcasePaths } = await import("@/app/showcase/_components/showcase-clip");
    for (const m of SHOWCASE_MOTIONS) {
      for (const s of m.recipe?.steps ?? []) expect(BEHAVIORS.some((b) => b.name === s.behavior)).toBe(true);
      m.keys?.forEach((k, i) => i && expect(k.t, `${m.id} key ${i}`).toBeGreaterThan(m.keys![i - 1].t));
      const clip = showcaseClip(m);
      expect(clip.duration).toBeGreaterThan(1);
      const paths = showcasePaths(m);
      // every motor path spans the whole loop, so the motors stay in step
      const total = (k: string) => paths[k].reduce((sum, [, ms]) => sum + ms, 0);
      for (const k of ["m1", "m2", "m3", "m4"]) expect(Math.abs(total(k) - total("m3"))).toBeLessThanOrEqual(m.keys || m.tracks ? 0 : 150);
      if (m.id === "politely") {
        expect(m.tracks!.shoulder_pitch[1][0]).toBeLessThanOrEqual(0.2); // no lead-in delay
        // M3 starts first; M2 joins halfway down the 2 s bow
        expect(paths.m3.map(([, ms]) => ms)).toEqual([0, 200, 2000, 800, 2000, 800]);
        expect(paths.m2.map(([, ms]) => ms)).toEqual([0, 1200, 1000, 800, 1000, 1800]);
        expect(m.face.preset).toBe("blink");
        // forward-only bow: shoulder and elbow never behind rest, head pan (M1) still
        for (const id of ["shoulder_pitch", "elbow_pitch"]) expect(Math.min(...clip.tracks[id].map((k) => k.value))).toBeGreaterThanOrEqual(0);
        expect(new Set(paths.m1.map(([a]) => a)).size).toBe(1);
      }
      if (m.id === "sleep") {
        const sh = clip.tracks.shoulder_pitch.map((k) => k.value);
        expect(Math.max(...sh)).toBe(22); // shallower than doze's 35°
        const up = m.keys!.findIndex((k) => k.pose.shoulder_pitch === -6);
        expect(m.keys![up].t - m.keys![up - 1].t).toBeCloseTo(1.2); // slow rise
        expect(Math.max(...paths.m1.map(([a]) => Math.abs(a)))).toBe(8); // small head shake
        const shake = paths.m1.map(([a, ms]) => [a, ms]).filter(([a], i) => i > 0 && a !== 0);
        for (const [, ms] of shake) expect(ms).toBe(500); // slow head shake, 0.5 s per swing
      }
      if (m.id === "sad") {
        expect(m.face.keys?.[1]).toEqual({ t: 4.03, preset: "blink" }); // sad face once (the sob) first
        expect(Math.max(...paths.m1.map(([a]) => a))).toBe(18); // then glances left…
        expect(Math.min(...paths.m1.map(([a]) => a))).toBeLessThan(0); // …and right
      }
      if (m.id === "curious") {
        expect(Math.max(...clip.tracks.shoulder_pitch.map((k) => k.value))).toBe(16); // leans toward the viewer
        paths.m1.forEach(([a], i) => expect(Math.sign(a) * Math.sign(paths.m4[i][0])).toBeLessThanOrEqual(0)); // M1 against M4
      }
      if (m.id === "happy") {
        // exact keyframes: M4 turns exactly ±35°, and the robot code has one key per keyframe (no sampled overshoot)
        expect(paths.m4.map(([a]) => a)).toEqual([0, 0, 35, 0, -35, 0, 35, 0, -35, 0, 0]);
        expect(paths.m1.map(([a]) => a)).toEqual([0, 0, -25, 0, 25, 0, -25, 0, 25, 0, 0]); // head turns against the base
        expect(paths.m4.map(([, ms]) => ms)).toEqual([0, 500, 500, 500, 500, 500, 500, 500, 500, 600, 800]);
      }
    }
  });
});
