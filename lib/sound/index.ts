import { SoundScheduler } from "./scheduler";
import { WebAudioSynth } from "./synth";

export { SoundScheduler, LOOKAHEAD } from "./scheduler";
export { WebAudioSynth, cuePlan, dbToGain, BASE_HZ, QUIET_HOURS_DB, type CuePlan, type Synth, type Voice } from "./synth";

/** One per page, passed to <Viewport sound>. Safe to construct during SSR (no AudioContext yet). */
export function createSoundEngine(): SoundScheduler {
  return new SoundScheduler(new WebAudioSynth());
}
