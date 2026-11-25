import type { GuidelineSection } from "./types";

// Source: PURE guideline final structure v3 (2026-10-19) §10 Style.

const SRC = "PURE guideline final structure v3 (2026-10-19) §10";

export const STYLE_AXES = ["P1", "P2", "P3", "P4", "P5", "P6"] as const;
export const STYLE_AXIS_LABELS: Record<(typeof STYLE_AXES)[number], string> = {
  P1: "Reach", P2: "Speed contrast", P3: "Stillness", P4: "Afterglow", P5: "Anticipation", P6: "Return",
};
/** Style lab presets. Animation is the source example (§10-1); Cat, Dog and Drama are example values for the demo, not from the source. */
export const STYLE_PRESETS: { id: string; label: string; axes: Record<(typeof STYLE_AXES)[number], number>; example?: true }[] = [
  { id: "style.cat", label: "Cat", axes: { P1: 0.4, P2: 0.7, P3: 0.85, P4: 0.6, P5: 0.3, P6: 0.7 }, example: true },
  { id: "style.dog", label: "Dog", axes: { P1: 0.85, P2: 0.5, P3: 0.2, P4: 0.4, P5: 0.6, P6: 0.5 }, example: true },
  { id: "style.drama", label: "Drama", axes: { P1: 0.9, P2: 0.9, P3: 0.5, P4: 0.85, P5: 0.8, P6: 0.3 }, example: true },
  { id: "style.animation", label: "Animation", axes: { P1: 0.8, P2: 0.95, P3: 0.6, P4: 0.9, P5: 0.9, P6: 0.1 } },
];
/** ρ lab: one behavior per band (values inside the §7-1 ranges) */
export const RHO_EXAMPLES = [
  { slug: "joy", title: "Joy", band: "High", rho: 0.9 },
  { slug: "approach", title: "Approach", band: "Medium", rho: 0.55 },
  { slug: "nod", title: "Nod", band: "Low", rho: 0.25 },
];
/** Rules lab: tilt as the worked example (Primitive tilt: m 12°, SHOULD 6 to 20°, MUST max 30°) */
export const RANGE_EXAMPLE = { token: "tilt", unit: "°", source: 12, should: [6, 20] as [number, number], must: 30, max: 40 };

export const style: GuidelineSection = {
  id: "style",
  title: "Style",
  summary: "The motion character of a user or brand: the same tokens with different values, moved only inside SHOULD ranges.",
  entries: [
    {
      slug: "signature",
      title: "Signature",
      summary: "Six axes P1 to P6 (0 to 1) and a strength w set the style.",
      body: [
        {
          kind: "table",
          title: "Elements",
          view: "cards",
          head: ["Element", "Content"],
          rows: [
            ["Signature", "Six axes: P1 Reach, P2 Speed contrast, P3 Stillness, P4 Afterglow, P5 Anticipation, P6 Return (0 to 1)"],
            ["Strength w", "How strongly the style applies, set by the user (0 to 1)"],
            ["Presets", "Cat, Dog, Drama, Animation (same as the simulator)"],
            ["ρ link", "Damped per behavior by its style acceptance"],
          ],
        },
        {
          kind: "table",
          title: "In the Signature studio",
          view: "cards",
          head: ["Studio axis", "Style axis", "Channel"],
          rows: [
            ["Amplitude", "P1 Reach", "Motion"],
            ["Tempo", "P2 Speed contrast", "Motion"],
            ["Rhythm", "P3 Stillness (inverse: more repeats, fewer holds)", "Motion"],
            ["Settle", "P4 Afterglow and P6 Return (soft landing vs overshoot)", "Motion"],
            ["Anticipation", "P5 Anticipation", "Motion"],
            ["Eyes, Pitch, Density", "Not a P axis: face and sound defaults, bounded by the Face UI and Sound Effect principles", "Face, sound"],
          ],
        },
        {
          kind: "table",
          title: "Laban Effort link",
          view: "cards",
          head: ["Style axis", "Closest LMA quality", "Reading"],
          rows: [
            ["P1 Reach", "Shape and kinesphere (near ↔ far reach space)", "How much space the body claims"],
            ["P2 Speed contrast", "Effort Time (sustained ↔ sudden)", "Urgency of the move"],
            ["P3 Stillness", "Effort Flow, bound", "Control: holds and pauses"],
            ["P4 Afterglow", "Effort Flow, free", "Release: the tip keeps going and settles late"],
            ["P5 Anticipation", "Preparation phase (phrasing)", "Readiness before the main action"],
            ["P6 Return", "Recovery phase (phrasing)", "How completely the body comes back"],
          ],
        },
        { kind: "p", view: "note", text: "Laban Movement Analysis describes the quality of motion with Effort factors Space, Weight, Time and Flow (Laban & Lawrence 1947). EMOTE (Chi et al. 2000) and Knight & Simmons (2014) turned them into parameters for animated figures and mobile robots. PURE keeps its own six axes because they map one-to-one onto the generation operators; the table shows where each sits in LMA terms. Effort Weight and Space have no axis of their own: Weight is bounded by the amplitude cap, Space is fixed by the ARC and gaze rules." },
        {
          kind: "code",
          title: "Example",
          view: "radar",
          lang: "json",
          text: `{ "id": "style.animation", "axes": { "P1": 0.8, "P2": 0.95, "P3": 0.6, "P4": 0.9, "P5": 0.9, "P6": 0.1 },
  "strength_default": 0.7 }`,
        },
      ],
      related: ["animation", "rules"],
      source: `${SRC}-1`,
    },
    {
      slug: "presets",
      title: "Presets",
      summary: "Four starting styles. Signature examples (Dog, Butler, Cat) live here rather than on the face and sound principle pages.",
      body: [
        { kind: "list", title: "Presets", view: "tiles", items: ["style.cat: Cat", "style.dog: Dog", "style.drama: Drama", "style.animation: Animation"] },
      ],
      related: ["signature", "sources"],
      source: `${SRC}-1, §10-3`,
    },
    {
      slug: "rho",
      title: "Style acceptance ρ",
      summary: "Each behavior damps the style by its ρ, so personality shows where it can and agreed signals stay intact.",
      body: [
        { kind: "code", title: "Formula", view: "formula", lang: "text", text: "final = clamp( source + w × ρ × (style − source), guardrail range )" },
        {
          kind: "table",
          title: "ρ scale",
          view: "scale",
          head: ["ρ", "Meaning", "Examples"],
          rows: [
            ["High 0.8 to 0.95", "Style makes the personality", "Bow, Doze, Joy, Sad, Curious"],
            ["Medium 0.5 to 0.6", "Relationship signal: the shape is kept", "Approach, Keep distance"],
            ["Low 0.2 to 0.3", "Agreed signal: too much reads as broken", "Nod, Shake"],
          ],
        },
      ],
      related: ["pipeline", "component-spec"],
      source: `${SRC}-1, §7-1`,
    },
    {
      slug: "rules",
      title: "Style rules",
      summary: "Three rules every style follows.",
      body: [
        {
          kind: "list",
          title: "Rules",
          view: "checklist",
          items: [
            "Style changes only token values and operator parameters.",
            "It cannot cross the MUST guardrails.",
            "It moves only inside the operators' SHOULD ranges.",
          ],
        },
      ],
      related: ["guardrails", "animation"],
      source: `${SRC}-2`,
    },
  ],
};
