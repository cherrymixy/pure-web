import type { ComponentDoc } from "../types";

// Component page for Approach — copy from Figma W03-4L "Components · Approach" (808:1254).
// The Robot description is Korean in Figma; translated here (UI copy is English).
// Token names and values follow the v3 dictionary (§6, §7): Figma still shows the old ones (approach.l/n/s in cm, eye-size 0.30,
// "no display → +20%", "→ Moving"). Siblings and prev / next come from the behavior section like every other page.

export const approachDoc: ComponentDoc = {
  breadcrumb: "Components",
  lead: [
    "It's a welcoming action where you approach, stop, and match the user's eye level.",
    "It's used when the user is returning home or calling the robot.",
  ],
  topToc: "Common",
  resources: [{ label: "Open in Lab", href: "/lab" }, { label: "pure.json" }, { label: "Figma" }, { label: "Video" }],
  rows: [
    {
      id: "robot",
      title: "Robot",
      text: "Approach is made of three modals. Each modal maps to a part of the robot, and a modal without that part follows a fallback rule.",
      gap: 36,
      kind: "robot",
      classes: [
        { label: "Jointless Driving", icon: "wheel" },
        { label: "Joint Driving", icon: "wheel-arm" },
        { label: "Joint Fixed", icon: "arm" },
        { label: "Joint Walking", icon: "quad" },
        { label: "Full-body", icon: "human" },
      ],
      selected: 2,
      notes: ["eye.size.l, blink ×1", "approach.m, pause.m, tilt.s"],
    },
    {
      id: "intensity",
      title: "Intensity",
      text: "It depends on how close I should get. I choose based on who the other person is and how long we've been apart.",
      kind: "intensity",
      levels: [
        { title: "Light", chips: ["0.15 BH", "Interest"], token: "approach.s", reach: 1 },
        { title: "Normal", chips: ["0.3 BH", "Meeting"], token: "approach.m", reach: 2 },
        { title: "Strong", chips: ["0.5 BH", "Owner"], token: "approach.l", reach: 3 },
      ],
    },
    {
      id: "timeline",
      title: "Time Line",
      toc: "Timeline",
      text: "Each modal is assigned a specific part of the robot, and any modal that lacks a part follows alternative rules.",
      kind: "timeline",
      duration: 2.2,
      tracks: [
        { channel: "sound", label: "Sound", clips: [{ from: 0.026, to: 0.403, label: "chirp" }, { from: 0.403, to: 0.53 }] },
        { channel: "face", label: "Face", clips: [{ from: 0.199, to: 1.841, label: "Soft" }] },
        {
          channel: "motion",
          label: "Motion",
          clips: [
            { from: 0.362, to: 1.171, label: "Nod*2", align: "start" },
            { from: 1.171, to: 1.657, label: "Pause", align: "start" },
            { from: 1.657, to: 2.174 },
          ],
        },
      ],
    },
    [
      {
        id: "variant",
        title: "Variant",
        text: "Variants only change the combination of tokens, not the meaning.",
        kind: "table",
        head: ["Variant", "Change", "When"],
        widths: [117, 241, null],
        cols: ["key", "muted", "muted"],
        rows: [
          ["Owner", "approach.l + longer pause", "when the owner returns home"],
          ["Stranger", "Use keep distance", "unknown person"],
          ["Vehicle", "Slowly rolling + lighting", "2–4 DoF"],
          ["No display", "Face track skipped, motion unchanged", "no face screen"],
        ],
      },
      {
        id: "state",
        title: "State",
        text: "The robot's status overrides or weakens its actions.",
        kind: "states",
        items: [
          { state: "Idle", effect: "play as is" },
          { state: "Quiet hours", effect: "sound −12dB" },
          { state: "Low battery", effect: "approach.s" },
          { state: "Held / In-air", effect: "Omit → Carried" },
          { state: "Error", effect: "Stop + Face" },
        ],
      },
    ],
    {
      id: "token-spec",
      title: "Token Spec",
      text: "The token name is the same as Primitive tokens.",
      gap: 20,
      kind: "table",
      head: ["State", "Track", "Token", "Value"],
      widths: [139, 119, 259, null],
      cols: ["label", "track", "code", "text"],
      rows: [
        ["enabled", "motion", "op.antic", "7 % · 120 ms"],
        ["enabled", "motion", "approach.m", "0.3 BH · ease-out"],
        ["enabled", "motion", "pause.m", "300 ms"],
        ["enabled", "motion", "tilt.s", "6° · eye level"],
        ["enabled", "face", "eye.size.l", "0.32"],
        ["enabled", "face", "blink", "1 time when stopped · 70 %"],
        ["enabled", "sound", "timbre · length", "bright · 0.4 s · 0.1 s first"],
        ["quiet hours", "sound", "volume", "−12 dB"],
        ["held", "all", "override", "→ Carried"],
      ],
    },
  ],
};
