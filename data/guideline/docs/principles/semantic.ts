import type { ComponentDoc } from "../../types";

// Principle · Semantic — Face page layout (808:1649), content from the v3 structure doc §3-1.

export const semanticDoc: ComponentDoc = {
  breadcrumb: "Principle",
  lead: ["What to express, and when. Five principles from the main study (n=47).", "Every MUST guardrail comes from here."],
  rows: [
    {
      id: "principles",
      title: "Five principles",
      toc: "Principles",
      gap: 23,
      kind: "p-cards",
      columns: 3,
      label: "Derived rule",
      items: [
        {
          tag: "sp.1",
          title: "Context decides meaning",
          subtitle: "The same nod means \"yes\" after a question and \"hello\" at a first meeting. 49% read a nod as a greeting.",
          figure: { big: "49%", chips: ["Nod → greeting"] },
          info: "Every behavior has a trigger and a forbid condition",
        },
        {
          tag: "sp.2",
          title: "Not looking broken comes first",
          subtitle: "Irregular tremor, oversized motion, sudden acceleration. Perceived malfunction × overall rating r = −0.80 (pilot −0.76).",
          figure: { big: "r = −0.80", chips: ["Malfunction × rating"] },
          info: "No tremor · size limit · repeat twice",
        },
        {
          tag: "sp.3",
          title: "One meaning per motion",
          subtitle: "Nod (yes) and bow (greeting) are both up-down, so they are often confused.",
          figure: { chips: ["Nod", "Bow"] },
          info: "Confusable pairs differ in at least one of direction, start pose or timing",
        },
        {
          tag: "sp.4",
          title: "Body carries intensity; face and sound carry good or bad",
          subtitle: "Gesture alone conveys arousal but not valence. Sad → laughing 32%, fear → sneering 32%.",
          figure: { big: "32%", chips: ["Sad → laughing"] },
          info: "Negative emotion uses 2+ channels including face or sound. Otherwise do not express it.",
        },
        {
          tag: "sp.5",
          title: "Start, stop, return",
          subtitle: "Without a stop at the end it reads as \"still going\". 34% read pointing as \"looking around\".",
          figure: { chips: ["Start", "Stop", "Return"], flow: true },
          info: "End hold 0.3–0.5 s · repeat twice · return to rest",
        },
      ],
    },
    {
      id: "derived",
      title: "From principle to rule",
      toc: "Derived rules",
      text: "The principles are the grammar. The rules that the generator checks are derived from them.",
      gap: 28,
      kind: "p-bullets",
      heading: "Principles become checks",
      items: [
        "Every MUST guardrail (gr.*) names the principle it comes from — SP-1 to SP-5.",
        "Token combination rules (HARD H1–H7, SOFT S1–S3) add how tokens may be put together.",
      ],
      figure: { chips: ["SP-1–5", "MUST 8", "H1–H7 · S1–S3"], flow: true },
    },
    {
      id: "dont",
      title: "Don’t",
      gap: 27,
      kind: "p-donts",
      items: [
        { title: "Don't Act Without Context", text: "A behavior without a trigger and a forbid condition is not generated (SP-1).", figure: { chips: ["trigger", "forbid_when"] } },
        { title: "Don't Look Broken", text: "Irregular tremor, oversized motion and sudden acceleration read as a malfunction (SP-2).", figure: { big: "≈≈≈" } },
        { title: "Don't Show Negative Emotion With the Body Alone", text: "Negative emotion needs face or sound as well; otherwise it is not expressed (SP-4).", figure: { chips: ["body", "face · sound"], flow: true } },
      ],
    },
  ],
};
