import type { ComponentDoc, ComponentDocSection } from "../types";

// Component pages for the 15 behaviors other than Approach — same structure and copy style as Approach (Figma 808:1254),
// content from PURE guideline final structure v3 (2026-10-19): §3 SP / MUST, §4 operators, §5 channels, §6 tokens, §7 components.
// Values are token values or rules from the md. The md gives no length for a move itself, so move clips in the
// Time Line are illustrative; holds, pauses, beats (pulse.m 90–120 / min → 0.5 s at 120), sound lengths and the
// channel order (sound 0.1 s → face → body, face holds 0.6 s after the body) are md values.

type Level = { title: string; chips: [string, string]; token: string };
type Clip = { from: number; to: number; label?: string; align?: "start" };

interface Spec {
  lead: [string, string];
  robot: string;
  notes: [string, string];
  intensity: string;
  levels: [Level, Level, Level];
  sound: { label: string; length: number } | null;
  face: string;
  /** motion clips after the 0.2 s start (sound 0.1 s → face 0.1 s → body) */
  motion: { label: string; length: number }[];
  variants: [string, string, string][];
  states: { lowBattery: string; quiet?: string };
  tokens: [string, "motion" | "face" | "sound" | "all", string, string][];
}

const CLASSES: Extract<ComponentDocSection, { kind: "robot" }>["classes"] = [
  { label: "Jointless Driving", icon: "wheel" },
  { label: "Joint Driving", icon: "wheel-arm" },
  { label: "Joint Fixed", icon: "arm" },
  { label: "Joint Walking", icon: "quad" },
  { label: "Full-body", icon: "human" },
];

const round = (n: number) => Math.round(n * 100) / 100;

/** §5-4 order: sound first, face 0.1 s later, body 0.1 s after that; face holds 0.6 s after the body stops (§5-2). */
function timeline(s: Spec): Extract<ComponentDocSection, { kind: "timeline" }>["tracks"] {
  let t = 0.2;
  const motion: Clip[] = s.motion.map((m) => {
    const c: Clip = { from: round(t), to: round(t + m.length), label: m.label, align: "start" };
    t += m.length;
    return c;
  });
  const faceEnd = round(t + 0.6);
  const tracks: Extract<ComponentDocSection, { kind: "timeline" }>["tracks"] = [];
  if (s.sound) tracks.push({ channel: "sound", label: "Sound", clips: [{ from: 0, to: s.sound.length, label: s.sound.label }] });
  tracks.push({ channel: "face", label: "Face", clips: [{ from: 0.1, to: faceEnd, label: s.face }] });
  tracks.push({ channel: "motion", label: "Motion", clips: motion });
  return tracks;
}

function doc(s: Spec): ComponentDoc {
  const tracks = timeline(s);
  const end = Math.max(...tracks.flatMap((t) => t.clips.map((c) => c.to)));
  return {
    breadcrumb: "Components",
    lead: s.lead,
    topToc: "Common",
    pages: [],
    resources: [{ label: "Open in Lab", href: "/lab" }, { label: "pure.json" }, { label: "Figma" }, { label: "Video" }],
    rows: [
      { id: "robot", title: "Robot", text: s.robot, gap: 36, kind: "robot", classes: CLASSES, selected: 2, notes: s.notes },
      {
        id: "intensity",
        title: "Intensity",
        text: s.intensity,
        kind: "intensity",
        levels: s.levels.map((l, i) => ({ title: l.title, chips: [...l.chips], token: l.token, reach: (i + 1) as 1 | 2 | 3 })),
      },
      {
        id: "timeline",
        title: "Time Line",
        toc: "Timeline",
        text: "Sound leads by 0.1 s, then the face, then the body. The face holds 0.6 s after the body stops.",
        kind: "timeline",
        duration: round(Math.ceil((end + 0.2) * 10) / 10),
        tracks,
      },
      [
        {
          id: "variant",
          title: "Variant",
          text: "Variants only change the combination of tokens, not the meaning.",
          kind: "table",
          head: ["Variant", "Change", "When"],
          widths: [117, 241, null],
          cols: ["key", "muted", "muted"],
          rows: s.variants,
        },
        {
          id: "state",
          title: "State",
          text: "The robot's status overrides or weakens its actions.",
          kind: "states",
          items: [
            { state: "Idle", effect: "play as is" },
            { state: "Quiet hours", effect: s.states.quiet ?? "sound lower, motion smaller" },
            { state: "Low battery", effect: s.states.lowBattery },
            { state: "Held / In-air", effect: "Omit → Carried" },
            { state: "Error", effect: "Stop + Face" },
          ],
        },
      ],
      {
        id: "token-spec",
        title: "Token Spec",
        text: "The token name is the same as Primitive tokens.",
        gap: 20,
        kind: "table",
        head: ["State", "Track", "Token", "Value"],
        widths: [139, 119, 259, null],
        cols: ["label", "track", "code", "text"],
        rows: [
          ...s.tokens,
          ["quiet hours", "sound", "volume", "lower · motion smaller"],
          ["held", "all", "override", "→ Carried"],
        ],
      },
    ],
  };
}

// Shared rows
const NO_DISPLAY: [string, string, string] = ["No display", "Face track skipped, motion unchanged", "no face screen"];
/** SP-4 / gr.negative_two_channels: a negative emotion needs face or sound and 2 channels, or it is not expressed */
const NEGATIVE_NO_FACE: [string, string, string] = ["No display", "Sound carries it; with no speaker either, omitted", "no face screen"];
const POSITIVE_NO_SPEAKER: [string, string, string] = ["No speaker", "Body + face as is", "no speaker"];

export const COMPONENT_DOCS: Record<string, ComponentDoc> = {
  nod: doc({
    lead: ["It's a small double nod that means yes.", "It's used right after a question, then the head returns to rest."],
    robot: "Nod uses the attend role (head pitch). Without a head the posture role tilts instead, and a robot with no face skips the face track.",
    notes: ["eye.size.m, blink ×1", "tilt.s ×2, pulse.m, pause.s"],
    intensity: "It stays small. The meaning lives in the two even beats, not in the size, so I only go up a size when the answer must be clear.",
    levels: [
      { title: "Light", chips: ["6°", "Listening"], token: "tilt.s" },
      { title: "Normal", chips: ["12°", "Answer"], token: "tilt.m" },
      { title: "Strong", chips: ["20°", "Clear yes"], token: "tilt.l" },
    ],
    sound: { label: "yes", length: 0.2 },
    face: "Soft",
    motion: [
      { label: "Nod", length: 0.5 },
      { label: "", length: 0.15 },
      { label: "Nod", length: 0.5 },
      { label: "Return", length: 0.3 },
    ],
    variants: [
      ["Listening", "tilt.s, no sound", "back-channel while talking"],
      ["Vs. Bow", "head pitch only, upright start", "after a question (SP-3)"],
      POSITIVE_NO_SPEAKER,
      NO_DISPLAY,
    ],
    states: { lowBattery: "tilt.s" },
    tokens: [
      ["never", "motion", "op.antic", "symbolic signal — no anticipation"],
      ["enabled", "motion", "tilt.s", "6° · pitch"],
      ["enabled", "motion", "pulse.m", "90–120 / min · 2 times max"],
      ["enabled", "motion", "pause.s", "0.15 s between beats"],
      ["enabled", "face", "blink", "1 time at change · 70 %"],
      ["enabled", "sound", "sound.length", "0.2 s · 0.1 s first"],
    ],
  }),

  shake: doc({
    lead: ["It's the agreed signal for no.", "It's played as is — even sideways, twice at most, then back to rest."],
    robot: "Shake uses the attend role (head pan). Without a head the whole body turns, and a robot with no face skips the face track.",
    notes: ["eye.angle 0°, blink ×1", "rotate.s ×2, pulse.m, pause.s"],
    intensity: "The form stays the same; only the size moves. Past the default the shake reads as broken, so it never goes beyond the cap.",
    levels: [
      { title: "Light", chips: ["≤ 30°", "Soft no"], token: "rotate.s" },
      { title: "Normal", chips: ["40 % ROM", "Default"], token: "op.amp" },
      { title: "Strong", chips: ["70 % ROM", "Cap"], token: "op.amp.max" },
    ],
    sound: { label: "no", length: 0.2 },
    face: "Soft",
    motion: [
      { label: "Shake", length: 0.5 },
      { label: "", length: 0.15 },
      { label: "Shake", length: 0.5 },
      { label: "Return", length: 0.3 },
    ],
    variants: [
      ["Repeat", "2nd swing 30 % smaller", "always (pulse rule)"],
      ["Wheeled", "Whole body turns", "no head"],
      ["No speaker", "Body + face as is", "no speaker"],
      NO_DISPLAY,
    ],
    states: { lowBattery: "rotate.s, smaller" },
    tokens: [
      ["never", "motion", "op.antic", "symbolic signal — no anticipation"],
      ["enabled", "motion", "rotate.s", "≤ 30° · 35 % vmax"],
      ["enabled", "motion", "pulse.m", "2 times · each 30 % smaller"],
      ["enabled", "motion", "pause.s", "0.15 s between swings"],
      ["enabled", "face", "blink", "1 time at change · 70 %"],
      ["enabled", "sound", "sound.length", "0.2 s · 0.1 s first"],
    ],
  }),

  bow: doc({
    lead: ["It's a greeting bow, only when someone arrives or leaves.", "It starts from a slightly bowed pose and never bows deep."],
    robot: "Bow uses the posture role (torso). A robot without a torso tilts the attend role, and one with no face skips the face track.",
    notes: ["eye.size.l, blink ×1", "tilt.m, hold.s"],
    intensity: "It depends on who is coming or going. A deep bow reads as broken, so even the strongest stays inside the tilt cap.",
    levels: [
      { title: "Light", chips: ["6°", "Passing"], token: "tilt.s" },
      { title: "Normal", chips: ["12°", "Greeting"], token: "tilt.m" },
      { title: "Strong", chips: ["20°", "Owner"], token: "tilt.l" },
    ],
    sound: { label: "hello", length: 0.4 },
    face: "Glad",
    motion: [
      { label: "Bow", length: 0.5 },
      { label: "Hold", length: 0.5 },
      { label: "Return", length: 0.3 },
    ],
    variants: [
      ["Owner", "tilt.l + hold.m", "when the owner returns home"],
      ["Leaving", "hold.m 1.5–2 s", "seeing someone off"],
      ["Vs. Nod", "whole body, bowed start", "arrival or leave (SP-3)"],
      NO_DISPLAY,
    ],
    states: { lowBattery: "tilt.s" },
    tokens: [
      ["enabled", "motion", "tilt.m", "12° · greeting"],
      ["enabled", "motion", "hold.s", "0.5 s"],
      ["enabled", "motion", "op.amp", "≤ 40 % ROM · no deep bow"],
      ["enabled", "face", "eye.size.l", "0.32"],
      ["enabled", "face", "blink", "1 time at change · 70 %"],
      ["enabled", "sound", "sound.length", "0.4 s · 0.1 s first"],
    ],
  }),

  doze: doc({
    lead: ["It's a slow loss of strength after a long time without input.", "It's a state behavior — it starts earlier when the battery is low."],
    robot: "Doze uses the posture role (torso and head sink). A robot with no face keeps only the slow sink; nothing is enlarged to make up for it.",
    notes: ["eye.shape closed, decay", "drift.m, tilt.s"],
    intensity: "It depends on how long it has been quiet. My eyes close a little more at each step.",
    levels: [
      { title: "Light", chips: ["0.18", "Calm"], token: "eye.size.s" },
      { title: "Normal", chips: ["half-covered", "Drowsy"], token: "eye.shape" },
      { title: "Strong", chips: ["closed", "Asleep"], token: "eye.shape" },
    ],
    sound: { label: "0.7×", length: 0.8 },
    face: "Decay",
    motion: [
      { label: "Sink", length: 1.2 },
      { label: "Drift", length: 3 },
    ],
    variants: [
      ["Dark room", "drift smaller", "dark or quiet (§6-4)"],
      ["Vs. Close", "no gaze target", "no input, not end of talk"],
      ["Low battery", "starts earlier", "battery low (§5-4)"],
      NO_DISPLAY,
    ],
    states: { lowBattery: "starts earlier" },
    tokens: [
      ["enabled", "motion", "drift.m", "3–5 s period · ≤ 2°"],
      ["enabled", "motion", "op.ease", "ease-in (losing strength)"],
      ["enabled", "face", "eye.shape", "half-covered → closed"],
      ["enabled", "face", "loop", "decay · monotonic fall"],
      ["enabled", "sound", "sound.tempo", "0.7× · 0.8 s · fade"],
    ],
  }),

  point: doc({
    lead: ["It points out a direction: gaze first, body after, a clear stop at the target.", "It's used for guiding — where something is or which way to go."],
    robot: "Point uses the gesture role (arm). Without an arm the body turns to point (rotate × gesture), and the gaze always leads.",
    notes: ["eye.size.m, blink ×1", "rotate.m, hold 0.3–0.5 s"],
    intensity: "It depends on where the target is. I turn as far as it takes, then stop clearly so it isn't read as looking around.",
    levels: [
      { title: "Light", chips: ["≤ 30°", "Nearby"], token: "rotate.s" },
      { title: "Normal", chips: ["30–90°", "Aside"], token: "rotate.m" },
      { title: "Strong", chips: ["90–180°", "Behind"], token: "rotate.l" },
    ],
    sound: { label: "there", length: 0.2 },
    face: "Soft",
    motion: [
      { label: "Gaze", length: 0.15 },
      { label: "Body", length: 0.5 },
      { label: "Hold", length: 0.5 },
      { label: "Return", length: 0.3 },
    ],
    variants: [
      ["Once more", "point again once", "replaces rejected Emphasis"],
      ["No arm", "body turns to point", "no gesture role"],
      ["Big turn", "op.antic once before", "rotate.m and up"],
      NO_DISPLAY,
    ],
    states: { lowBattery: "rotate smaller" },
    tokens: [
      ["enabled", "motion", "op.antic", "opposite 2–3° · 120 ms"],
      ["enabled", "motion", "rotate.m", "30–90° · 35 % vmax · arc"],
      ["enabled", "motion", "op.arc", "body 0.1–0.2 s after gaze"],
      ["enabled", "motion", "gr.end_hold", "0.3–0.5 s at the target"],
      ["enabled", "face", "blink", "1 time at change · 70 %"],
      ["enabled", "sound", "sound.length", "0.2 s · 0.1 s first"],
    ],
  }),

  joy: doc({
    lead: ["It's an even rhythm twice, with a smiling face and a bright sound.", "It's used to react to a good result."],
    robot: "Joy uses the posture role for the bounce, the face for the smile and the voice for the bright sound. With no speaker, body and face play as is.",
    notes: ["eye.shape smile, bounce", "pulse.m ×2, return"],
    intensity: "It depends on how good the news is. The rhythm stays even; I add a beat, then the bright sound.",
    levels: [
      { title: "Light", chips: ["×1", "Pleased"], token: "pulse.m" },
      { title: "Normal", chips: ["×2", "Joy"], token: "pulse.m" },
      { title: "Strong", chips: ["+5 st · 1.4×", "Excited"], token: "sound.pitch" },
    ],
    sound: { label: "+5 st", length: 0.4 },
    face: "Smile",
    motion: [
      { label: "Bounce", length: 0.5 },
      { label: "Bounce", length: 0.5 },
      { label: "Return", length: 0.3 },
    ],
    variants: [
      ["Repeat", "2nd beat 30 % smaller", "always (pulse rule)"],
      ["Style", "ρ high — style shows most", "any preset"],
      POSITIVE_NO_SPEAKER,
      NO_DISPLAY,
    ],
    states: { lowBattery: "pulse ×1, smaller" },
    tokens: [
      ["never", "motion", "op.antic", "repeating motion — no anticipation"],
      ["enabled", "motion", "pulse.m", "90–120 / min · 2 times max"],
      ["enabled", "face", "eye.shape", "half-moon (smile)"],
      ["enabled", "face", "loop", "bounce · 0.32 s period"],
      ["enabled", "sound", "sound.pitch", "+5 st · 1.4× · 0.1 s first"],
    ],
  }),

  laugh: doc({
    lead: ["It's the same rhythm as Joy, larger.", "It's never used without a face — the body alone reads as broken."],
    robot: "Laugh uses the posture role for the bounce and the face for the smile. A robot with no face does not laugh at all.",
    notes: ["eye.shape smile, bounce", "pulse.m ×2, op.amp"],
    intensity: "It depends on how funny it is. I grow the bounce up to the cap and speed the sound up, never past them.",
    levels: [
      { title: "Light", chips: ["40 % ROM", "Smile"], token: "op.amp" },
      { title: "Normal", chips: ["1.4×", "Laugh"], token: "sound.tempo" },
      { title: "Strong", chips: ["70 % ROM", "Cap"], token: "op.amp.max" },
    ],
    sound: { label: "1.4×", length: 0.4 },
    face: "Smile",
    motion: [
      { label: "Bounce", length: 0.5 },
      { label: "Bounce", length: 0.5 },
      { label: "Return", length: 0.3 },
    ],
    variants: [
      ["Repeat", "2nd beat 30 % smaller", "always (pulse rule)"],
      ["Vs. Joy", "larger, same rhythm", "something is funny"],
      POSITIVE_NO_SPEAKER,
      ["No display", "Omitted — never without a face", "no face screen"],
    ],
    states: { lowBattery: "Joy instead, smaller" },
    tokens: [
      ["never", "motion", "op.antic", "repeating motion — no anticipation"],
      ["enabled", "motion", "pulse.m", "90–120 / min · 2 times max"],
      ["enabled", "motion", "op.amp", "40 % ROM · max 70 %"],
      ["enabled", "face", "loop", "bounce · 0.32 s period"],
      ["enabled", "sound", "sound.tempo", "1.4× (max) · 0.1 s first"],
    ],
  }),

  sad: doc({
    lead: ["It loses strength, sinks and stays there. No repeats.", "It's used to react to a bad result — always with the face or a sound."],
    robot: "Sad uses the posture role to lower the body. As a negative emotion it needs the face or a sound as well; with neither, it is not expressed.",
    notes: ["eye.shape droop, sob_burst", "retreat.m height, hold"],
    intensity: "It depends on how bad it is. I sink lower step by step and stay there; I never shake.",
    levels: [
      { title: "Light", chips: ["−5 %", "Let down"], token: "retreat.s" },
      { title: "Normal", chips: ["−10 %", "Sad"], token: "retreat.m" },
      { title: "Strong", chips: ["−15 %", "Very sad"], token: "retreat.l" },
    ],
    sound: { label: "−6 st", length: 0.8 },
    face: "Droop",
    motion: [
      { label: "Sink", length: 0.8 },
      { label: "Hold", length: 0.5 },
    ],
    variants: [
      ["Vs. Laugh", "face + sound required", "SP-4 (misread 32 %)"],
      ["No speaker", "Face carries it", "no speaker"],
      NEGATIVE_NO_FACE,
      ["Neither", "Not expressed", "no face, no speaker"],
    ],
    states: { lowBattery: "retreat.s" },
    tokens: [
      ["enabled", "motion", "retreat.m", "height −10 % · ease-in"],
      ["enabled", "motion", "hold.s", "0.5 s · no repeat"],
      ["enabled", "face", "eye.shape", "droop"],
      ["enabled", "face", "loop", "sob_burst · 2 bursts → 0.5 s rest"],
      ["enabled", "sound", "sound.pitch", "−6 st · 0.8 s · fades out"],
    ],
  }),

  surprise: doc({
    lead: ["It's a reaction to something sudden: once, short, then straight back to rest.", "It's used for unexpected sounds or movement."],
    robot: "Surprise uses the face first (eyes open wide) and the attend role for a small start. A large startled retreat reads as broken, so the body stays small.",
    notes: ["eye.size.l, saccade", "tilt.s, retreat.s"],
    intensity: "It depends on how sudden it was. My eyes do most of it; the body only adds a small start.",
    levels: [
      { title: "Light", chips: ["0.32", "Eyes only"], token: "eye.size.l" },
      { title: "Normal", chips: ["6°", "Start"], token: "tilt.s" },
      { title: "Strong", chips: ["0.10 BH", "Step back"], token: "retreat.s" },
    ],
    sound: { label: "!", length: 0.2 },
    face: "Wide",
    motion: [
      { label: "Start", length: 0.3 },
      { label: "Hold", length: 0.15 },
      { label: "Return", length: 0.3 },
    ],
    variants: [
      ["Once", "no repeat", "always"],
      ["Large retreat", "replaced by retreat.s", "malfunction 38.7 pt"],
      POSITIVE_NO_SPEAKER,
      NO_DISPLAY,
    ],
    states: { lowBattery: "eyes only" },
    tokens: [
      ["enabled", "face", "eye.size.l", "0.32 (max)"],
      ["enabled", "face", "loop", "saccade · still-move-still"],
      ["enabled", "motion", "tilt.s", "6°"],
      ["enabled", "motion", "pause.s", "0.15 s, then back"],
      ["enabled", "sound", "sound.length", "0.2 s · 0.1 s first"],
    ],
  }),

  fear: doc({
    lead: ["It backs off, lowers and holds — a change of posture, never trembling.", "It's used when something feels threatening; with the face or a sound as well."],
    robot: "Fear uses the locomote and posture roles to back off and lower. As a negative emotion it needs the face or a sound; trembling is never used.",
    notes: ["eye.angle −12°, eye.size.s", "retreat.m, hold"],
    intensity: "It depends on how close the threat is. I back off further and lower more, then hold still.",
    levels: [
      { title: "Light", chips: ["0.10 BH", "Wary"], token: "retreat.s" },
      { title: "Normal", chips: ["0.25 BH", "Afraid"], token: "retreat.m" },
      { title: "Strong", chips: ["0.40 BH", "Scared"], token: "retreat.l" },
    ],
    sound: { label: "0.7×", length: 0.8 },
    face: "Worried",
    motion: [
      { label: "Back off", length: 0.8 },
      { label: "Hold", length: 0.5 },
    ],
    variants: [
      ["Vs. Keep distance", "lower + worried face", "a threat, not a stranger"],
      ["No tremble", "posture change only", "gr.no_irregular_tremor"],
      NEGATIVE_NO_FACE,
      ["Neither", "Not expressed", "no face, no speaker"],
    ],
    states: { lowBattery: "retreat.s" },
    tokens: [
      ["enabled", "motion", "retreat.m", "0.25 BH · height −10 %"],
      ["enabled", "motion", "hold", "0.5 s after backing off"],
      ["enabled", "face", "eye.angle", "−12° (worried)"],
      ["enabled", "face", "eye.size.s", "0.18"],
      ["enabled", "sound", "sound.tempo", "0.7× · −3 st · slower"],
    ],
  }),

  curious: doc({
    lead: ["It's a head tilt and a hold when the input is unclear.", "It's never used while the user is speaking, or twice within 5 s."],
    robot: "Curious uses the attend role (head roll). Without one the posture role tilts instead; a robot with no face skips the face track.",
    notes: ["eye.angle +12°, none", "tilt.l, pause.m"],
    intensity: "It depends on how unclear it was. I tilt once and hold, never side to side.",
    levels: [
      { title: "Light", chips: ["6°", "Listening"], token: "tilt.s" },
      { title: "Normal", chips: ["12°", "Default"], token: "tilt.m" },
      { title: "Strong", chips: ["20°", "Curious"], token: "tilt.l" },
    ],
    sound: { label: "+2 st ↗", length: 0.4 },
    face: "Tilt",
    motion: [
      { label: "Tilt", length: 0.5 },
      { label: "Pause", length: 0.3 },
      { label: "Return", length: 0.3 },
    ],
    variants: [
      ["Vs. Nod", "roll, once", "not pitch, not twice (SP-3)"],
      ["No roll", "posture.tilt", "no attend roll"],
      ["No speaker", "Body + face as is", "no speaker"],
      NO_DISPLAY,
    ],
    states: { lowBattery: "tilt.s" },
    tokens: [
      ["enabled", "motion", "tilt.l", "20° · once · gaze same way"],
      ["enabled", "motion", "pause.m", "0.3 s"],
      ["enabled", "face", "eye.angle", "+12°"],
      ["enabled", "face", "loop", "none · fully still"],
      ["enabled", "sound", "sound.pitch", "+2 st · rising · 0.4 s · 0.1 s first"],
    ],
  }),

  "keep-distance": doc({
    lead: ["It backs off and holds. It reads as personality, like a shy cat.", "It's used only with strangers."],
    robot: "Keep distance uses the locomote role to back off and the posture role to lower. A robot that cannot move lowers only.",
    notes: ["eye.size.s, blink ×1", "retreat.m, hold 0.5 s"],
    intensity: "It depends on how unfamiliar the person is. I back off a little more each step, then stop.",
    levels: [
      { title: "Light", chips: ["0.10 BH", "Shy"], token: "retreat.s" },
      { title: "Normal", chips: ["0.25 BH", "Stranger"], token: "retreat.m" },
      { title: "Strong", chips: ["0.40 BH", "Wary"], token: "retreat.l" },
    ],
    sound: null,
    face: "Calm",
    motion: [
      { label: "Back off", length: 0.8 },
      { label: "Hold", length: 0.5 },
    ],
    variants: [
      ["Vs. Approach", "opposite direction", "stranger, not owner"],
      ["Vs. Fear", "no height drop, calm face", "a person, not a threat"],
      ["No locomotion", "lower only", "fixed robot"],
      NO_DISPLAY,
    ],
    states: { lowBattery: "retreat.s" },
    tokens: [
      ["enabled", "motion", "retreat.m", "0.25 BH · height −10 %"],
      ["enabled", "motion", "hold", "0.5 s after backing off"],
      ["enabled", "face", "eye.size.s", "0.18 (shy)"],
      ["enabled", "face", "blink", "1 time at change · 70 %"],
    ],
  }),

  close: doc({
    lead: ["It sees someone off: it watches, holds, lowers the sound and settles into rest.", "It's used at the end of a conversation."],
    robot: "Close uses the attend role to keep watching, then the posture role to settle. A robot with no face keeps the watch and the hold only.",
    notes: ["eye.size.m, blink ×1", "track, hold.m, settle"],
    intensity: "It depends on how long we talked. I watch longer before I settle.",
    levels: [
      { title: "Light", chips: ["0.5 s", "Short"], token: "hold.s" },
      { title: "Normal", chips: ["1.5–2 s", "Seeing off"], token: "hold.m" },
      { title: "Strong", chips: ["until done", "Talking"], token: "hold.l" },
    ],
    sound: { label: "−6 st", length: 0.8 },
    face: "Soft",
    motion: [
      { label: "Watch", length: 0.5 },
      { label: "Hold", length: 1.5 },
      { label: "Settle", length: 0.8 },
    ],
    variants: [
      ["Vs. Doze", "gaze at the person", "end of talk, not no input"],
      ["Fake exit", "settle delayed", "they come back (§8-2)"],
      ["No speaker", "Body + face as is", "no speaker"],
      NO_DISPLAY,
    ],
    states: { lowBattery: "hold.s" },
    tokens: [
      ["enabled", "motion", "track", "0.2–0.4 s lag · within 30°"],
      ["enabled", "motion", "hold.m", "1.5–2 s"],
      ["enabled", "motion", "gr.end_hold", "≥ 0.3 s before rest"],
      ["enabled", "face", "blink", "1 time at change · 70 %"],
      ["enabled", "sound", "sound.pitch", "−6 st · 0.8 s · 1 s fade"],
    ],
  }),

  stretch: doc({
    lead: ["It's a stretch now and then after a long wait.", "It has no meaning — it's a sign of being alive."],
    robot: "Stretch uses the posture role and secondary channels (breathing, blink). Nothing replaces it when a part is missing; it is simply smaller.",
    notes: ["blink ×2, eye.size.m", "op.amp, drift habit"],
    intensity: "It depends on how long I've waited. A habit is tiny; a real stretch stays within the default size.",
    levels: [
      { title: "Light", chips: ["≤ 2°", "Habit"], token: "drift.m" },
      { title: "Normal", chips: ["40 % ROM", "Stretch"], token: "op.amp" },
      { title: "Strong", chips: ["70 % ROM", "Cap"], token: "op.amp.max" },
    ],
    sound: null,
    face: "Wake",
    motion: [
      { label: "Stretch", length: 1.2 },
      { label: "Hold", length: 0.5 },
      { label: "Return", length: 0.5 },
    ],
    variants: [
      ["Habit", "8–20 s, irregular", "while waiting (§6-4)"],
      ["Dark room", "smaller", "dark or quiet"],
      ["Waking", "blink ×2 first", "from Doze"],
      NO_DISPLAY,
    ],
    states: { lowBattery: "habit only" },
    tokens: [
      ["enabled", "motion", "op.amp", "≤ 40 % ROM"],
      ["enabled", "motion", "op.second", "≤ 30 % · 0.15 s after"],
      ["enabled", "motion", "hold.s", "0.5 s"],
      ["enabled", "face", "blink", "2 times on waking · 70 %"],
    ],
  }),

  rub: doc({
    lead: ["It rubs the body against a hand or an object. It shows affection.", "It's used when someone touches or strokes the robot."],
    robot: "Rub uses the posture role to lean into the touch and follows the hand with 40 % less force within 0.3 s. A robot with no face keeps the body only.",
    notes: ["eye.shape smile, float", "approach.s, pulse.m ×2"],
    intensity: "It depends on how long I'm being stroked. I lean in first, then rub along with the hand.",
    levels: [
      { title: "Light", chips: ["0.15 BH", "Lean in"], token: "approach.s" },
      { title: "Normal", chips: ["×2", "Rub"], token: "pulse.m" },
      { title: "Strong", chips: ["heart", "Affection"], token: "eye.shape" },
    ],
    sound: null,
    face: "Smile",
    motion: [
      { label: "Lean", length: 0.3 },
      { label: "Rub", length: 0.5 },
      { label: "Rub", length: 0.5 },
      { label: "Return", length: 0.3 },
    ],
    variants: [
      ["Touch", "follow, force −40 %", "stroked (within 0.3 s)"],
      ["Joint held", "follow, no resistance", "a joint is grabbed"],
      ["No speaker", "Body + face as is", "no speaker"],
      NO_DISPLAY,
    ],
    states: { lowBattery: "lean only" },
    tokens: [
      ["enabled", "motion", "op.react", "touch · within 0.3 s · force −40 %"],
      ["enabled", "motion", "approach.s", "0.15 BH"],
      ["enabled", "motion", "pulse.m", "2 times · each 30 % smaller"],
      ["enabled", "face", "eye.shape", "half-moon (smile)"],
    ],
  }),
};
