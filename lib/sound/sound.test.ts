import { describe, expect, it } from "vitest";
import { cueAt } from "@/data/sound-cues";
import type { SoundCue } from "@/lib/models";
import { SoundScheduler } from "./scheduler";
import { BASE_HZ, cuePlan, dbToGain, type Synth } from "./synth";

class FakeSynth implements Synth {
  clock = 10;
  played: { id: string; when: number; cancelled: boolean }[] = [];
  master = 0;
  quiet = false;
  now() {
    return this.clock;
  }
  play(cue: SoundCue, when: number) {
    const v = { id: cue.id, when, cancelled: false };
    this.played.push(v);
    return { cancel: () => (v.cancelled = true) };
  }
  setMasterDb(db: number) {
    this.master = db;
  }
  setQuietHours(on: boolean) {
    this.quiet = on;
  }
  live() {
    return this.played.filter((p) => !p.cancelled).map((p) => p.id);
  }
}

const spec = { cues: [cueAt("rising-chirp", 0, "a"), cueAt("signature", 1, "b"), cueAt("low-warm", 2, "c")] };

function setup() {
  const synth = new FakeSynth();
  const s = new SoundScheduler(synth);
  s.setSpec(spec);
  return { synth, s };
}

describe("cuePlan", () => {
  it("maps timbre, pitch, tempo and volume", () => {
    const p = cuePlan({ timbre: "bright", pitchSt: 12, tempo: 2, lengthS: 1, volumeDb: -20 });
    expect(p.type).toBe("triangle");
    expect(p.freq).toBeCloseTo(BASE_HZ * 2);
    expect(p.duration).toBeCloseTo(0.5);
    expect(p.gain).toBeCloseTo(0.1);
    expect(p.attack + p.release).toBeLessThanOrEqual(p.duration);
    expect(cuePlan({ timbre: "soft", pitchSt: -5, tempo: 1, lengthS: 0.6, volumeDb: 0 }).type).toBe("sine");
  });

  it("+2 st is higher", () => {
    const base = cueAt("low-warm", 0);
    expect(cuePlan({ ...base, pitchSt: base.pitchSt + 2 }).freq / cuePlan(base).freq).toBeCloseTo(Math.pow(2, 2 / 12));
  });

  it("dbToGain", () => {
    expect(dbToGain(0)).toBe(1);
    expect(dbToGain(-12)).toBeCloseTo(0.251, 3);
  });
});

describe("SoundScheduler", () => {
  it("schedules only cues inside the lookahead, then the rest as time advances", () => {
    const { synth, s } = setup();
    s.play(0);
    expect(synth.live()).toEqual(["a"]);
    s.sync(0.9, 1);
    expect(synth.live()).toEqual(["a", "b"]);
    expect(synth.played[1].when).toBeCloseTo(10.1);
    s.sync(1.0, 1);
    expect(synth.played).toHaveLength(2); // no duplicates
  });

  it("scales offsets by playback speed", () => {
    const { synth, s } = setup();
    s.sync(0, 0.5); // controller reports speed before play
    s.play(0.95);
    expect(synth.played.find((p) => p.id === "b")?.when).toBeCloseTo(10.1);
  });

  it("does not play cues before the play/seek position", () => {
    const { synth, s } = setup();
    s.play(1.5);
    s.sync(1.9, 1);
    expect(synth.live()).toEqual(["c"]);
  });

  it("seek cancels pending cues and re-arms from the new time", () => {
    const { synth, s } = setup();
    s.play(0.9);
    expect(synth.live()).toEqual(["b"]);
    s.seek(0);
    expect(synth.played[0].cancelled).toBe(true);
    expect(synth.live()).toEqual(["a"]);
  });

  it("pause cancels and ignores ticks; seek while paused stays silent", () => {
    const { synth, s } = setup();
    s.play(0);
    s.pause();
    s.sync(0.9, 1);
    s.seek(1.9);
    expect(synth.live()).toEqual([]);
  });

  it("re-arms cues on a loop wrap", () => {
    const { synth, s } = setup();
    s.play(0);
    s.sync(1.9, 1);
    s.sync(0.03, 1); // wrapped
    expect(synth.played.filter((p) => p.id === "a")).toHaveLength(2);
  });

  it("stop silences everything, preview plays immediately", () => {
    const { synth, s } = setup();
    s.preview(cueAt("signature", 0, "p"));
    expect(synth.played[0].when).toBe(10);
    s.play(0);
    s.stop();
    expect(synth.live()).toEqual([]);
  });

  it("quiet hours and master go to the synth", () => {
    const { synth, s } = setup();
    s.setQuietHours(true);
    s.setMasterDb(-6);
    expect(synth.quiet).toBe(true);
    expect(synth.master).toBe(-6);
  });
});
