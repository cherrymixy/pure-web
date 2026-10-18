import type { GuidelineEntry, GuidelineSection } from "./types";

// Source: PURE guideline final structure v3 (2026-10-19) §6 Tokens (Primitive).
// Token entries: ref = tok.<channel>.<name>; the first table is the size/value table exported in pure.tokens JSON.

const SRC = "PURE guideline final structure v3 (2026-10-19)";

interface TokenSpec {
  slug: string;
  ref: string;
  title: string;
  summary: string;
  /** [size, value, use] */
  sizes: string[][];
  rules: string[];
  evidence: string;
  section: string;
  related?: string[];
  proposed?: true;
}

const token = (t: TokenSpec): GuidelineEntry => ({
  slug: t.slug,
  ref: t.ref,
  title: t.title,
  summary: t.summary,
  body: [
    { kind: "table", title: "Sizes", head: ["Size", "Value", "Use"], rows: t.sizes },
    { kind: "list", title: "Rules", items: t.rules },
    { kind: "p", title: "Evidence", text: t.evidence },
  ],
  related: t.related,
  source: `${SRC} ${t.section}`,
  group: t.section,
  ...(t.proposed ? { proposed: true as const } : {}),
});

export const primitiveTokens: GuidelineSection = {
  id: "primitive-tokens",
  title: "Primitive Tokens",
  summary:
    "Tokens name the smallest units of motion. Recipes call a name (tilt.m), never a raw value. \"Your own motion\" = the same tokens with different values.",
  entries: [
    {
      slug: "notation",
      group: "§6-1",
      title: "Notation and roles",
      summary: "How tokens are named, and the roles that map them onto any robot body.",
      body: [
        {
          kind: "table",
          title: "Notation",
          head: ["Item", "Rule"],
          rows: [
            ["ID", "tok.<channel>.<name>.<size> — e.g. tok.body.tilt.m, tok.face.eye.size.l"],
            ["Separator", "Dots only (no hyphens)"],
            ["Size names", "s small · m normal (default) · l large · max the line that must not be crossed"],
            ["Count", "18 = body 10 · face 4 · sound 4 (+ 3 face extensions)"],
            ["Nothing outside the dictionary", "Component recipes use only names in the dictionary. Add a token to the dictionary first if one is needed."],
          ],
        },
        {
          kind: "table",
          title: "Roles",
          head: ["Role", "What it does", "Real parts (examples)"],
          rows: [
            ["role.attend", "Gaze — where it looks", "Head · visor · robot-arm wrist · (no head) whole body"],
            ["role.posture", "Posture — height and tilt", "Torso · legs"],
            ["role.locomote", "Locomotion — distance", "Wheels · legs"],
            ["role.gesture", "Gesture — pointing a direction", "Arms"],
            ["role.face · role.voice · role.light", "Face, sound and light channels", "Screen · speaker · LED"],
          ],
        },
        {
          kind: "table",
          title: "Spatial tokens × roles",
          head: ["Spatial token", "Attend", "Posture", "Locomote", "Gesture"],
          rows: [
            ["tilt", "●", "●", "", ""],
            ["rotate", "●", "", "", "○"],
            ["track", "●", "", "", ""],
            ["approach", "", "○", "●", ""],
            ["retreat", "", "●", "●", ""],
          ],
        },
        {
          kind: "list",
          items: [
            "● main role · ○ stands in when the original role is missing.",
            "approach × posture ○ — without a locomotion role, lean the body forward to approach.",
            "rotate × gesture ○ — without an arm, turn the body to point.",
          ],
        },
      ],
      related: ["body", "tilt"],
      source: `${SRC} §6-1, §6-2`,
    },
    token({
      slug: "tilt",
      ref: "tok.body.tilt",
      title: "Tilt",
      summary: "Tilt the head or body sideways or forward.",
      sizes: [
        ["s", "6°", "Listening"],
        ["m", "12°", "Greeting · default"],
        ["l", "20°", "Curious"],
        ["max", "30°", "Upper bound"],
      ],
      rules: ["Tilt once and hold 0.4 s, gaze in the same direction.", "No continuous tilting and no left-right alternation."],
      evidence: "empirical (Curious perceived malfunction 24.1 pt, lowest of the 6 emotions).",
      section: "§6-3",
      related: ["behavior/curious", "notation"],
    }),
    token({
      slug: "rotate",
      ref: "tok.body.rotate",
      title: "Rotate",
      summary: "Turn left or right to look.",
      sizes: [
        ["s", "≤ 30°", "Glance"],
        ["m", "30–90°", "Look back"],
        ["l", "90–180°", "Large turn"],
        ["speed", "35% vmax", "Default speed"],
      ],
      rules: ["Turn on an arc (ARC), with one ANTIC before a large turn.", "No straight turns without settle."],
      evidence: "heuristic.",
      section: "§6-3",
    }),
    token({
      slug: "track",
      ref: "tok.body.track",
      title: "Track",
      summary: "Follow a person's face, hand or movement with the gaze.",
      sizes: [
        ["m", "0.2–0.4 s lag", "Default"],
        ["max", "±30° left-right", "Range"],
      ],
      rules: [
        "Keep level while carried.",
        "No instant precise tracking (feels like surveillance); do not stare at a passer-by until they are gone.",
        "Old name follow — renamed because it overlapped the FOLLOW principle (pending decision).",
      ],
      evidence: "heuristic.",
      section: "§6-3",
      proposed: true,
    }),
    token({
      slug: "approach",
      ref: "tok.body.approach",
      title: "Approach",
      summary: "Move toward a person or lean the body out.",
      sizes: [
        ["s", "0.15 BH", "Interest"],
        ["m", "0.3 BH", "Meeting"],
        ["l", "0.5 BH", "Welcome home (owner only)"],
      ],
      rules: ["Always stop and match eye height after approaching.", "No rushing in and no pushing on."],
      evidence: "empirical (without a stop, 36% read it as \"just noticed\").",
      section: "§6-3",
      related: ["behavior/approach"],
    }),
    token({
      slug: "retreat",
      ref: "tok.body.retreat",
      title: "Retreat",
      summary: "Move back or lower the body.",
      sizes: [
        ["s", "0.10 BH · height −5%", "Small"],
        ["m", "0.25 BH · −10%", "Default"],
        ["l", "0.40 BH · −15%", "Large"],
      ],
      rules: ["Hold 0.5 s after retreating.", "No trembling while retreating.", "Only toward strangers → reads as personality."],
      evidence: "empirical (Keep distance liking 67.7 pt, 1st of 7).",
      section: "§6-3",
      related: ["keep-distance"],
    }),
    token({
      slug: "pause",
      ref: "tok.time.pause",
      title: "Pause",
      summary: "A short stop between motions.",
      sizes: [
        ["s", "0.15 s", "Between repeats"],
        ["m", "0.3 s", "Default"],
        ["l", "0.5 s", "Emphasis"],
      ],
      rules: ["No reaction for over 1 s = malfunction.", "pause = between, hold = end point (pending decision); both have a 0.5 s value, so the definition tells them apart."],
      evidence: "empirical (SP-5).",
      section: "§6-4",
      related: ["hold"],
    }),
    token({
      slug: "hold",
      ref: "tok.time.hold",
      title: "Hold",
      summary: "Keep the arrived pose to settle the meaning (end point).",
      sizes: [
        ["s", "0.5 s", "Short"],
        ["m", "1.5–2 s", "Seeing off"],
        ["l", "Until the other person finishes speaking", "In conversation"],
      ],
      rules: ["±0.5° micro motion during the hold.", "Do not stare at one spot for minutes."],
      evidence: "heuristic.",
      section: "§6-4",
      related: ["pause"],
    }),
    token({
      slug: "delay",
      ref: "tok.time.delay",
      title: "Delay",
      summary: "Time from stimulus to reaction.",
      sizes: [
        ["s", "≤ 0.1 s", "Instant (safety)"],
        ["m", "0.3–0.7 s", "Response"],
        ["l", "+0.2 s", "Late (passer-by)"],
      ],
      rules: ["Total wait ≤ 1.2 s (H2).", "Over 1 s after a question looks like talking to itself."],
      evidence: "heuristic.",
      section: "§6-4",
    }),
    token({
      slug: "pulse",
      ref: "tok.time.pulse",
      title: "Pulse",
      summary: "Repeat the same motion at an even interval.",
      sizes: [["m", "90–120 per minute, twice at most", "Default"]],
      rules: ["30% smaller with each repeat; back to rest at the end."],
      evidence: "empirical (Joy recognition 77% / trembling fear perceived malfunction 52.8 pt).",
      section: "§6-4",
      related: ["joy"],
    }),
    token({
      slug: "drift",
      ref: "tok.time.drift",
      title: "Drift",
      summary: "A very small, slow sway while waiting, like breathing.",
      sizes: [["m", "3–5 s period, ≤ 2°", "Default"]],
      rules: ["Habit motions every 8–20 s, irregular.", "No regular repetition.", "Smaller when dark or quiet."],
      evidence: "hypothesis (idle intensity is an independent test variable).",
      section: "§6-4",
      related: ["by-your-side"],
    }),
    token({
      slug: "eye-size",
      ref: "tok.face.eye.size",
      title: "Eye size",
      summary: "How open the eyes are = attention and openness.",
      sizes: [
        ["s", "0.18", "Calm · shy"],
        ["m", "0.24", "Default"],
        ["l", "0.32", "Surprise · glad (max)"],
      ],
      rules: ["Ratio of screen height.", "Do not change size and shape at the same moment."],
      evidence: "face classes eyes and full.",
      section: "§6-5",
      related: ["face"],
    }),
    token({
      slug: "eye-angle",
      ref: "tok.face.eye.angle",
      title: "Eye angle",
      summary: "The tilt of the eyes.",
      sizes: [
        ["−", "−12°", "Worried"],
        ["m", "0°", "Default"],
        ["+", "+12°", "Curious"],
        ["max", "±20°", "Upper bound"],
      ],
      rules: ["Left-right asymmetry only when intended."],
      evidence: "face classes eyes and full.",
      section: "§6-5",
    }),
    token({
      slug: "eye-shape",
      ref: "tok.face.eye.shape",
      title: "Eye shape",
      summary: "The form of the eyes = carries valence.",
      sizes: [
        ["base", "Round · slightly covered · tilted", "Default"],
        ["emotion", "Half-moon (smile) · drooped (sad)", "Emotion"],
        ["state", "Closed · heart", "State"],
      ],
      rules: ["Switching to another family squashes first (SWAP).", "Eyes and body never tell different emotions."],
      evidence: "face classes eyes and full.",
      section: "§6-5",
    }),
    token({
      slug: "blink",
      ref: "tok.face.blink",
      title: "Blink",
      summary: "Blinking = being alive + the boundary between expressions.",
      sizes: [
        ["idle", "6–20 per minute (irregular)", "Usually"],
        ["change", "Once", "When the expression changes"],
        ["wake", "Twice", "When waking up"],
      ],
      rules: ["Close to 70% only (100% = switched off).", "No fixed interval."],
      evidence: "face classes eyes and full.",
      section: "§6-5",
    }),
    {
      slug: "face-extensions",
      group: "§6-5",
      title: "Face extensions",
      summary: "Extra face tokens for the full face class only.",
      body: [
        {
          kind: "table",
          title: "Extensions",
          head: ["ID", "Role"],
          rows: [
            ["tok.face.eyebrow", "Intensity and direction of the emotion"],
            ["tok.face.mouth", "Confirms the emotion"],
            ["tok.face.nose", "Identity — fixed to one per robot"],
          ],
        },
      ],
      related: ["face"],
      source: `${SRC} §6-5`,
    },
    token({
      slug: "pitch",
      ref: "tok.sound.pitch",
      title: "Pitch",
      summary: "Semitone shift from the source sound.",
      sizes: [
        ["−", "−6 st", "Sad · ending"],
        ["+", "+2 st (rising end)", "Curious"],
        ["++", "+5 st", "Joy"],
        ["max", "±6 st", "Upper bound"],
      ],
      rules: ["No repeated up-and-down inside one sound."],
      evidence: "heuristic; all values relative to the source sound.",
      section: "§6-6",
      related: ["sound"],
    }),
    token({
      slug: "tempo",
      ref: "tok.sound.tempo",
      title: "Tempo",
      summary: "Playback speed relative to the source sound.",
      sizes: [
        ["s", "0.7×", "Fear · dozing"],
        ["m", "1×", "Default"],
        ["l", "1.4×", "Joy (max)"],
      ],
      rules: ["Over 1.4× = alarm.", "No fast sound on a slow motion."],
      evidence: "heuristic.",
      section: "§6-6",
    }),
    token({
      slug: "timbre",
      ref: "tok.sound.timbre",
      title: "Timbre",
      summary: "The character of the sound.",
      sizes: [["m", "Bright · soft · quiet", "One per robot"]],
      rules: ["Fixed to one per robot. Never changed or mixed per emotion."],
      evidence: "heuristic.",
      section: "§6-6",
    }),
    token({
      slug: "length",
      ref: "tok.sound.length",
      title: "Length",
      summary: "Duration of the sound.",
      sizes: [
        ["s", "0.2 s", "Nod · surprise"],
        ["m", "0.4 s", "Curious"],
        ["l", "0.8 s", "Sad · ending"],
      ],
      rules: ["0.2–0.8 s; fade at the end.", "No looping of long sounds."],
      evidence: "heuristic. Volume is not a token; state (quiet hours …) sets it.",
      section: "§6-6",
    }),
  ],
};
