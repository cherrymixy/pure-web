/**
 * Robot sound player (PRD §6 rule 11).
 *
 * A cue plays one recorded clip (data/sound-cues.ts, public/sounds) through Web Audio:
 * pitch in semitones = playback rate 2^(st/12), volume in dB. Clips are fetched and decoded
 * once, on first use. The AudioContext is created on first use (a click), never during SSR.
 */

import { SOUND_DIR, soundOf } from "@/data/sound-cues";
import type { SoundCue } from "@/lib/models";

/** Quiet hours: master offset in dB. */
export const QUIET_HOURS_DB = -12;
const FADE_OUT = 0.03;

export interface CuePlan {
  url: string;
  /** Playback rate from the pitch */
  rate: number;
  /** Seconds the clip lasts at that rate */
  duration: number;
  /** Linear gain */
  gain: number;
}

export const dbToGain = (db: number) => Math.pow(10, db / 20);

/** Pure cue → playback settings (unit-tested; SamplePlayer only plays them). null = unknown sound. */
export function cuePlan(cue: Pick<SoundCue, "sound" | "pitchSt" | "volumeDb">): CuePlan | null {
  const sound = soundOf(cue.sound);
  if (!sound) return null;
  const rate = Math.pow(2, cue.pitchSt / 12);
  return { url: SOUND_DIR + sound.file, rate, duration: sound.durationS / rate, gain: dbToGain(cue.volumeDb) };
}

export interface Voice {
  /** Stop it: unstarted voices never sound, playing ones fade out. */
  cancel(): void;
}

/** What the scheduler needs; tests pass a fake. */
export interface Synth {
  /** Audio clock in seconds. */
  now(): number;
  play(cue: SoundCue, when: number): Voice;
  setMasterDb(db: number): void;
  setQuietHours(on: boolean): void;
}

export class SamplePlayer implements Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private masterDb = 0;
  private quiet = false;
  private readonly buffers = new Map<string, Promise<AudioBuffer | null>>();

  private ensure(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.applyMaster();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private buffer(url: string): Promise<AudioBuffer | null> {
    let b = this.buffers.get(url);
    if (!b) {
      const ctx = this.ensure();
      b = fetch(url)
        .then((r) => r.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .catch(() => null);
      this.buffers.set(url, b);
    }
    return b;
  }

  now(): number {
    return this.ensure().currentTime;
  }

  play(cue: SoundCue, when: number): Voice {
    const ctx = this.ensure();
    const p = cuePlan(cue);
    let cancelled = false;
    let stop: (() => void) | null = null;
    if (p) {
      void this.buffer(p.url).then((buf) => {
        if (!buf || cancelled) return;
        // A clip that decodes late starts now instead of being skipped.
        const start = Math.max(when, ctx.currentTime);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.playbackRate.value = p.rate;
        const env = ctx.createGain();
        env.gain.value = p.gain;
        src.connect(env).connect(this.master!);
        src.start(start);
        src.onended = () => env.disconnect();
        stop = () => {
          const now = ctx.currentTime;
          try {
            if (now < start) return src.stop(now);
            env.gain.cancelScheduledValues(now);
            env.gain.setValueAtTime(env.gain.value, now);
            env.gain.linearRampToValueAtTime(0, now + FADE_OUT);
            src.stop(now + FADE_OUT + 0.01);
          } catch {
            // already stopped
          }
        };
      });
    }
    return {
      cancel: () => {
        cancelled = true;
        stop?.();
      },
    };
  }

  setMasterDb(db: number): void {
    this.masterDb = db;
    this.applyMaster();
  }

  setQuietHours(on: boolean): void {
    this.quiet = on;
    this.applyMaster();
  }

  private applyMaster(): void {
    if (!this.ctx || !this.master) return;
    const db = this.masterDb + (this.quiet ? QUIET_HOURS_DB : 0);
    this.master.gain.setTargetAtTime(dbToGain(db), this.ctx.currentTime, 0.02);
  }
}
