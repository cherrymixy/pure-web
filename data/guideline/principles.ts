import type { GuidelineSection } from "./types";

// Source: _ref/pure-web/PURE_Knowledge/02_Principles/*.md

export const principles: GuidelineSection = {
  id: "principles",
  title: "Principles",
  summary:
    "Five principles that keep PURE movement state-driven, readable, and calm across every robot form.",
  entries: [
    {
      slug: "state-awareness",
      title: "State Awareness",
      summary: "Communicate the robot's internal state before it performs a function.",
      body: [
        {
          kind: "p",
          text: "PURE is centered on state-driven movement. Before the robot acts, its motion should let the user read what it is currently aware of, such as observing or being interested. Context and movement are connected through the state token system.",
        },
        {
          kind: "list",
          items: [
            "Related states: Observing, Interested.",
            "Grounding: Physical AI research; referenced in the Guideline Report and PURE Whitepaper.",
          ],
        },
      ],
      dos: ["Show the state first, then the function."],
      donts: ["Do not jump straight into a function without a readable state cue."],
      related: ["intention-interpretation", "quiet-observation"],
      source: "PURE_Knowledge/02_Principles/State_Awareness.md",
    },
    {
      slug: "intention-interpretation",
      title: "Intention Interpretation",
      summary: "Let the user read the robot's intent through its motion.",
      body: [
        {
          kind: "p",
          text: "Intention Interpretation connects state expression to functional behavior. Movement such as Approach should make the robot's next action predictable, so that assistance emerges from a visible intent instead of appearing abruptly.",
        },
        {
          kind: "list",
          items: [
            "Related state: Interested.",
            "Related motion token: Approach.",
            "Related behavior pattern: Assistance.",
          ],
        },
      ],
      dos: ["Make the intent visible before the function starts."],
      donts: ["Do not let functional motion appear without a readable intent."],
      related: ["state-awareness", "approach"],
      source: "PURE_Knowledge/02_Principles/Intention_Interpretation.md",
    },
    {
      slug: "shared-attention",
      title: "Shared Attention",
      summary: "Maintain a shared focus between the user and the AI.",
      body: [
        {
          kind: "p",
          text: "Shared Attention links attention cues to shared context. The robot aligns its orientation with what the user is attending to, so both appear to look at the same object, direction, or event.",
        },
        {
          kind: "list",
          items: [
            "Motion tokens: Tilt, Lean, Follow.",
            "States: Interested, Following.",
            "Used in: Reading Scenario, Working Scenario.",
          ],
        },
      ],
      dos: ["Align attention with the user's focus without blocking their task."],
      donts: ["Do not track so persistently that it feels like staring."],
      related: ["tilt", "lean", "follow"],
      source: "PURE_Knowledge/02_Principles/Shared_Attention.md",
    },
    {
      slug: "quiet-observation",
      title: "Quiet Observation",
      summary: "Keep a low-intervention presence that is felt without interrupting.",
      body: [
        {
          kind: "p",
          text: "Quiet Observation applies when presence should be felt without interruption. The robot observes its surroundings and the user with minimal motion, putting state before function.",
        },
        {
          kind: "list",
          items: [
            "States: Observing, Waiting.",
            "Motion token: Pause.",
            "Used in: Reading Scenario, Desk Lamp Prototype.",
          ],
        },
      ],
      dos: ["Use minimal, slow motion while the user is focused."],
      donts: ["Do not interrupt a calm or focused context."],
      related: ["subtle-presence", "pause"],
      source: "PURE_Knowledge/02_Principles/Quiet_Observation.md",
    },
    {
      slug: "subtle-presence",
      title: "Subtle Presence",
      summary: "Express presence through restrained motion.",
      body: [
        {
          kind: "p",
          text: "Subtle Presence supports calm, non-anthropomorphic expression. Readability comes from small, restrained motion tokens rather than large human-like gestures.",
        },
        {
          kind: "list",
          items: [
            "Motion tokens: Pause, Lean.",
            "State: Waiting.",
            "Used in: Reading Scenario, Desk Lamp Prototype.",
          ],
        },
      ],
      dos: ["Prefer small, readable motion over imitation of human gestures."],
      donts: ["Do not exaggerate when presence alone is enough."],
      related: ["quiet-observation", "pause", "lean"],
      source: "PURE_Knowledge/02_Principles/Subtle_Presence.md",
    },
  ],
};
