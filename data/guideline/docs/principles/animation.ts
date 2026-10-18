import type { ComponentDoc } from "../../types";

// Principle · Animation — Face page layout (808:1649), content from the v3 structure doc §4 (Animation 6 = 8 operator IDs).

export const animationDoc: ComponentDoc = {
  breadcrumb: "Principle",
  lead: ["How to move. Six Disney principles with robotics evidence, used by AI as generation operators.", "Each has a default, an allowed range and a style axis."],
  rows: [
    {
      id: "operators",
      title: "Operators",
      text: "FOLLOW/REACT and AMP/OVER split into two operators each, so six principles make eight IDs.",
      gap: 28,
      kind: "p-cards",
      columns: 4,
      label: "Default · range",
      items: [
        { tag: "op.antic", title: "Anticipation", subtitle: "A small move the other way just before a big one.", figure: { big: "P5", chips: ["120 ms"] }, info: "7% of the main motion, 120 ms (turns: 2–3° back) · 80–400 ms. Never on S1 signals, repeats or idle.", proposed: true },
        { tag: "op.ease", title: "Ease", subtitle: "Start slow → fast → stop slow.", figure: { big: "P2", chips: ["in-out"] }, info: "Normal: ease-in-out · reaction: ease-out · fading exit: ease-in. Within motor speed and acceleration limits." },
        { tag: "op.arc", title: "Arc", subtitle: "Lift slightly and come down in a curve while turning.", figure: { big: "fixed", chips: ["4–8°"] }, info: "Tilt 4–8° during a turn, peak at 50%. Gaze first, body 0.1–0.2 s later." },
        { tag: "op.second", title: "Secondary action", subtitle: "A small supporting move after a big one (blink, breath …).", figure: { big: "P1", chips: ["≤ 30%"] }, info: "≤ 30% of the main motion, 0.15 s later, one at a time. No other axis during a promised signal." },
        { tag: "op.follow", title: "Follow-through", subtitle: "The tip settles late when stopping.", figure: { big: "P4", chips: ["1 wobble"] }, info: "Tip delay 0.06–0.12 s, one wobble. More than one = tremor = broken." },
        { tag: "op.react", title: "Reaction", subtitle: "① to a result, after the task (back slot) ② to a touch, right away.", figure: { big: "fixed", chips: ["≤ 0.3 s"] }, info: "Touch reaction within 0.3 s. The two sub-definitions await a decision.", proposed: true },
        { tag: "op.amp", title: "Amplitude", subtitle: "The upper bound of motion size — sized to the situation, not the emotion.", figure: { big: "P1", chips: ["40% ROM"] }, info: "ROM 40% · max 70%. Each repeat 30% smaller." },
        { tag: "op.over", title: "Overshoot", subtitle: "Pass the target slightly and come back.", figure: { big: "P6", chips: ["3–8%"] }, info: "3–8%, once · max 10%. Never on rest poses or precision tasks." },
      ],
    },
    {
      id: "axes",
      title: "Principles and style axes",
      toc: "Style axes",
      text: "A principle is an operator with its limits; an axis is the dial that turns it. Style moves the dial only up to the guardrail.",
      gap: 28,
      kind: "p-cards",
      columns: 3,
      label: "Guardrail",
      items: [
        { tag: "P1", title: "Engagement range", subtitle: "AMP per joint group · SECOND channel count", figure: { chips: ["AMP", "SECOND"] }, info: "Amplitude cap · joint limits" },
        { tag: "P2", title: "Speed contrast", subtitle: "EASE curve and timing", figure: { chips: ["EASE"] }, info: "Servo max speed" },
        { tag: "P3", title: "Stillness", subtitle: "Time tokens pause · hold", figure: { chips: ["pause", "hold"] }, info: "The end hold of pointing and closing never goes to 0 (SP-5)" },
        { tag: "P4", title: "Lingering", subtitle: "FOLLOW wobble and damping", figure: { chips: ["FOLLOW"] }, info: "One wobble · no irregular tremor" },
        { tag: "P5", title: "Anticipation", subtitle: "ANTIC size and length", figure: { chips: ["ANTIC"] }, info: "Never on promised signals · skipped on repeats" },
        { tag: "P6", title: "Return", subtitle: "Residual on return · OVER", figure: { chips: ["OVER"] }, info: "Repeated motions return fully" },
      ],
    },
    {
      id: "fixed",
      title: "Fixed quality rules",
      toc: "Fixed rules",
      gap: 27,
      kind: "p-compare",
      items: [
        { figure: { chips: ["Gaze", "Body"], flow: true }, caption: "Body 0.1–0.2 s after gaze", title: "ARC", text: "Not a style axis. Every turn arcs 4–8° with its peak at 50%." },
        { figure: { chips: ["Touch", "React"], flow: true }, caption: "Within 0.3 s", title: "REACT", text: "Not a style axis. Results get a back-slot reaction; touches get one at once." },
      ],
    },
  ],
};
