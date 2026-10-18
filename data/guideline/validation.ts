import type { GuidelineSection } from "./types";

// Source: PURE guideline final structure v3 (2026-10-19) §11 Validation.

const SRC = "PURE guideline final structure v3 (2026-10-19) §11";

export const validation: GuidelineSection = {
  id: "validation",
  title: "Validation",
  summary: "Two measures — recognition rate and perceived malfunction — and the checks that run after every generation.",
  entries: [
    {
      slug: "measures",
      title: "Two measures",
      summary: "Recognition rate (higher is better) and perceived malfunction (lower is better).",
      body: [
        {
          kind: "table",
          title: "Measures",
          head: ["Measure", "Meaning", "Criterion"],
          rows: [
            ["Recognition rate", "Share who read the intended meaning correctly (%)", "Strict criterion of the main study"],
            ["Perceived malfunction", "How much it feels broken (pt, converted to 0–100)", "Lower is better"],
          ],
        },
        {
          kind: "p",
          text: "GQS (likeability · safety · animacy · intelligence) is used as an outcome measure only. Because of scale assignment and presentation order, types are not compared with each other — only within the same scale.",
        },
      ],
      related: ["evidence", "units-evidence"],
      source: `${SRC}-1`,
    },
    {
      slug: "auto-checks",
      title: "Automatic checks",
      summary: "What is checked after generation, before anything reaches the robot.",
      body: [
        {
          kind: "table",
          title: "Checks",
          head: ["Check", "From"],
          rows: [
            ["The 8 MUST violations", "Principles › MUST guardrails"],
            ["HARD H1–H7 · SOFT S1–S2", "Principles › Token combination rules"],
            ["Robot joint and speed limits (26 of 60 Animation-style combinations exceed 400 °/s → clamp + notice)", "Template limits"],
            ["Tokens outside the dictionary", "Primitive Tokens › Notation"],
          ],
        },
      ],
      related: ["guardrails", "combination-rules"],
      source: `${SRC}-2`,
    },
    {
      slug: "evidence",
      title: "Evidence table",
      summary: "The single source for every evidence cell in Figma and on the web.",
      body: [
        {
          kind: "table",
          title: "Evidence table",
          head: ["Stimulus", "Recognition", "Main misread", "Perceived malfunction", "Other"],
          rows: [
            ["Shake", "91%", "", "", "Highest recognition of 17"],
            ["Nod", "", "Greeting 49%", "", ""],
            ["Bow", "", "", "44.7 (2nd)", ""],
            ["Point", "45%", "Looking around 34%", "", ""],
            ["Joy", "77%", "", "", ""],
            ["Laugh", "55% (gesture only)", "", "37.6", ""],
            ["Sad · Fear", "", "Laughing · sneering 32% each", "Fear (trembling) 52.8 (1st)", ""],
            ["Surprise", "", "", "38.7", ""],
            ["Curious", "", "", "24.1 (lowest of the emotions)", ""],
            ["Approach", "", "\"Just noticed\" 36%", "", ""],
            ["Keep distance", "79%", "", "15.6 (2nd lowest)", "Liking 67.7 (1st of 7) · comfort 61.9 (1st of 13)"],
            ["Close", "36%", "Waiting · resting 30%", "", ""],
            ["Rub", "85%", "", "10.6 (lowest)", "Liveliness 86.2 (highest of 34 combinations)"],
            ["Emphasis (rejected)", "Pilot 0%", "Urgent · annoyed", "41.5", ""],
          ],
        },
        { kind: "p", text: "To be checked once more against the raw data, especially the difference from the lenient criterion in the semantic guideline (e.g. Shake 87 vs 91)." },
      ],
      related: ["measures", "semantic"],
      source: `${SRC}-3`,
      proposed: true,
    },
  ],
};
