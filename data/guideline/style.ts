import type { GuidelineSection } from "./types";

// Source: PURE guideline final structure v3 (2026-10-19) §10 Style.

const SRC = "PURE guideline final structure v3 (2026-10-19) §10";

export const style: GuidelineSection = {
  id: "style",
  title: "Style",
  summary: "The motion character of a user or brand: the same tokens with different values, moved only inside SHOULD ranges.",
  entries: [
    {
      slug: "signature",
      title: "Signature",
      summary: "Six axes P1–P6 (0–1) and a strength w set the style.",
      body: [
        {
          kind: "table",
          title: "Elements",
          head: ["Element", "Content"],
          rows: [
            ["Signature", "Six axes: P1 Reach · P2 Speed contrast · P3 Stillness · P4 Afterglow · P5 Anticipation · P6 Return (0–1)"],
            ["Strength w", "How strongly the style applies, set by the user (0–1)"],
            ["Presets", "Cat · Dog · Drama · Animation (same as the simulator)"],
            ["ρ link", "Damped per behavior by its style acceptance"],
          ],
        },
        {
          kind: "code",
          title: "Example",
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
        { kind: "list", title: "Presets", items: ["style.cat — Cat", "style.dog — Dog", "style.drama — Drama", "style.animation — Animation"] },
      ],
      related: ["signature", "sources"],
      source: `${SRC}-1, §10-3`,
    },
    {
      slug: "rho",
      title: "Style acceptance ρ",
      summary: "Each behavior damps the style by its ρ, so personality shows where it can and agreed signals stay intact.",
      body: [
        { kind: "code", title: "Formula", lang: "text", text: "final = clamp( source + w × ρ × (style − source), guardrail range )" },
        {
          kind: "table",
          title: "ρ scale",
          head: ["ρ", "Meaning", "Examples"],
          rows: [
            ["High 0.8–0.95", "Style makes the personality", "Bow · Doze · Joy · Sad · Curious"],
            ["Medium 0.5–0.6", "Relationship signal — the shape is kept", "Approach · Keep distance"],
            ["Low 0.2–0.3", "Agreed signal — too much reads as broken", "Nod · Shake"],
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
