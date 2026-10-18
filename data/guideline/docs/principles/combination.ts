import type { ComponentDoc } from "../../types";

// Principle · Combination rules — Face page layout (808:1649), content from the v3 structure doc §3-3 (PURE token-use rules).

export const combinationDoc: ComponentDoc = {
  breadcrumb: "Principle",
  lead: ["How tokens may be put together, checked over about 26,000 simulated combinations.", "HARD rules block generation; SOFT rules warn and allow."],
  rows: [
    {
      id: "beat",
      title: "One mind inside a beat",
      toc: "Beats",
      text: "A beat should feel like one state of mind. Between beats, contrast is free.",
      gap: 28,
      kind: "p-flow",
      steps: [
        { label: "Beat A", note: "One arousal level inside" },
        { label: "Beat B", note: "\"Quiet, then suddenly\" is allowed (S3)" },
      ],
      caption: "One mind inside a beat, freedom between beats.",
    },
    {
      id: "hard",
      title: "HARD — not generated",
      toc: "HARD",
      text: "The H1 and H3 thresholds are still written in the old units (AMP 1.2×, OVER > 10%) and will be restated in ROM %.",
      gap: 28,
      kind: "p-donts",
      items: [
        { title: "H1 Don't Stack Large AMP and OVER", text: "Large AMP and large OVER in one beat get loud.", figure: { chips: ["AMP l", "OVER l"] } },
        { title: "H2 Don't Wait Too Long", text: "delay + pause + ANTIC before moving ≤ 1.2 s, ≤ 0.8 s recommended.", figure: { big: "≤ 1.2 s" } },
        { title: "H3 Don't Overshoot Precise Tasks", text: "No OVER and limited AMP for precision tasks such as handing over an object.", figure: { chips: ["Handover", "OVER 0"] } },
        { title: "H4 Don't Break the Slots", text: "ANTIC once at the front; REACT · FOLLOW only after a finished main motion; no ANTIC on every beat.", figure: { chips: ["ANTIC", "Main", "REACT"], flow: true } },
        { title: "H5 Don't Decorate Idle", text: "No ANTIC · REACT · OVER in idle loops. Only continuous EASE breathing and micro SECOND.", figure: { chips: ["Idle loop"] } },
        { title: "H6 Don't Break Physics", text: "Min-jerk profile, minimum duration from vmax / amax, dead band.", figure: { chips: ["min-jerk", "vmax", "amax"] } },
        { title: "H7 Don't Send Two Commands to One Channel", text: "For example light breathing and a light pulse at the same time.", figure: { chips: ["Breath", "Pulse"] } },
      ],
    },
    {
      id: "soft",
      title: "SOFT — warning, then allowed",
      toc: "SOFT",
      gap: 27,
      kind: "p-compare",
      items: [
        { figure: { chips: ["Calm", "Excited"] }, caption: "S1 · warning", title: "Arousal match inside a beat", text: "Mixing calm and excited signals in one beat warns — e.g. slow but bouncy." },
        { figure: { chips: ["State", "Mood"] }, caption: "S2 · warning", title: "State match", text: "A motion mood far from the intended state warns." },
        { figure: { chips: ["Quiet", "Sudden"], flow: true }, caption: "S3 · allowed", title: "Contrast between beats", text: "\"Quiet, then suddenly\" is how surprise is staged." },
      ],
    },
  ],
};
