import type { ComponentDoc } from "../../types";

// Principle · Common (ch.common) — Face page layout (808:1649), content from the v3 structure doc §5-4.

export const commonDoc: ComponentDoc = {
  breadcrumb: "Principle",
  lead: ["These are the rules every channel shares: order, priority, fallback and state.", "State comes before behavior."],
  rows: [
    {
      id: "order",
      title: "Order",
      text: "Channels start one after another, 0.1 s apart.",
      gap: 28,
      kind: "p-flow",
      steps: [
        { label: "Sound", note: "0 s" },
        { label: "Face", note: "+0.1 s" },
        { label: "Body", note: "+0.2 s" },
      ],
      caption: "Sound → face → body",
    },
    {
      id: "priority",
      title: "Priority",
      text: "The one above interrupts the one below.",
      gap: 28,
      kind: "p-cards",
      columns: 4,
      label: "When",
      items: [
        { title: "Safety", figure: { big: "1" }, info: "Fall risk · strong force — within 0.1 s" },
        { title: "Call · touch", figure: { big: "2" }, info: "Turns to look within 1 s" },
        { title: "Conversation", figure: { big: "3" }, info: "Backchannel · answering a question" },
        { title: "Idle", figure: { big: "4" }, info: "Habits · breathing" },
      ],
    },
    {
      id: "fallback",
      title: "Fallback chain",
      toc: "Fallback",
      text: "When a channel is missing, another channel stands in; otherwise the expression is skipped.",
      gap: 28,
      kind: "p-flow",
      steps: [
        { label: "Channel missing" },
        { label: "Another channel", note: "stands in" },
        { label: "Skip", note: "if none can" },
      ],
      caption: "Never cover it by enlarging motion — the \"no screen → +20%\" rule is retired.",
    },
    {
      id: "states",
      title: "State before behavior",
      toc: "States",
      gap: 28,
      kind: "p-cards",
      columns: 4,
      label: "What changes",
      items: [
        { title: "Carried", figure: { chips: ["Lifted"] }, info: "Curl up, keep level, skip other behaviors" },
        { title: "Low battery", figure: { chips: ["Battery"] }, info: "Smaller, and doze earlier" },
        { title: "Quiet hours", figure: { chips: ["Night"] }, info: "Lower sound and smaller motion" },
        { title: "Error", figure: { chips: ["Error"] }, info: "Stop and tell with the face" },
      ],
    },
  ],
};
