import type { GuidelineSection } from "./types";

// Robot classes: how each form maps PURE motion onto its available channels.
// Sources: _ref/pure-web/lib/pure-system.ts (ARCHETYPES, tokenSupport),
// PURE_Knowledge/02_Archetypes/*.md, 03_Motion_Channels/*.md.

export const robotClasses: GuidelineSection = {
  id: "robot-classes",
  title: "Robot Classes",
  summary:
    "Five robot classes defined by expression capability, not style, each with its channels, recommended tokens, and constraints.",
  entries: [
    {
      slug: "full-body",
      title: "Full-body",
      summary: "A human-like, whole-body walking form with high posture, gesture, head, walking, and face-interface capability.",
      body: [
        { kind: "p", text: "Archetype: Humanoid. Movement capability: high." },
        {
          kind: "table",
          head: ["Channel layer", "Channels"],
          rows: [
            ["Physical", "Head, Body, Arm, Leg, Locomotion"],
            ["Interface", "Face Display"],
            ["Feedback", "Voice, Sound, Light"],
          ],
        },
        {
          kind: "list",
          items: [
            "Recommended tokens: Orient, Lean, Gesture, Pause, Hold, Return.",
            "Compatible principles: all six (Anticipation, Slow In / Slow Out, Arcs, Secondary Action, Follow-Through & Reaction, Exaggeration).",
          ],
        },
      ],
      dos: ["Use the full principle set, but keep intensity controlled."],
      donts: ["High expressiveness increases the risk of uncanny or over-human readings — avoid literal human mimicry."],
      related: ["joint-walking", "lean"],
      source: "lib/pure-system.ts:ARCHETYPES.humanoid; PURE_Knowledge/02_Archetypes/Humanoid.md",
    },
    {
      slug: "joint-walking",
      title: "Joint Walking",
      summary: "An animal-inspired jointed walking form that uses tail, ears, head, and locomotion rhythm.",
      body: [
        { kind: "p", text: "Archetype: Animal Robot. Movement capability: high." },
        {
          kind: "table",
          head: ["Channel layer", "Channels"],
          rows: [
            ["Physical", "Head, Tail, Ear, Body, Leg, Locomotion"],
            ["Interface", "None"],
            ["Feedback", "Light, Sound"],
          ],
        },
        {
          kind: "list",
          items: [
            "Recommended tokens: Orient, Follow, Wiggle, Bounce, Tilt.",
            "Compatible principles: Slow In / Slow Out, Arcs, Secondary Action, Follow-Through & Reaction, Exaggeration.",
            "Tail and ears are natural Secondary Action channels.",
          ],
        },
      ],
      dos: ["Focus on expressive rhythm."],
      donts: ["Do not imitate an animal literally."],
      related: ["full-body", "joint-driving", "follow"],
      source: "lib/pure-system.ts:ARCHETYPES.animal; PURE_Knowledge/02_Archetypes/Animal_Robot.md",
    },
    {
      slug: "joint-driving",
      title: "Joint Driving",
      summary: "A small social robot with a jointed head and body on a driving base, suited to friendly tilt, bounce, follow, and display or light expression.",
      body: [
        { kind: "p", text: "Archetype: Companion Bot. Movement capability: medium. High MVP priority." },
        {
          kind: "table",
          head: ["Channel layer", "Channels"],
          rows: [
            ["Physical", "Head, Body, Base"],
            ["Interface", "Face Display, Screen"],
            ["Feedback", "Light, Sound"],
          ],
        },
        {
          kind: "list",
          items: [
            "Recommended tokens: Tilt, Bounce, Approach, Follow, Brighten.",
            "Compatible principles: all six.",
          ],
        },
      ],
      dos: ["Control expression intensity according to context."],
      donts: ["Do not run playful expression at full intensity in every context."],
      related: ["joint-walking", "jointless-driving", "tilt"],
      source: "lib/pure-system.ts:ARCHETYPES.companion; PURE_Knowledge/02_Archetypes/Companion_Bot.md",
    },
    {
      slug: "jointless-driving",
      title: "Jointless Driving",
      summary: "A service or guidance robot without expressive joints that expresses through navigation, orientation, distance, speed, and interface feedback.",
      body: [
        { kind: "p", text: "Archetype: Mobility Agent. Movement capability: high (locomotion)." },
        {
          kind: "table",
          head: ["Channel layer", "Channels"],
          rows: [
            ["Physical", "Base, Locomotion"],
            ["Interface", "Screen"],
            ["Feedback", "Light, Sound"],
          ],
        },
        {
          kind: "list",
          items: [
            "Recommended tokens: Approach, Retreat, Follow, Orient, Pause.",
            "Compatible principles: Anticipation, Slow In / Slow Out, Arcs, Follow-Through & Reaction.",
          ],
        },
      ],
      dos: ["Express through distance and speed; keep proxemic stopping distances."],
      donts: ["Spatial safety overrides expressive intensity — never trade safety for expression."],
      related: ["joint-driving", "approach", "retreat"],
      source: "lib/pure-system.ts:ARCHETYPES.mobility; PURE_Knowledge/02_Archetypes/Mobility_Agent.md",
    },
    {
      slug: "joint-fixed",
      title: "Joint Fixed",
      summary: "An object-like, stationary jointed robot that communicates through joint-arm motion, light-head direction, tilt, and rotation.",
      body: [
        { kind: "p", text: "Archetype: Lamp Robot. Movement capability: medium. High MVP priority because minimal motion can remain readable. This is the class of the PURE Desk simulator." },
        {
          kind: "table",
          head: ["Channel layer", "Channels"],
          rows: [
            ["Physical", "Joint Arm, Head, Base"],
            ["Interface", "None"],
            ["Feedback", "Light"],
          ],
        },
        {
          kind: "list",
          items: [
            "Recommended tokens: Tilt, Orient, Pause, Hold, Light Pulse, Brighten.",
            "Compatible principles: Anticipation, Slow In / Slow Out, Follow-Through & Reaction.",
            "Experiment: Desk Lamp Prototype — tests subtle motion as communication in the Reading Scenario.",
          ],
        },
        {
          kind: "p",
          text: "Low-motion stationary variant (Ambient Device): relies on light, vibration, subtle rotation, sound, or a surface display (physical Base; interface Surface Display; feedback Light, Sound, Haptic). Recommended tokens Light Pulse, Brighten, Dim, Pause; principles Slow In / Slow Out, Follow-Through & Reaction. With almost no physical motion, expression is substituted by light, sound, and micro-rotation.",
        },
        {
          kind: "p",
          text: "Token substitution: when a form cannot perform a token physically, PURE substitutes a feedback token before disabling it — Light Pulse (or Brighten for Timing and Orient) if Light exists, otherwise Soft Chime, otherwise Haptic Tap.",
        },
      ],
      dos: ["Keep motion minimal and readable."],
      donts: ["Do not rely on travel tokens (Approach, Retreat, Follow by locomotion) — the base is fixed."],
      related: ["joint-driving", "tilt", "light-pulse"],
      source:
        "lib/pure-system.ts:ARCHETYPES.lamp, ARCHETYPES.ambient, substituteFor; PURE_Knowledge/02_Archetypes/Lamp_Robot.md, Ambient_Device.md; 07_Experiments/Desk_Lamp_Prototype.md",
    },
  ],
};
