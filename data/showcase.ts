import type { FaceSpec, Recipe, SoundSpec } from "@/lib/models";
import { cueAt } from "./sound-cues";

// Exhibition showcase (/showcase): five finished PURE Desk motions, built from our own sim behaviors
// (lib/sim/behaviors.ts) with face videos and sound cues. Tune speed / amplitude / repeat here.

export interface ShowcaseMotion {
  id: string;
  title: string;
  /** one line under the title */
  summary: string;
  /** Built from our sim behaviors… */
  recipe?: Recipe;
  /** …or exact keyframes (seconds, degrees by PURE Desk joint id; missing joints = 0), eased in-out between them like the
   *  robot firmware. Use these for the real-robot demo: no overshoot or bounce the servos can't follow. */
  keys?: { t: number; pose: Record<string, number> }[];
  /** …or each joint on its own timing: [seconds, degrees] per joint (overrides `keys` for that joint). Every track should end
   *  at the same time (the loop length) so the motors stay in step. */
  tracks?: Record<string, [number, number][]>;
  face: FaceSpec;
  sound: SoundSpec;
  /** Per-joint gain on the sampled motion (×, around 0°), e.g. a wider base turn (M4). Robot code is clamped to the motor's safe range. */
  gain?: Record<string, number>;
  /** Per-joint allowed range (degrees) after gain, e.g. [0, 90] = only forward of rest. */
  range?: Record<string, [number, number]>;
}

/** Happy bounce poses: up = shoulder and elbow back, down = rest height. */
const UP = { shoulder_pitch: -6, elbow_pitch: -10 };
const DOWN = { shoulder_pitch: 0, elbow_pitch: 0 };

/** Sleep: lowest nod and the woken-up pose (shoulder and elbow back = up). */
const SLEEP_LOW = { shoulder_pitch: 22, elbow_pitch: 7 };
const SLEEP_UP = { shoulder_pitch: -6, elbow_pitch: -10 };

/** Politely: the bow (forward only). */
const BOW = { shoulder_pitch: 19, elbow_pitch: 7 };
/** Sad: shoulders sink forward, head low. */
const SLUMP = { shoulder_pitch: 18, elbow_pitch: 7 };
/** Curious: lean toward the viewer and look up at them (visitors stand above the robot): shoulder forward, elbow (M2) well back. */
const LEAN_IN = { shoulder_pitch: 16, elbow_pitch: -24 };

export const SHOWCASE_MOTIONS: ShowcaseMotion[] = [
  {
    id: "happy",
    title: "Happy",
    summary: "Bounces up and down, turning side to side with joy.",
    // Exact keyframes for the real robot: lift (shoulder and elbow back = up), drop while the base (M4) turns 35° and the head (M1)
    // turns 25° the other way, four times.
    keys: [
      { t: 0, pose: {} },
      { t: 0.5, pose: UP },
      { t: 1.0, pose: { ...DOWN, base_yaw: 35, head_pan: -25 } },
      { t: 1.5, pose: UP },
      { t: 2.0, pose: { ...DOWN, base_yaw: -35, head_pan: 25 } },
      { t: 2.5, pose: UP },
      { t: 3.0, pose: { ...DOWN, base_yaw: 35, head_pan: -25 } },
      { t: 3.5, pose: UP },
      { t: 4.0, pose: { ...DOWN, base_yaw: -35, head_pan: 25 } },
      { t: 4.6, pose: {} },
      { t: 5.4, pose: {} },
    ],
    face: { preset: "heart" },
    sound: { cues: [cueAt("excited", 0.5), cueAt("cute-fond", 3.2)] },
  },
  {
    id: "politely",
    title: "Politely",
    summary: "Bows forward slowly and politely.",
    // Per-joint timing (greet's bow, forward only): the shoulder (M3) bows over 2 s; halfway down the elbow (M2) joins in.
    // On the way up the elbow straightens first, then the shoulder finishes. Head pan (M1) and base (M4) stay still.
    tracks: {
      shoulder_pitch: [[0, 0], [0.2, 0], [2.2, BOW.shoulder_pitch], [3.0, BOW.shoulder_pitch], [5.0, 0], [5.8, 0]],
      elbow_pitch: [[0, 0], [1.2, 0], [2.2, BOW.elbow_pitch], [3.0, BOW.elbow_pitch], [4.0, 0], [5.8, 0]],
    },
    // no smile, no side glances: centred eyes that only blink
    face: { preset: "blink" },
    sound: { cues: [cueAt("cute-excited", 1.2)] },
  },

  {
    id: "sleep",
    title: "Sleep",
    summary: "Nods off, wakes up slowly, and shakes off the sleep.",
    // Exact keyframes (doze, toned down for the real robot): sink forward in stages (max 22°, doze went to 35°), rise in 1.2 s
    // (slower than half the doze startle), then a slow, small head shake (M1, 0.5 s per swing) to shake off the sleep.
    keys: [
      { t: 0, pose: {} },
      { t: 1.6, pose: { shoulder_pitch: 8, elbow_pitch: 3 } },
      { t: 2.2, pose: { shoulder_pitch: 8, elbow_pitch: 3 } },
      { t: 4.6, pose: { shoulder_pitch: 18, elbow_pitch: 6 } },
      { t: 5.1, pose: { shoulder_pitch: 18, elbow_pitch: 6 } },
      { t: 6.0, pose: SLEEP_LOW },
      { t: 6.4, pose: SLEEP_LOW },
      { t: 7.6, pose: SLEEP_UP },
      { t: 8.1, pose: { ...SLEEP_UP, head_pan: 8 } },
      { t: 8.6, pose: { ...SLEEP_UP, head_pan: -8 } },
      { t: 9.1, pose: { ...SLEEP_UP, head_pan: 6 } },
      { t: 9.6, pose: { ...SLEEP_UP, head_pan: -4 } },
      { t: 10.1, pose: SLEEP_UP },
      { t: 11.1, pose: {} },
      { t: 11.8, pose: {} },
    ],
    face: { preset: "sleepy" },
    sound: { cues: [cueAt("sad-long", 1.2)] },
  },
  {
    id: "sad",
    title: "Sad",
    summary: "Droops with a sad face, then glances to the left.",
    // Exact keyframes: sink while the sad face plays twice (2 × 4.03 s), then turn the head (M1) and a little of the base (M4)
    // to the left and peek, as if checking whether anyone noticed. Left = + (check on the robot).
    keys: [
      { t: 0, pose: {} },
      { t: 2.2, pose: SLUMP },
      { t: 8.1, pose: SLUMP },
      { t: 9.1, pose: { ...SLUMP, head_pan: 18, base_yaw: 6 } },
      { t: 10.0, pose: { ...SLUMP, head_pan: 18, base_yaw: 6 } },
      { t: 10.5, pose: { ...SLUMP, head_pan: 10, base_yaw: 6 } },
      { t: 11.0, pose: { ...SLUMP, head_pan: 18, base_yaw: 6 } },
      { t: 11.8, pose: { ...SLUMP, head_pan: 18, base_yaw: 6 } },
      { t: 12.8, pose: SLUMP },
      { t: 14.0, pose: {} },
      { t: 14.6, pose: {} },
    ],
    // sad twice, then plain blinking eyes while it peeks
    face: { preset: "sad", keys: [{ t: 0, preset: "sad" }, { t: 8.07, preset: "blink" }] },
    sound: { cues: [cueAt("sad-long", 0.9)] },
  },

  {
    id: "curious",
    title: "Curious",
    summary: "Leans in toward you and tilts its head to look.",
    // Exact keyframes: lean forward toward the viewer (curious on PURE Desk leaned back), then look this way and that with the head and base turning against each other.
    keys: [
      { t: 0, pose: {} },
      { t: 0.2, pose: {} },
      { t: 1.3, pose: LEAN_IN },
      { t: 1.6, pose: LEAN_IN },
      // look this way and that: head (M1) and base (M4) turn against each other
      { t: 2.2, pose: { ...LEAN_IN, head_pan: -15, base_yaw: 10 } },
      { t: 2.9, pose: { ...LEAN_IN, head_pan: -15, base_yaw: 10 } },
      { t: 3.6, pose: { ...LEAN_IN, head_pan: 15, base_yaw: -10 } },
      { t: 4.3, pose: { ...LEAN_IN, head_pan: 15, base_yaw: -10 } },
      { t: 5.0, pose: { ...LEAN_IN, head_pan: -15, base_yaw: 10 } },
      { t: 5.7, pose: { ...LEAN_IN, head_pan: -15, base_yaw: 10 } },
      { t: 6.4, pose: { ...LEAN_IN, head_pan: 15, base_yaw: -10 } },
      { t: 7.1, pose: { ...LEAN_IN, head_pan: 15, base_yaw: -10 } },
      { t: 7.8, pose: LEAN_IN },
      { t: 8.9, pose: {} },
      { t: 9.5, pose: {} },
    ],
    face: { preset: "tilt" },
    sound: { cues: [cueAt("tilt", 1.4)] },
  },

];

export const SHOWCASE_STRINGS = {
  title: "PURE Motions",
  subtitle: "Five expressions on PURE Desk",
  replay: "Replay",
  loop: "Loop",
  robot: "Play on robot",
  robotOn: "Playing on robot",
  robotConnecting: "Connecting…",
  robotOffline: "Robot not found. Join the Robot-ESP32 Wi-Fi and try again.",
  code: "Robot code",
  codeDone: "Downloaded {file}. Upload it to the ESP32 with Arduino IDE.",
  codeFailed: "Couldn't build the robot code.",
};
