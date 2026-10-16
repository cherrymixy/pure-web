import type { GuidelineSection } from "./types";

// Sources: _ref/pure-web/PURE_Knowledge/00_HOME, 01_Foundation, 05_Animation_Principles,
// _ref/pure-web/lib/guideline-content.ts:principles-overview, lib/pure-system.ts.

export const overview: GuidelineSection = {
  id: "overview",
  title: "Overview",
  summary:
    "What PURE is, the order in which the guideline is read, and how motion is composed from tokens, principles, and channels.",
  entries: [
    {
      slug: "what-is-pure",
      title: "What is PURE",
      summary: "PURE is a motion design system that treats physical motion as the primary language of Physical AI.",
      body: [
        {
          kind: "p",
          text: "PURE translates robot behavior into a shared vocabulary of motion tokens, states, behavior components, and situation patterns that can be applied across different robot forms.",
        },
        {
          kind: "list",
          items: [
            "Motion First: physical motion is the primary expression layer. Interface expression supports motion; it should not replace it.",
            "Feedback (light, sound, voice, haptic) should clarify motion, not compete with it.",
            "Webtoon expression (emotion icons, symbols, motion lines, reaction bubbles) is enabled only when a visual interface exists. In the MVP it is a GUI-based emotional compression layer.",
            "Form is expression capability, not style: what a robot can express depends on its available channels.",
          ],
        },
      ],
      related: ["how-to-read", "composition-model"],
      source:
        "PURE_Knowledge/00_HOME/PURE_HOME.md; 01_Foundation/Motion_First_Rule.md; 01_Foundation/Webtoon_Expression_MVP_Rule.md; 03_Motion_Channels/Feedback_Channel.md",
    },
    {
      slug: "how-to-read",
      title: "How to read this guideline",
      summary: "Start from the robot's form and channel capability, then compose behavior from context down to tokens.",
      body: [
        {
          kind: "p",
          text: "The PURE logic follows a fixed read order. Each step narrows what the next step may use.",
        },
        {
          kind: "code",
          lang: "text",
          text: "Robot Type -> Available Channels -> Context -> State -> Behavior Component -> Animation Principle -> Motion Token -> Webtoon Layer -> Preview / Export",
        },
        {
          kind: "list",
          items: [
            "Principles: the five rules every behavior must respect.",
            "Primitive Tokens: the smallest reusable motion units.",
            "Behavior: expressive behaviors built from tokens, each with a simulator demo.",
            "Situation: recurring spatial relationships between the user and the robot.",
            "Robot Classes: how each form maps tokens to its channels.",
            "Templates: end-to-end flows and authoring scaffolds.",
          ],
        },
        {
          kind: "p",
          text: "Context guides behavior; it does not lock a fixed sequence. The generated preview should expose what was selected, substituted, disabled, or warned.",
        },
      ],
      related: ["what-is-pure", "composition-model"],
      source:
        "PURE_Knowledge/01_Foundation/PURE_System_Read_Order.md; 09_Context_Mapping/Context_to_Behavior_Mapping.md; 10_System_Integration/Generated_Motion_Preview.md",
    },
    {
      slug: "composition-model",
      title: "Composition model",
      summary: "Motion = base motion x principle tokens x timing parameters, with a staging layer deciding channel and order.",
      body: [
        {
          kind: "p",
          text: "Animation principles are modifiers layered on the base motion built from motion tokens; they give motion its texture. PURE adopts only the six Disney principles with confirmed HRI evidence (Schulz et al., 2019 refinement). Timing is moved to the timing-parameter layer and Staging to the staging layer, so no function is lost. Solid Drawing, Appeal and Squash & Stretch are excluded.",
        },
        {
          kind: "table",
          head: ["Layer", "Contents"],
          rows: [
            ["1. Principle tokens (6)", "ANTIC, EASE, ARC, SECOND, FOLLOW/REACT, AMP/OVER"],
            ["2. Timing parameters", "speed multiplier, pause, response_delay, rhythm (period)"],
            ["3. Staging layer", "gaze_dir, light_spot, proxemic_dist, output order"],
            ["Intensity control", "gamma (size multiplier), N_max (tokens per beat), loud-cap (at most 1 large token)"],
          ],
        },
        {
          kind: "table",
          head: ["Principle token", "Slot", "Parameters", "Evidence"],
          rows: [
            ["ANTIC (Anticipation)", "A — before the beat (once before the first beat in a multi-beat sequence)", "amount, dur 0.15–0.5 s, dir (opposite of the main motion); gamma up -> amount up", "Explicit — multiple HRI studies (Takayama, Gielniak)"],
            ["EASE (Slow In / Slow Out)", "M — beat body (all motion channels)", "curve (linear/in/out/inout), in/out span (ms), target (spatial | brightness)", "Explicit — Schulz corpus"],
            ["ARC (Arcs)", "M — beat body", "curvature 0–0.4; contributes naturalness more than emotion", "Explicit — Schulz review"],
            ["SECOND (Secondary Action)", "OV/M — overlay on the main motion", "channel (tail/ear/torso/light), lag (ms); on when gamma is high", "Explicit — Schulz review"],
            ["FOLLOW/REACT (Follow-Through & Reaction)", "R — after the beat (once after the last beat)", "FOLLOW: decay (ms), residual, joint_lag; REACT: type (nod/pulse/settle), valence (+/-)", "Explicit — Schulz + Takayama (reaction)"],
            ["AMP/OVER (Exaggeration & Overshoot)", "M (AMP), M/R (OVER)", "AMP scale 0.5–1.8x (clamped), OVER ratio 0–20%; loud-cap: AMP > 1.2x or OVER > 10% is limited to one per beat", "Explicit — Gielniak, Pepper exaggeration-cue study"],
          ],
        },
        {
          kind: "p",
          text: "Dynamic tokens (Ease In, Ease Out, Acceleration, Deceleration, Bounce) are not separate units: they are the texture layer (Laban Effort Time and Flow) that modulates every unit. Acceleration and curvature are the strongest drivers of perceived affect in robot motion (Saerbeck & Bartneck 2010).",
        },
        {
          kind: "p",
          text: "Example: when greeting a returning user, the staging layer turns on the entrance light first, then a small anticipation (ANTIC) leads into a smooth turn (EASE) and a greeting expression (SECOND). Three principle tokens are used; speed and staging are handled by layers 2 and 3.",
        },
      ],
      dos: [
        "Use principle tokens to show emotion and personality through motion texture.",
        "Use them when base motion feels mechanical.",
        "Adjust intensity (gamma) to the situation.",
      ],
      donts: [
        "Do not apply principle tokens at gamma = 0 (function only).",
        "Do not exaggerate during precision work.",
        "Do not use principles to control speed — that is the timing parameter's job.",
      ],
      related: ["how-to-read", "pause", "pulse"],
      source:
        "guideline-content.ts:principles-overview; lib/animation-principles.ts:PRINCIPLE_TOKENS; PURE_Knowledge/05_Animation_Principles/Animation_Principle_Tokenization.md; 04_Basic_Motion_Tokens/Dynamic_Tokens.md",
    },
  ],
};
