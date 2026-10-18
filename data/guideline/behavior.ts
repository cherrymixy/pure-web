import type { GuidelineEntry, GuidelineSection } from "./types";
import { approachDoc } from "./docs/approach";

// Source: PURE guideline final structure v3 (2026-10-19) §7 Component — 16 behaviors.
// Slugs = editor component ids (data/components.ts) with "_" → "-". simBehavior = the simulator behavior that plays it.

const SRC = "PURE guideline final structure v3 (2026-10-19) §7";

const RHO = { high: "High (0.8–0.95)", mid: "Medium (0.5–0.6)", low: "Low (0.2–0.3)" } as const;

interface Cmp {
  slug: string;
  title: string;
  type: string;
  summary: string;
  /** confirmed ρ, or a proposed one (shown as TBD) */
  rho: keyof typeof RHO | { proposed: keyof typeof RHO };
  evidence: string;
  confusable?: string;
  simBehavior: string;
  related?: string[];
}

const PAIRS: Record<string, string> = {
  nod: "Bow — axis (head pitch vs whole body) · start pose · timing (after a question vs arriving and leaving). Curious — axis (roll vs pitch) · count (1 vs 2).",
  bow: "Nod — axis (head pitch vs whole body) · start pose · timing.",
  curious: "Nod — axis (roll vs pitch) · count (1 vs 2).",
  approach: "Keep distance — direction.",
  "keep-distance": "Approach — direction. Fear — height change · face · target.",
  fear: "Keep distance — height change · face · target.",
  close: "Doze — timing (end of a conversation vs no input) · gaze (at the person vs none).",
  doze: "Close — timing (end of a conversation vs no input) · gaze (at the person vs none).",
};

const cmp = (c: Cmp): GuidelineEntry => {
  const proposed = typeof c.rho === "object";
  const rho = typeof c.rho === "object" ? `TBD (proposed: ${RHO[c.rho.proposed].toLowerCase()})` : RHO[c.rho];
  const pair = PAIRS[c.slug];
  return {
    slug: c.slug,
    ref: `cmp.${c.slug.replace(/-/g, "_")}`,
    title: c.title,
    summary: c.summary,
    body: [
      {
        kind: "table",
        title: "Spec",
        head: ["Field", "Value"],
        rows: [
          ["type", c.type],
          ["rho", rho],
          ["evidence", c.evidence],
          ...(pair ? [["confusable_with", pair]] : []),
        ],
      },
      {
        kind: "p",
        title: "Structure",
        text: "A behavior is one bundle of body, face and sound tracks. Its recipe uses roles and token names only, and it follows the MUST guardrails (trigger and forbid conditions, end hold, two repeats at most).",
      },
    ],
    related: c.related,
    simBehavior: c.simBehavior,
    source: SRC,
    ...(proposed ? { proposed: true as const } : {}),
  };
};

const COMPONENTS: Cmp[] = [
  { slug: "nod", title: "Nod", type: "S1 Symbolic", summary: "Two small nods right after a question, then back to rest.", rho: "low", evidence: "Nod → greeting misread 49%", simBehavior: "nod", related: ["bow", "conversation"] },
  { slug: "shake", title: "Shake", type: "S1 Symbolic", summary: "The agreed signal for \"no\", kept as it is.", rho: "low", evidence: "Recognition 91% (highest of 17)", simBehavior: "shake", related: ["behavior/nod", "conversation"] },
  { slug: "bow", title: "Bow", type: "S1 Symbolic", summary: "Only when arriving or leaving. Starts from a slight bow; never bows deeply.", rho: "high", evidence: "Perceived malfunction 44.7 pt (2nd of 17)", simBehavior: "greet", related: ["nod", "leave"] },
  { slug: "doze", title: "Doze", type: "S1 Symbolic (state behavior)", summary: "After a long time without input, slowly loses strength.", rho: "high", evidence: "—", simBehavior: "doze", related: ["close", "by-your-side"] },
  { slug: "point", title: "Point", type: "S2 Illustrator", summary: "Gaze first, body later, and a clear stop at the target.", rho: { proposed: "low" }, evidence: "Recognition 45%, 34% misread as \"looking around\"", simBehavior: "sweep", related: ["guiding"] },
  { slug: "joy", title: "Joy", type: "S3 Expressive", summary: "An even rhythm twice + a smiling face + a bright sound.", rho: "high", evidence: "Recognition 77% (the only emotion at 75% or above)", simBehavior: "happy", related: ["laugh", "feedback"] },
  { slug: "laugh", title: "Laugh", type: "S3 Expressive", summary: "The same rhythm as Joy, larger. Never used without a face.", rho: { proposed: "high" }, evidence: "Gesture-only recognition 55% · perceived malfunction 37.6 pt", simBehavior: "happy", related: ["joy", "feedback"] },
  { slug: "sad", title: "Sad", type: "S3 Expressive", summary: "Loses strength, sinks and stays there. No repeats.", rho: "high", evidence: "Sad → laughing misread 32%", simBehavior: "sad", related: ["feedback"] },
  { slug: "surprise", title: "Surprise", type: "S3 Expressive", summary: "Once, short, then straight back to rest.", rho: { proposed: "mid" }, evidence: "A large startled retreat: perceived malfunction 38.7 pt", simBehavior: "alert", related: ["sudden"] },
  { slug: "fear", title: "Fear", type: "S3 Expressive", summary: "Back off, lower and hold. A change of posture, not trembling.", rho: { proposed: "mid" }, evidence: "Trembling fear perceived malfunction 52.8 pt (highest of 17)", simBehavior: "alert", related: ["keep-distance", "sudden"] },
  { slug: "curious", title: "Curious", type: "S3 Expressive", summary: "When the input is unclear, tilt + hold.", rho: "high", evidence: "Perceived malfunction 24.1 pt (lowest of the 6 emotions)", simBehavior: "curious", related: ["primitive-tokens/tilt", "conversation"] },
  { slug: "approach", title: "Approach", type: "S4 Regulator", summary: "Approach, stop, and match eye height.", rho: "mid", evidence: "Without a stop, 36% read it as \"just noticed\"", simBehavior: "focus", related: ["keep-distance", "calling"] },
  { slug: "keep-distance", title: "Keep distance", type: "S4 Regulator", summary: "Back off and hold. Reads as personality, like a shy cat.", rho: "mid", evidence: "Recognition 79% · liking 67.7 pt (1st of 7)", simBehavior: "home", related: ["behavior/approach", "primitive-tokens/retreat"] },
  { slug: "close", title: "Close", type: "S4 Regulator", summary: "Watch like seeing someone off, hold, lower the sound and settle into rest.", rho: { proposed: "mid" }, evidence: "Recognition 36%, 30% misread as \"waiting · resting\"", simBehavior: "home", related: ["doze", "leave"] },
  { slug: "stretch", title: "Stretch", type: "S5 Adaptor", summary: "Now and then after a long wait. No meaning — a sign of being alive.", rho: { proposed: "high" }, evidence: "—", simBehavior: "wake", related: ["by-your-side"] },
  { slug: "rub", title: "Rub", type: "S5 Adaptor", summary: "Rub the body against a hand or object. Shows affection.", rho: { proposed: "high" }, evidence: "Recognition 85% · liveliness 86.2 pt · perceived malfunction 10.6 pt (lowest)", simBehavior: "happy", related: ["touching"] },
];

export const BEHAVIOR_SLUGS = COMPONENTS.map((c) => c.slug);

export const behavior: GuidelineSection = {
  id: "behavior",
  title: "Components",
  summary:
    "16 behaviors, each a bundle of body, face and sound tracks with trigger and forbid conditions, a style acceptance ρ and recognition features. Main-study stimuli 17 − 1 rejected (Emphasis) = 16.",
  entries: [
    ...COMPONENTS.map((c) => (c.slug === "approach" ? { ...cmp(c), doc: approachDoc } : cmp(c))),
    {
      slug: "component-spec",
      title: "Component spec",
      summary: "The fields every behavior has, the ρ scale, and the confusable pairs.",
      body: [
        {
          kind: "table",
          title: "Fields",
          head: ["Field", "Content", "Note"],
          rows: [
            ["id · name", "cmp.curious · {ko, en}", ""],
            ["type", "S1 Symbolic · S2 Illustrator · S3 Expressive · S4 Regulator · S5 Adaptor (Ekman & Friesen)", ""],
            ["meaning", "The meaning in one line", ""],
            ["trigger · forbid_when", "Trigger and forbid conditions", "SP-1, MUST"],
            ["valence · arousal", "Valence and arousal", "Used for SP-4"],
            ["channels_min", "Minimum number of channels", "2 for negative emotion"],
            ["rho", "Style acceptance", ""],
            ["recipe", "3 tracks (motion · face · sound), roles + token names only", "No joint names"],
            ["structure", "move > pause > return …", "SP-5"],
            ["guardrails", "MUST IDs that apply", ""],
            ["confusable_with", "Confusable pairs + how they differ", "SP-3"],
            ["recognize", "Features that identify the behavior in a source video (reuses P1–P6 measures)", "For AI input analysis"],
            ["fallback", "Substitute or skip when a role or channel is missing", ""],
            ["variants · states", "Variants and per-state overrides", ""],
            ["evidence", "{type, metric, value, scale, n}", ""],
            ["used_in", "Pattern IDs that use it", "Cross-reference"],
          ],
        },
        {
          kind: "table",
          title: "ρ scale",
          head: ["ρ", "Meaning"],
          rows: [
            [RHO.high, "Style makes the personality"],
            [RHO.mid, "Relationship signal — the shape is kept"],
            [RHO.low, "Agreed signal — too much reads as broken"],
          ],
        },
        {
          kind: "table",
          title: "Confusable pairs",
          head: ["Pair", "Told apart by"],
          rows: [
            ["Nod ↔ Bow", "Axis (head pitch vs whole body) · start pose · timing (after a question vs arriving and leaving)"],
            ["Curious ↔ Nod", "Axis (roll vs pitch) · count (1 vs 2)"],
            ["Approach ↔ Keep distance", "Direction"],
            ["Fear ↔ Keep distance", "Height change · face · target"],
            ["Close ↔ Doze", "Timing (end of a conversation vs no input) · gaze (at the person vs none)"],
          ],
        },
        {
          kind: "code",
          title: "Schema example",
          lang: "json",
          text: `{
  "id": "cmp.curious",
  "name": { "en": "Curious" },
  "type": "S3_expressive",
  "meaning": "Signals that the input is unclear",
  "trigger": ["input.ambiguous", "object.novel"],
  "forbid_when": ["user.speaking", "same_component_within_s < 5"],
  "valence": "neutral",
  "channels_min": 1,
  "rho": 0.85,
  "recipe": [
    { "track": "motion", "role": "ATTEND", "token": "tok.body.tilt", "size": "l", "t_ms": 0 },
    { "track": "motion", "token": "tok.time.pause", "size": "m", "after": "prev" },
    { "track": "face", "block": "eyes", "token": "tok.face.eye.angle", "value_deg": 12, "t_ms": 100 },
    { "track": "sound", "token": "tok.sound.pitch", "value_st": 2, "shape": "rising", "lead_ms": 100 }
  ],
  "structure": "move > pause > return",
  "guardrails": ["gr.repeat_max_2", "gr.no_irregular_tremor"],
  "confusable_with": [{ "id": "cmp.nod", "separate_by": ["axis: roll vs pitch", "count: 1 vs 2"] }],
  "recognize": { "attend_roll_peak_deg": [12, 30], "hold_after_peak_ms": [250, 600], "repeats": 1 },
  "fallback": { "ATTEND.roll missing": "POSTURE.tilt", "FACE none": "skip face track" },
  "evidence": [{ "type": "study", "metric": "malfunction", "value": 24.1, "scale": "0-100", "n": 47 }]
}`,
        },
      ],
      related: ["curious", "emphasis"],
      source: `${SRC}-2, §7-3`,
    },
    {
      slug: "emphasis",
      ref: "cmp.emphasis",
      title: "Emphasis (rejected)",
      summary: "Rejected: pilot recognition 0% — everyone read it as \"urgent · annoyed\". Absorbed into \"point once more\".",
      body: [
        { kind: "p", text: "Kept on record as REJECTED + Migration: uses of Emphasis move to Point repeated once." },
        { kind: "table", title: "Pilot result", head: ["Measure", "Value"], rows: [["Pilot recognition", "0%"], ["Main misread", "Urgent · annoyed"], ["Perceived malfunction", "41.5 pt"]] },
      ],
      related: ["point"],
      source: SRC,
    },
  ],
};
