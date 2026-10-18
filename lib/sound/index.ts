import { SoundScheduler } from "./scheduler";
import { SamplePlayer } from "./synth";

export { SoundScheduler, LOOKAHEAD } from "./scheduler";
export { SamplePlayer, cuePlan, dbToGain, QUIET_HOURS_DB, type CuePlan, type Synth, type Voice } from "./synth";

/** One per page, passed to <Viewport sound>. Safe to construct during SSR (no AudioContext yet). */
export function createSoundEngine(): SoundScheduler {
  return new SoundScheduler(new SamplePlayer());
}
