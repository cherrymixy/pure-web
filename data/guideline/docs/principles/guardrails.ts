import type { ComponentDoc } from "../../types";

// Principle · Guardrails — Face page layout (808:1649), content from the v3 structure doc §1-2, §3-2 (IDs and checks are proposed there).

export const guardrailsDoc: ComponentDoc = {
  breadcrumb: "Principle",
  lead: ["Eight rules nobody can change. Breaking one reads as broken, misunderstood or unsafe.", "A violation is corrected automatically and the user is told."],
  rows: [
    {
      id: "rules",
      title: "MUST guardrails",
      toc: "Guardrails",
      text: "The IDs and check expressions are proposed. Thresholds such as cv 0.1 are set in the simulator.",
      gap: 28,
      kind: "p-cards",
      columns: 4,
      label: "Check (proposed)",
      items: [
        { tag: "gr.trigger", title: "Trigger and forbid", subtitle: "Every behavior has a trigger and a forbid condition.", figure: { big: "SP-1", chips: ["Not generated"] }, info: "trigger != null && forbid_when != null", proposed: true },
        { tag: "gr.no_irregular_tremor", title: "No irregular tremor", subtitle: "Repeats keep an even interval.", figure: { big: "SP-2", chips: ["Even rhythm"] }, info: "cv(interval) <= 0.1", proposed: true },
        { tag: "gr.amp_limit", title: "Size limit", subtitle: "ROM 40% by default, 70% at most.", figure: { big: "SP-2", chips: ["Scale down + notify"] }, info: "amp_pct_rom <= 70", proposed: true },
        { tag: "gr.one_meaning", title: "One meaning", subtitle: "Confusable pairs differ in at least one of direction, start pose or timing.", figure: { big: "SP-3", chips: ["Not generated"] }, info: "diff(axis, start_pose, timing) >= 1", proposed: true },
        { tag: "gr.negative_two_channels", title: "Negative = two channels", subtitle: "Negative emotion uses 2+ channels including face or sound.", figure: { big: "SP-4", chips: ["Emotion skipped"] }, info: "valence<0 → channels>=2 && (face||sound)", proposed: true },
        { tag: "gr.end_hold", title: "End hold", subtitle: "Pointing, closing and other signals hold 0.3–0.5 s at the end point.", figure: { big: "SP-5", chips: ["Hold inserted"] }, info: "hold_end_ms >= 300", proposed: true },
        { tag: "gr.repeat_max_2", title: "Repeat twice", subtitle: "Two repeats at most, then back to rest.", figure: { big: "SP-2 · 5", chips: ["Cut at 2, return"] }, info: "count(repeat) <= 2", proposed: true },
        { tag: "gr.response_time", title: "Response time", subtitle: "No silence over 1 s; within 0.1 s for safety.", figure: { big: "SP-2", chips: ["Small reaction"] }, info: "idle_gap_ms <= 1000, safety_latency_ms <= 100", proposed: true },
      ],
    },
    {
      id: "violation",
      title: "On violation",
      text: "MUST is HARD: the generator fixes the motion itself and tells the user what changed.",
      gap: 28,
      kind: "p-flow",
      steps: [
        { label: "Check", note: "After generation" },
        { label: "Correct", note: "Clamp · insert · cut · scale down" },
        { label: "Notify", note: "The user sees what changed" },
      ],
      caption: "Nobody can change a MUST — not the style, not the designer.",
    },
    {
      id: "levels",
      title: "MUST and SHOULD",
      toc: "Levels",
      gap: 27,
      kind: "p-compare",
      items: [
        { figure: { chips: ["Auto-correct", "Notify"], flow: true }, caption: "HARD", title: "MUST", text: "Breaking it reads as broken, misunderstood or unsafe. Nobody can change it." },
        { figure: { chips: ["Default", "Range"] }, caption: "SOFT — warning outside the range", title: "SHOULD", text: "A default and an allowed range. Style moves only inside the range; a designer may go outside with a warning." },
      ],
    },
  ],
};
