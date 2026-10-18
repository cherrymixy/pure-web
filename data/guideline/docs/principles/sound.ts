import type { ComponentDoc } from "../../types";

// Principle · Sound (ch.sound) — Face page layout (808:1649), content from the v3 structure doc §5-3, §5-4 (evidence: heuristic).

export const soundDoc: ComponentDoc = {
  breadcrumb: "Principle",
  lead: ["These are the rules for the robot's sound: one source sound per behavior.", "Emotion is pitch and tempo; timbre is the robot's character. Evidence: heuristic."],
  rows: [
    {
      id: "source",
      title: "One source sound",
      toc: "Source",
      text: "Every emotional variation comes from the behavior's one source sound.",
      gap: 28,
      kind: "p-bullets",
      heading: "Emotion = pitch + tempo",
      items: [
        "Up = positive or question, down = negative or closing. Fast = energy, slow = weight.",
        "Timbre is the robot's character. It never changes per emotion and is never mixed.",
      ],
      figure: { chips: ["Source", "± pitch", "× tempo"], flow: true },
    },
    {
      id: "variations",
      title: "Emotion variations",
      toc: "Variations",
      gap: 23,
      kind: "p-cards",
      columns: 4,
      label: "Variation",
      items: [
        { title: "Excited", figure: { big: "+5 st" }, info: "+5 st · 1.4×" },
        { title: "Curious", figure: { big: "+2 st" }, info: "+2 st · rising end" },
        { title: "Worried", figure: { big: "−3 st" }, info: "−3 st · slower" },
        { title: "Sad", figure: { big: "−6 st" }, info: "−6 st · fades out" },
      ],
    },
    {
      id: "order",
      title: "Order and frequency",
      toc: "Order",
      text: "Sound comes first, then face, then body, 0.1 s apart. It ends with a 1 s fade.",
      kind: "p-phases",
      phases: [
        { title: "Sound", time: "0 s", note: "Leads by 0.1 s" },
        { title: "Face", time: "+0.1 s", note: "Then the face" },
        { title: "Body", time: "+0.2 s", note: "1 s fade at the end" },
      ],
      loops: [
        { title: "Frequency", text: "At most 2 per 10 s,\nat least 0.8 s apart", chips: ["≤ 2 / 10 s", "≥ 0.8 s"] },
        { title: "No speaker", text: "Positive → body + face as is\nNegative → face if any, otherwise skip", chips: ["2 channels kept"] },
      ],
    },
    {
      id: "dont",
      title: "Don’t",
      gap: 27,
      kind: "p-donts",
      items: [
        { title: "Don't Change Timbre per Emotion", text: "Timbre is the robot's character. Emotion moves pitch and tempo only.", figure: { chips: ["Bright", "Soft", "Quiet"] } },
        { title: "Don't Sound on Every Glance", text: "No sound for every gaze shift; fewer during quiet hours.", figure: { big: "≤ 2 / 10 s" } },
        { title: "Don't Go Past 1.4×", text: "Faster than 1.4× reads as an alarm. No fast sound on a slow motion.", figure: { big: "> 1.4×" } },
      ],
    },
  ],
};
