import type { ComponentDoc, ComponentDocSection } from "../types";

// Pattern page for Face to Face — copy from Figma W03-8L "Patterns · Face to Face" (886:1629).

/** Per-channel Rule / Value table */
const rules = (id: string, title: string, text: string, rows: string[][]): ComponentDocSection => ({
  id,
  title,
  text,
  kind: "table",
  head: ["Rule", "Value"],
  widths: [300, null],
  cols: ["name", "body"],
  rows,
});

export const faceToFaceDoc: ComponentDoc = {
  breadcrumb: "Patterns",
  lead: ["Someone stops in front of the robot and looks at it. A pattern is a sequence of components, with rules for each channel."],
  resources: [{ label: "Open in Lab", href: "/lab" }],
  rows: [
    {
      id: "sequence",
      title: "Sequence",
      text: "Each step is a component. Time counts from the moment the person stops.",
      kind: "table",
      head: ["Step", "Component", "Time"],
      widths: [120, 480, null],
      cols: ["name", "body", "body"],
      rows: [
        ["1", "Curious · notice", "0 – 0.6 s"],
        ["2", "Approach · owner", "0.6 – 2.4 s"],
        ["3", "Nod · hello", "2.4 – 3.0 s"],
        ["4", "Idle with drift", "3.0 s – loop"],
      ],
    },
    rules("motion", "Motion", "Layout and spacing.", [
      ["Layout", "Face the person, head at eye level"],
      ["Spacing", "Stop 40–60 cm away, never closer than 30 cm"],
    ]),
    rules("face", "Face", "Transition and state.", [
      ["Transition", "Eyes widen 100 ms before the body moves"],
      ["State", "soft → wide → blink, back to soft when idle"],
    ]),
    rules("sound", "Sound", "Density and feedback.", [
      ["Density", "One cue per step, two at most"],
      ["Feedback", "Short rising cue on Nod"],
    ]),
    {
      id: "common",
      title: "Common",
      text: "Rules every channel follows in this pattern.",
      kind: "states",
      plain: true,
      items: [
        { state: "Sync", effect: "all channels start on the same beat" },
        { state: "Fallback", effect: "no face: motion +20% · no speaker: face carries the feedback" },
      ],
    },
  ],
};
