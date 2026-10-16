/**
 * Plays a SoundSpec on the sim's playback clock (SimController's SoundEngine).
 *
 * The controller reports play / pause / seek / stop and a 30 Hz `sync(t, speed)`.
 * Each sync schedules the cues falling in the next LOOKAHEAD seconds on the audio
 * clock, so timing does not depend on the tick jitter. A backwards jump in `t`
 * while playing is a loop wrap: cues are re-armed from 0.
 */

import type { SoundCue, SoundSpec } from "@/lib/models";
import type { SoundEngine } from "@/components/sim/sim-controller";
import type { Synth, Voice } from "./synth";

/** Seconds of playback time scheduled ahead of the clock. */
export const LOOKAHEAD = 0.25;
/** A backwards jump bigger than this is a wrap, not jitter. */
const WRAP = 0.1;

export class SoundScheduler implements SoundEngine {
  private spec: SoundSpec | null = null;
  private playing = false;
  private speed = 1;
  /** Cues with t ≥ from are still due (play/seek position, 0 after a wrap). */
  private from = 0;
  private lastT = 0;
  private readonly voices = new Map<string, Voice>();
  private readonly previews: Voice[] = [];

  constructor(private readonly synth: Synth) {}

  setSpec(spec: SoundSpec | null): void {
    this.cancelAll();
    this.spec = spec;
    if (this.playing) this.schedule(this.lastT);
  }

  preview(cue: SoundCue): void {
    this.previews.forEach((v) => v.cancel());
    this.previews.splice(0, this.previews.length, this.synth.play(cue, this.synth.now()));
  }

  play(t: number): void {
    this.cancelAll();
    this.playing = true;
    this.from = this.lastT = t;
    this.schedule(t);
  }

  pause(): void {
    this.playing = false;
    this.cancelAll();
  }

  seek(t: number): void {
    this.cancelAll();
    this.from = this.lastT = t;
    if (this.playing) this.schedule(t);
  }

  stop(): void {
    this.playing = false;
    this.cancelAll();
    this.previews.forEach((v) => v.cancel());
    this.previews.length = 0;
  }

  /** Called on every sim tick with the playback time and speed. */
  sync(t: number, speed: number): void {
    this.speed = speed > 0 ? speed : 1;
    if (!this.playing) return;
    if (t < this.lastT - WRAP) {
      // Loop wrap: let ringing cues finish, re-arm from the top.
      this.voices.clear();
      this.from = 0;
    }
    this.lastT = t;
    this.schedule(t);
  }

  setMasterDb(db: number): void {
    this.synth.setMasterDb(db);
  }

  setQuietHours(on: boolean): void {
    this.synth.setQuietHours(on);
  }

  private schedule(t: number): void {
    const cues = this.spec?.cues;
    if (!cues?.length) return;
    const now = this.synth.now();
    for (const cue of cues) {
      if (this.voices.has(cue.id) || cue.t < this.from || cue.t >= t + LOOKAHEAD) continue;
      // Late cues (between `from` and t) start now; the rest at their offset.
      const when = now + Math.max(0, (cue.t - t) / this.speed);
      this.voices.set(cue.id, this.synth.play(cue, when));
    }
  }

  private cancelAll(): void {
    this.voices.forEach((v) => v.cancel());
    this.voices.clear();
  }
}
