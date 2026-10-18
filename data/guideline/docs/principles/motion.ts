import type { ComponentDoc } from "../../types";

// Principle · Motion (ch.body) — Face page layout (808:1649), content from the v3 structure doc §5-1.

export const motionDoc: ComponentDoc = {
  breadcrumb: "Principle",
  lead: ["These are the rules for handling the body: write for roles, not joints.", "Slow down near limits, gaze before body, and always start, stop and return."],
  rows: [
    {
      id: "roles",
      title: "Write for roles",
      toc: "Roles",
      text: "Not \"tilt the head\" but \"tilt the part that attends\". If a role is missing another part stands in; otherwise it is skipped.",
      gap: 28,
      kind: "p-bullets",
      heading: "Roles and limits",
      items: [
        "A missing role is taken by another part, or the motion is skipped (MUST).",
        "Slow down from ROM 85%. A motion that cannot be followed is scaled down as a whole, never clipped, and the user is told (MUST).",
        "Gaze first, body 0.1–0.2 s later, both in the same direction (SHOULD).",
      ],
      figure: { chips: ["Gaze", "Body"], flow: true },
    },
    {
      id: "phases",
      title: "Start, stop, return",
      toc: "Start · stop · return",
      text: "Every motion has three stages (MUST). While holding it still moves ±0.5° — frozen motion feels like a surveillance camera.",
      kind: "p-phases",
      phases: [
        { title: "Start", time: "+0.1–0.2 s", note: "Gaze leads, the body follows" },
        { title: "Stop", time: "±0.5°", note: "Hold the end pose with a micro motion" },
        { title: "Return", time: "rest", note: "Back to the original pose" },
      ],
      loops: [
        { title: "Touch", text: "Petting or holding a joint:\nfollow with 40% less force", chips: ["≤ 0.3 s", "SHOULD"] },
        { title: "Lifted", text: "Curl up and keep\nthe gaze level", chips: ["≤ 0.1 s", "MUST"] },
        { title: "Impact", text: "Stop expressing emotion\n→ protective pose", chips: ["MUST"] },
      ],
    },
    {
      id: "dont",
      title: "Don’t",
      gap: 27,
      kind: "p-donts",
      items: [
        { title: "Don't Move Joints Apart When Lifted", text: "While carried, joints moving independently read as broken.", figure: { chips: ["Lifted", "Curl up"], flow: true } },
        { title: "Don't Move Fast Near the Limit", text: "Slow down from ROM 85%; scale the whole motion down instead of clipping it.", figure: { big: "85% ROM" } },
        { title: "Don't Make Up for a Missing Face", text: "No enlarging motion to cover a missing face or sound — use another channel or skip.", figure: { chips: ["No face", "Bigger motion"] } },
      ],
    },
  ],
};
