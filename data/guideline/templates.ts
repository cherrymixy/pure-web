import type { GuidelineSection } from "./types";

// Templates: end-to-end interaction flows that chain situations, scenarios, and
// authoring scaffolds for new guideline pages.
// Sources: _ref/pure-web/lib/guideline-content.ts (patternItems),
// PURE_Knowledge/06_Scenarios/*.md, PURE_Knowledge/99_Templates/*.md.

export const templates: GuidelineSection = {
  id: "templates",
  title: "Templates",
  summary:
    "Reusable flows that chain situations over time, scenarios for testing, and scaffolds for writing new guideline pages.",
  entries: [
    {
      slug: "morning-wake-up",
      title: "Morning Wake-Up",
      summary: "The robot wakes from low-power standby when called, has the first conversation of the day, and returns to staying nearby.",
      body: [
        { kind: "p", text: "Provides a natural, warm onboarding flow that opens the day." },
        { kind: "code", lang: "text", text: "Side by side -> Calling -> Face to Face -> Side by side" },
        {
          kind: "p",
          text: "Example: in the morning the user calls the robot's name; it wakes from sleep mode, greets the user face to face, and then starts the day beside them.",
        },
      ],
      dos: ["Use at the start of the day.", "Use when the user wakes the robot from sleep or low power."],
      donts: ["Do not use when the user is only passing by.", "Do not use when repeated calls become tiring."],
      related: ["side-by-side", "calling", "face-to-face", "conversation-session"],
      source: "guideline-content.ts:morning-wake-up",
    },
    {
      slug: "conversation-session",
      title: "Conversation Session",
      summary: "A 1:1 interaction that starts with a call, continues face to face, passes through a touch of praise, and ends as the user leaves.",
      body: [
        { kind: "p", text: "Connects the start, deepening, and end of an active conversation smoothly." },
        { kind: "code", lang: "text", text: "Calling -> Face to Face -> Touching -> Alone" },
        {
          kind: "p",
          text: "Example: the user calls the AI, talks with it face to face, strokes its head as praise, and leaves saying 'See you later'.",
        },
      ],
      dos: ["Use for a conversation session with a clear start and end.", "Use for active 1:1 interaction."],
      donts: ["Do not use when only background companionship is needed.", "Do not use when contact is inappropriate."],
      related: ["calling", "face-to-face", "touching", "alone"],
      source: "guideline-content.ts:conversation-session",
    },
    {
      slug: "companion-at-work",
      title: "Companion at Work",
      summary: "After a short face-to-face moment, the robot quietly accompanies the user, notices their comings and goings with restraint, and returns to quiet mode.",
      body: [
        { kind: "p", text: "Maintains long coexistence without disturbing focus." },
        { kind: "code", lang: "text", text: "Face to Face -> Side by side -> Passing by -> Side by side" },
        {
          kind: "p",
          text: "Example: after starting work together, the robot stays quietly beside the monitor and only glances when the user gets up or returns, then goes quiet again.",
        },
      ],
      dos: ["Use during long periods together.", "Use while the user is immersed."],
      donts: ["Do not use when active conversation is needed.", "Do not use when an immediate reaction is expected."],
      related: ["side-by-side", "passing-by", "working-scenario"],
      source: "guideline-content.ts:companion-at-work",
    },
    {
      slug: "relocation",
      title: "Relocation",
      summary: "The user picks the robot up by hand, moves it to another space, and the robot settles beside them again.",
      body: [
        { kind: "p", text: "Mediates physical relocation with a sense of stability." },
        { kind: "code", lang: "text", text: "Side by side -> Touching (pick up) -> Touching (carrying) -> Side by side" },
        {
          kind: "p",
          text: "Example: when picked up, the robot curls into a compact form; while carried it keeps level toward the direction of travel; once set down in the new spot it stays quietly again.",
        },
      ],
      dos: ["Use when moving the robot elsewhere.", "Use when tidying or relocating."],
      donts: ["Do not use for forms that can move autonomously.", "Do not use when contact should be avoided."],
      related: ["touching", "side-by-side"],
      source: "guideline-content.ts:relocation",
    },
    {
      slug: "ambient-day",
      title: "Ambient Day",
      summary: "A background flow in which the robot shares the space without conversation, notices the user with restraint, and sends them off when they leave.",
      body: [
        { kind: "p", text: "Keeps an ambient presence softly throughout the day." },
        { kind: "code", lang: "text", text: "Side by side -> Passing by -> Side by side -> Alone" },
        {
          kind: "p",
          text: "Example: the robot stays nearby all day, breathing low; it glances when the user passes, and when the user goes out it looks toward the door before returning to its waiting posture.",
        },
      ],
      dos: ["Use when a background presence is needed.", "Use during an ordinary day of comings and goings."],
      donts: ["Do not use when active intervention is needed.", "Do not use in urgent situations."],
      related: ["side-by-side", "passing-by", "alone"],
      source: "guideline-content.ts:ambient-day",
    },
    {
      slug: "first-encounter",
      title: "First Encounter",
      summary: "The robot notices a new user with restraint, opens the relationship through a call and face-to-face greeting, and settles nearby after a curious touch.",
      body: [
        { kind: "p", text: "Forms a first bond with an unfamiliar user gently." },
        { kind: "code", lang: "text", text: "Passing by -> Calling -> Face to Face -> Touching -> Side by side" },
        {
          kind: "p",
          text: "Example: a passing user notices the robot and calls it, they greet face to face, the user touches it carefully, and the robot then takes its place nearby.",
        },
      ],
      dos: ["Use when meeting a new user for the first time.", "Use during onboarding."],
      donts: ["Do not use with a familiar user.", "Do not use when repeated greetings become annoying."],
      related: ["passing-by", "calling", "face-to-face", "touching"],
      source: "guideline-content.ts:first-encounter",
    },
    {
      slug: "reading-scenario",
      title: "Reading Scenario",
      summary: "A scenario for calm attention around a user who is reading.",
      body: [
        {
          kind: "p",
          text: "A key path from observation to prototype testing. Principles Quiet Observation, Shared Attention, and Subtle Presence apply; states Observing and Interested.",
        },
        {
          kind: "p",
          text: "Example from the Tilt token: a lamp robot tilts its head toward a user who starts reading, then turns on its light. Tested in the Desk Lamp Prototype.",
        },
      ],
      related: ["quiet-observation", "shared-attention", "subtle-presence", "joint-fixed"],
      source: "PURE_Knowledge/06_Scenarios/Reading_Scenario.md",
    },
    {
      slug: "working-scenario",
      title: "Working Scenario",
      summary: "A scenario for assistance and shared focus during work.",
      body: [
        {
          kind: "p",
          text: "Useful for testing focus, support, and distance. Uses Shared Attention, the Following state, the Assistance pattern (supportive movement after interpreting need, which should emerge from state awareness rather than abrupt function), and the Follow and Approach tokens.",
        },
      ],
      related: ["shared-attention", "companion-at-work", "follow", "approach"],
      source: "PURE_Knowledge/06_Scenarios/Working_Scenario.md; 05_Behavior_Patterns/Assistance.md",
    },
    {
      slug: "motion-token-page",
      title: "Motion Token page",
      summary: "Scaffold for writing a new primitive motion token page.",
      body: [
        { kind: "p", text: "Use for future motion tokens. Every token must be physically plausible, cross-form mappable, principle-compatible, and adjustable." },
        {
          kind: "code",
          lang: "markdown",
          text: "---\ntype: motion-token\nstatus: draft\nsystem: motion-token-system\nrelated: []\nused_in: []\n---\n\n# <Token name>\n\n## Summary\n\n## Connected Concepts\n\n## Related Files\n\n## Notes\n\n## Evidence\n",
        },
      ],
      related: ["tilt", "pause", "rotate"],
      source: "PURE_Knowledge/99_Templates/Motion_Token_Template.md; 04_Basic_Motion_Tokens/Basic_Motion_Token_Library.md",
    },
    {
      slug: "state-token-page",
      title: "State Token page",
      summary: "Scaffold for writing a new state token page.",
      body: [
        { kind: "p", text: "Use for future state tokens. State tokens bridge context and generated motion." },
        {
          kind: "code",
          lang: "markdown",
          text: "---\ntype: state-token\nstatus: draft\nsystem: state-token-system\nrelated: []\nused_in: []\n---\n\n# <State name>\n\n## Summary\n\n## Connected Concepts\n\n## Related Files\n\n## Notes\n",
        },
      ],
      related: ["look-around", "head-tilt", "side-sway"],
      source: "PURE_Knowledge/99_Templates/State_Token_Template.md",
    },
    {
      slug: "behavior-pattern-page",
      title: "Behavior Pattern page",
      summary: "Scaffold for writing a new behavior pattern page.",
      body: [
        { kind: "p", text: "Use for future behavior patterns. Behavior components create short interaction flows, not fixed full scenarios." },
        {
          kind: "code",
          lang: "markdown",
          text: "---\ntype: behavior-pattern\nstatus: draft\nsystem: behavior-pattern-system\nrelated: []\nused_in: []\n---\n\n# <Pattern name>\n\n## Summary\n\n## Connected Concepts\n\n## Related Files\n\n## Notes\n",
        },
      ],
      related: ["scan", "neck-extend"],
      source: "PURE_Knowledge/99_Templates/Behavior_Pattern_Template.md",
    },
    {
      slug: "scenario-page",
      title: "Scenario page",
      summary: "Scaffold for writing a new scenario page.",
      body: [
        { kind: "p", text: "Use for future scenarios." },
        {
          kind: "code",
          lang: "markdown",
          text: "---\ntype: scenario\nstatus: draft\nsystem: guideline\nrelated: []\nused_in: []\n---\n\n# <Scenario name>\n\n## Summary\n\n## Connected Concepts\n\n## Related Files\n\n## Notes\n",
        },
      ],
      related: ["reading-scenario", "working-scenario"],
      source: "PURE_Knowledge/99_Templates/Scenario_Template.md",
    },
    {
      slug: "experiment-page",
      title: "Experiment page",
      summary: "Scaffold for writing a new experiment page.",
      body: [
        { kind: "p", text: "Use for future experiments, such as the Desk Lamp Prototype that tests subtle motion as communication." },
        {
          kind: "code",
          lang: "markdown",
          text: "---\ntype: experiment\nstatus: draft\nsystem: lab\nrelated: []\nused_in: []\n---\n\n# <Experiment name>\n\n## Summary\n\n## Connected Concepts\n\n## Related Files\n\n## Notes\n",
        },
      ],
      related: ["reading-scenario", "joint-fixed"],
      source: "PURE_Knowledge/99_Templates/Experiment_Template.md; 07_Experiments/Desk_Lamp_Prototype.md",
    },
  ],
};
