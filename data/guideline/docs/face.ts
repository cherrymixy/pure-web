import type { ComponentDoc } from "../types";

// Principle page for Face — copy from Figma W03-2L "Principle · Face UI" (808:1649). Section text: "\n" = line break.
// Sibling list (Common · Motion · Face · Sound) and prev / next come from the channel group in principles.ts.

export const faceDoc: ComponentDoc = {
  breadcrumb: "Principle",
  lead: [
    "These are the rules for handling the eyes, eyebrows, and mouth depicted on the screen.",
    'The face conveys what the body fails to express as "good and bad."',
  ],
  rows: [
    {
      id: "type",
      title: "Type",
      toc: "Common",
      gap: 23,
      kind: "face-types",
      label: "Available items",
      items: [
        { figure: "none", title: "None", subtitle: "No screen", text: "No face token → Emotion expression omitted" },
        { figure: "light", title: "Lighting", subtitle: "LED", text: "Eye size → Use brightness, blinking → Use flashing" },
        { figure: "eyes", title: "Only eyes", subtitle: "Eyes on the screen", text: "Four eye tokens" },
        { figure: "all", title: "All", subtitle: "Eyes · Eyebrows · Mouth", text: "Four eye tokens + eyebrows · mouth · nose" },
      ],
    },
    {
      id: "change",
      title: "What is changing?",
      text: "There is a basic face, and the expressions are variations of that face's attributes (size, angle, shape).\nThis means that any expression can be described using the same token, with only the values changing according to the style.",
      gap: 28,
      kind: "face-change",
      base: "Basic",
      arrow: "Just change the value",
      variants: [
        { emotion: "Surprise", caption: "Size up" },
        { emotion: "Aware", caption: "Angle +12°" },
        { emotion: "Smile", caption: "Shape Half-Moon" },
      ],
      valence: {
        title: "Expressions of Positivity and Negativity",
        bullets: [
          "Even a robot with just eyes can express emotions; the shape of the eyes conveys feelings (good and bad).",
          "If it has a full face with eyebrows and a mouth, the expression is determined in the order of eyes → eyebrows → mouth.",
        ],
        faces: [
          { name: "Smile", shape: "Half-moon" },
          { name: "Sadness", shape: "Droop" },
        ],
        orderLabel: "Order",
        order: ["Eye", "Eyebrow", "Mouth"],
      },
    },
    {
      id: "rhythm",
      title: "Rhythm of changing expressions",
      text: "When entering and leaving, it's quick; when staying, it's slow.\nDuring the stay, the form is fixed, and it moves slightly with a different rhythm for each emotion.",
      kind: "face-rhythm",
      phases: [
        { title: "When entering", time: "0.2–0.4 s", note: "Fast" },
        { title: "When staying", time: "1–7 s", note: "The form is fixed, but the rhythm varies with each emotion." },
        { title: "On the way back", time: "0.2–0.4 s", note: "Fast" },
      ],
      loops: [
        { title: "Laughter", text: "Consistent and frequent\nsmall bounces", chips: ["Quick", "Bouncy"] },
        { title: "Sadness", text: "A short tremor followed\nby a long pause", chips: ["Briefly sobbing", "Resting"] },
      ],
    },
    {
      id: "transition",
      title: "How to Change Expression",
      gap: 27,
      kind: "face-transitions",
      items: [
        { caption: "Smoothly continue", title: "Similar shapes", text: "Similar shapes are smoothly connected and changed through the middle." },
        { caption: "Slightly crumple and change it", title: "Different shapes", text: "For different shapes, slightly distort them and then change them." },
      ],
    },
    {
      id: "dont",
      title: "Don’t",
      gap: 27,
      kind: "face-donts",
      items: [
        { title: "Don't Mix Emotions", text: "Different expressions can blur the meaning. The face conveys a single emotion together." },
        { title: "Don't Tremble Irregularly", text: "Irregular trembling is interpreted as a malfunction. Movements while staying follow a set rhythm." },
        { title: "Don't Close Eyes Completely", text: "When fully closed, they appear as if turned off. Blinking only covers 70%." },
      ],
      blinkLabels: ["100%", "70%"],
    },
  ],
};
