/**
 * Web Audio cue synth (PRD §6 rule 11).
 *
 * A cue is one enveloped oscillator: timbre bright = triangle / soft = sine,
 * pitch in semitones from A4, tempo × shortens the tone, volume in dB.
 * The AudioContext is created on first use (a click), never during SSR.
 */

import type { SoundCue } from "@/lib/models";

export const BASE_HZ = 440;
/** Quiet hours: master offset in dB. */
export const QUIET_HOURS_DB = -12;
const SILENT = 0.0001;
const FADE_OUT = 0.03;

export interface CuePlan {
  type: OscillatorType;
  freq: number;
  /** Seconds, lengthS / tempo */
  duration: number;
  /** Linear peak gain */
  gain: number;
  attack: number;
  release: number;
}

export const dbToGain = (db: number) => Math.pow(10, db / 20);

/** Pure cue → oscillator settings (unit-tested; WebAudioSynth only plays them). */
export function cuePlan(cue: Pick<SoundCue, "timbre" | "pitchSt" | "tempo" | "lengthS" | "volumeDb">): CuePlan {
  const duration = Math.max(cue.lengthS / Math.max(cue.tempo, 0.05), 0.05);
  const soft = cue.timbre === "soft";
  const attack = Math.min(soft ? 0.08 : 0.015, duration * 0.3);
  return {
    type: soft ? "sine" : "triangle",
    freq: BASE_HZ * Math.pow(2, cue.pitchSt / 12),
    duration,
    gain: dbToGain(cue.volumeDb),
    attack,
    release: Math.min(duration * (soft ? 0.5 : 0.35), duration - attack),
  };
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

export class WebAudioSynth implements Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private masterDb = 0;
  private quiet = false;

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

  now(): number {
    return this.ensure().currentTime;
  }

  play(cue: SoundCue, when: number): Voice {
    const ctx = this.ensure();
    const p = cuePlan(cue);
    const start = Math.max(when, ctx.currentTime);
    const end = start + p.duration;

    const osc = ctx.createOscillator();
    osc.type = p.type;
    osc.frequency.value = p.freq;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(p.gain, start + p.attack);
    env.gain.setValueAtTime(p.gain, end - p.release);
    env.gain.exponentialRampToValueAtTime(SILENT, end);
    osc.connect(env).connect(this.master!);
    osc.start(start);
    osc.stop(end + 0.02);
    osc.onended = () => env.disconnect();

    return {
      cancel: () => {
        const now = ctx.currentTime;
        try {
          if (now < start) return osc.stop(now);
          env.gain.cancelScheduledValues(now);
          env.gain.setValueAtTime(env.gain.value, now);
          env.gain.linearRampToValueAtTime(0, now + FADE_OUT);
          osc.stop(now + FADE_OUT + 0.01);
        } catch {
          // already stopped
        }
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
