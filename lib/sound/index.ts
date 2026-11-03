import { SoundScheduler } from "./scheduler";
import { SamplePlayer } from "./synth";

export { SoundScheduler, LOOKAHEAD } from "./scheduler";
export { SamplePlayer, cuePlan, dbToGain, QUIET_HOURS_DB, type CuePlan, type Synth, type Voice } from "./synth";

// One player (one AudioContext, decoded sounds cached) for the whole tab: a new one per page visit was never
// closed, and browsers cap live AudioContexts. Pages never play at the same time (one Viewport per page).
let player: SamplePlayer | null = null;

/** One per page, passed to <Viewport sound>. Safe to construct during SSR (no AudioContext yet). */
export function createSoundEngine(): SoundScheduler {
  return new SoundScheduler((player ??= new SamplePlayer()));
}
