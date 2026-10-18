import type { ComponentDoc } from "../types";

// Component page for Approach — copy from Figma W03-4 "component / Approach (대표)" (550:2490).
// The first entry on the component-page template; other entries opt in by adding a `doc`.

const MOTION_PREVIEW = "Motion preview";

export const approachDoc: ComponentDoc = {
  breadcrumb: ["Components", "S4 Regulatory"],
  lead: "Come closer, stop, and meet the person at eye level. A welcoming behavior used when someone comes home or calls the robot.",
  resources: [{ label: "Open in Lab", href: "/lab" }, { label: "pure.json" }, { label: "Figma" }, { label: "Video" }],
  tags: ["S4 Regulatory", "UC4 Welcome home", "1.8 s"],
  sections: [
    {
      id: "anatomy",
      title: "Anatomy",
      text: "Approach is made of three tracks. Each track maps to a part of the robot; a class without that part falls back.",
      blocks: [
        {
          kind: "anatomy",
          parts: [
            { label: "Body", detail: "Motion track — approach.m, pause.m, tilt.s" },
            { label: "Face display", detail: "Face track — eye-size 0.30, blink ×1" },
            { label: "Speaker", detail: "Sound track — greet, bright, 0.3 s" },
          ],
        },
      ],
    },
    {
      id: "properties",
      title: "Properties",
      blocks: [
        { kind: "subhead", id: "intensity", title: "Intensity", text: "How close the robot comes. Pick by who it is and how long they were away." },
        {
          kind: "cards",
          preview: MOTION_PREVIEW,
          previewHeight: 120,
          cards: [
            { title: "approach.s", chips: ["3 cm", "Notice"] },
            { title: "approach.m", chips: ["6 cm", "Welcome · default"] },
            { title: "approach.l", chips: ["10 cm", "Owner, long absence"] },
          ],
        },
        { kind: "subhead", id: "channel-layout", title: "Channel layout", text: "Which tracks play. Sad and fear need two channels; Approach works with motion alone." },
        {
          kind: "cards",
          preview: "Track preview",
          previewHeight: 84,
          cards: [
            { title: "Motion only", caption: "Space robot · 2–4 DoF" },
            { title: "Motion + Sound", caption: "Quadruped" },
            { title: "Motion + Face + Sound", caption: "Humanoid · Arm · default" },
          ],
        },
        { kind: "subhead", id: "variant", title: "Variant", text: "Capability variants change the recipe, not the meaning." },
        {
          kind: "table",
          head: ["Variant", "Change", "When"],
          widths: [180, 340, null],
          rows: [
            ["owner", "approach.l + longer pause", "Owner comes home"],
            ["stranger", "→ use Keep distance", "Unknown person"],
            ["vehicle", "slow roll + light pulse", "2–4 DoF"],
            ["no display", "amplitude +20%", "No face screen"],
          ],
        },
        { kind: "subhead", id: "state", title: "State", text: "The robot state can override or soften the behavior." },
        {
          kind: "states",
          items: [
            { state: "idle", effect: "plays as is" },
            { state: "quiet hours", effect: "sound −12 dB" },
            { state: "low battery", effect: "approach.s only" },
            { state: "held / in-air", effect: "skipped → Moving" },
            { state: "error", effect: "stop + face" },
          ],
        },
      ],
    },
    {
      id: "guidelines",
      title: "Guidelines",
      blocks: [
        {
          kind: "subhead",
          id: "stop-before-you-greet",
          title: "Stop before you greet",
          text: "Approaching alone reads as “it just noticed me”. The pause and the eye-level tilt turn it into a welcome.",
        },
        {
          kind: "doDont",
          preview: MOTION_PREVIEW,
          previewHeight: 140,
          do: "Approach, pause 300 ms, then tilt up to eye level.",
          dont: "Keep moving toward the person without a stop.",
        },
        { kind: "stat", value: "36%", text: "of people read approaching without a stop as “it just noticed me” (n=47)." },
        {
          kind: "subhead",
          id: "owner-vs-stranger",
          title: "Approach for the owner, distance for strangers",
          toc: "Owner vs. stranger",
          text: "The contrast between the two is what people read as personality.",
        },
        {
          kind: "doDont",
          preview: MOTION_PREVIEW,
          previewHeight: 120,
          do: "Use a bigger approach only for the owner.",
          dont: "Approach every person the same way.",
        },
        {
          kind: "subhead",
          id: "approach-vs-keep-distance",
          title: "Approach vs. Keep distance",
          text: "Both move the body along the same axis. Separate them by direction and by who they are for (SP-3).",
        },
        {
          kind: "table",
          head: ["", "Approach", "Keep distance"],
          widths: [160, null, null],
          rows: [
            ["Purpose", "Welcome, attention", "Boundary, shyness"],
            ["For", "Owner, caller", "Stranger, unwanted touch"],
            ["Tokens", "approach · pause · tilt up", "retreat · glance away · hold"],
            ["Evidence", "36% without stop", "Most liked motion 67.7%"],
          ],
        },
        { kind: "subhead", id: "used-in-patterns", title: "Used in patterns" },
        {
          kind: "chips",
          items: [{ label: "Calling", slug: "calling" }, { label: "Face to Face", slug: "face-to-face" }, { label: "Arriving home" }],
        },
      ],
    },
    {
      id: "specification",
      title: "Specification",
      text: "Token names are the same as Primitive tokens (W03-7).",
      blocks: [
        {
          kind: "table",
          head: ["State", "Track", "Token", "Value"],
          widths: [140, 120, 220, null],
          keyCols: [0, 2],
          rows: [
            ["enabled", "motion", "antic", "2–3° back · 100 ms"],
            ["enabled", "motion", "approach.m", "6 cm · ease-out"],
            ["enabled", "motion", "pause.m", "300 ms"],
            ["enabled", "motion", "tilt.s", "6° up · eye level"],
            ["enabled", "face", "eye-size", "0.30"],
            ["enabled", "face", "blink-rate", "×1 at stop"],
            ["enabled", "sound", "timbre · length", "bright · 0.3 s · leads 100 ms"],
            ["quiet hours", "sound", "volume", "−12 dB"],
            ["held", "all", "override", "→ Moving pattern"],
          ],
        },
      ],
    },
  ],
};
