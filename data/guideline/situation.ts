import type { GuidelineSection } from "./types";

// Situation patterns: recurring spatial relationships between the user and the robot.
// Sources: _ref/pure-web/lib/guideline-content.ts (componentItems), lib/pure-system.ts (CONTEXTS),
// PURE_Knowledge/09_Context_Mapping/*.md.

export const situation: GuidelineSection = {
  id: "situation",
  title: "Situation",
  summary:
    "Seven recurring situations between the user and the robot, each with how the robot should and should not move.",
  entries: [
    {
      slug: "face-to-face",
      title: "Face to Face",
      summary: "The user and the AI face each other directly and focus on the interaction.",
      body: [
        { kind: "p", text: "Expresses frontal rapport and immersion in the conversation." },
        {
          kind: "list",
          items: [
            "Making eye contact while listening to the AI's answer after a voice command.",
            "The AI directly scans the user's face or expression through a camera or sensor.",
            "Exchanging the first greeting in the morning, or entering a 1:1 conversation mode.",
          ],
        },
        {
          kind: "p",
          text: "Exception: if the user's gaze is in front but they are absent-minded or the silence grows long, the AI should stop blind gaze tracking and look slightly away (a 'Reflective' non-gazing motion).",
        },
      ],
      dos: [
        "Align the upper body and head joints level with the user's eye height and keep a slight forward lean.",
        "Never stay perfectly still: perform a sync reaction, with micro-movements or nods matched to the voice waveform or the user's own nods.",
      ],
      donts: [
        "Perfectly frozen joints: during a conversation the joints do not move at all, even at a micro level. The user feels watched by a CCTV or surveillance camera and perceives an unpleasant threat.",
      ],
      related: ["side-by-side", "calling", "nod-yes"],
      source: "guideline-content.ts:face-to-face",
    },
    {
      slug: "touching",
      title: "Touching",
      summary: "The user directly touches the AI's body or joints, or picks it up and moves it.",
      body: [
        { kind: "p", text: "Expresses gentle compliance and bonding in response to contact." },
        {
          kind: "list",
          items: [
            "Gently stroking the AI's head or body as praise.",
            "Manually grabbing the AI's angle or joints and turning it to a desired direction.",
            "Playfully tapping the AI or holding it as if hugging.",
          ],
        },
        {
          kind: "p",
          text: "Exception: if the user applies strong force or bends a joint past its limit, stop emotional expression immediately and switch to compliance mode (Comply), or perform a minimal orienting motion followed by the protection mechanism.",
        },
        {
          kind: "p",
          text: "Carrying (lifting and relocating the robot): expresses stability and trust while being moved, e.g. moving it from the living-room desk to the bedside table, moving it aside for cleaning, or walking to another room while holding it.",
        },
        {
          kind: "list",
          items: [
            "In-air state: the moment the gyro or accelerometer detects leaving the ground, gather all joints tightly toward the center axis into a compact form.",
            "While carried, keep the head level toward the user's face or the direction of travel with a light gimbal motion.",
            "If dropped or shaken sharply: curl the joints to minimize impact (defensive motion) and show embarrassment.",
            "If held in the air for a long time: look at the user uneasily, or with a nuance of being sorry for being heavy.",
          ],
        },
      ],
      dos: [
        "When the user forces or moves a joint, lower motor torque instantly so the joint yields softly to the hand.",
        "When stroked gently, press the upper body toward the hand (nestle) or lift slightly into it.",
      ],
      donts: [
        "Going limp on contact: losing all strength the moment it is touched, with no counter-feedback. It makes the robot look like a broken doll.",
        "Uncontrolled flailing in the air: when lifted, joints move rapidly and erratically without finding a position. It creates a threatening fear of hurting the user's hands.",
      ],
      related: ["face-to-face", "side-by-side", "hide"],
      source: "guideline-content.ts:touching, moving",
    },
    {
      slug: "side-by-side",
      title: "Side by side",
      summary: "The user and the AI share the same space near each other without direct conversation.",
      body: [
        { kind: "p", text: "Expresses quiet, unobtrusive companionship and comfortable coexistence." },
        {
          kind: "list",
          items: [
            "The AI sits quietly beside the monitor while the user works at a desk.",
            "The AI is placed beside the user reading a book or using a phone on the sofa.",
            "Resting in the same space while cooking or listening to music.",
          ],
        },
        {
          kind: "p",
          text: "Exception: when the user falls fully asleep or stays motionless for a long time, scale down with the ambient noise and light and keep only a minimal-frequency natural breathing motion (low-power / sleep mode).",
        },
        {
          kind: "p",
          text: "Shared focus: when the user and the robot attend to the same object, direction, or event, use the Shared Attention component (states Interested, Observing; principle Arcs) and align attention without blocking the user's task.",
        },
      ],
      dos: [
        "Minimize large-joint travel; use only one or two main joints for a very low-frequency, low-sensitivity slow up-and-down motion.",
        "When the ambient light dims or the noise drops, reduce the amplitude further so the user's focus or rest is not disturbed.",
      ],
      donts: [
        "Periodic joint jitter and excessive motion: loud motor noise, or short-period, large back-and-forth movement while staying nearby. It breaks the user's concentration.",
      ],
      related: ["face-to-face", "passing-by", "side-sway"],
      source: "guideline-content.ts:by-your-side; lib/pure-system.ts:CONTEXTS.Shared_Focus; PURE_Knowledge/09_Context_Mapping/Shared_Focus.md",
    },
    {
      slug: "passing-by",
      title: "Passing by",
      summary: "The user passes through the AI's perception range without intent to interact.",
      body: [
        { kind: "p", text: "Expresses restrained awareness of a user who passes by casually." },
        {
          kind: "list",
          items: [
            "Walking past an AI installed in a hallway or living room on the way to the kitchen.",
            "Passing quickly near the AI while looking for something.",
            "Passing by the AI absent-mindedly while talking to someone else.",
          ],
        },
        {
          kind: "p",
          text: "Exception: if the user carries a large load or runs past, detect the speed and only follow the trajectory lightly with the eyes, slowing joint response so it does not feel threatening.",
        },
      ],
      dos: [
        "Rotate only the head joint slowly along the user's path (glance). Do not use the full range; limit rotation to within 30 degrees of the center axis.",
        "Move the joints one tempo slower than the user (slower-than-user) to avoid an overly staring feel.",
      ],
      donts: [
        "Sudden staring at a passer-by: stopping its motion and freezing to stare at the moment the user passes. It invades the user's path and creates the psychological burden of being followed or watched.",
      ],
      related: ["side-by-side", "alone", "look-around"],
      source: "guideline-content.ts:pass-away",
    },
    {
      slug: "calling",
      title: "Calling",
      summary: "The user immediately requests the AI's attention by voice or signal.",
      body: [
        { kind: "p", text: "Expresses an alert, lively shift of attention in response to being called." },
        {
          kind: "list",
          items: [
            "Calling its name from far away, e.g. 'Hey ...'.",
            "Clapping twice, or calling the AI with a dedicated wearable or app button.",
            "Waving behind the AI to get its attention.",
          ],
        },
        {
          kind: "p",
          text: "Exception: if a similar word from the TV or music was misrecognized, turn quickly, realize it was not a call, and return slowly to the original position with a slightly embarrassed nuance.",
        },
      ],
      dos: [
        "Anticipation: right before turning toward the sound source, snap the joint 2–3 degrees in the opposite direction, then turn quickly toward the caller.",
        "Do not stop dead at the end of the turn: overshoot the target slightly and come back.",
      ],
      donts: [
        "A flat whip-turn: turning toward the sound in a straight line with no easing or rebound. It feels like a cold, precise mechanical reflex.",
        "Freezing, then turning slowly: no visible reaction for more than 1 second after being called, then a slow turn. It reads as a network error or malfunction.",
      ],
      related: ["face-to-face", "at-a-distance", "freeze"],
      source: "guideline-content.ts:calling",
    },
    {
      slug: "at-a-distance",
      title: "At a distance",
      summary: "The user enters the robot's range, moves closer, or returns to the space from a distance.",
      body: [
        {
          kind: "p",
          text: "Required reading for the user: the robot noticed me and is ready, without forcing interaction.",
        },
        {
          kind: "list",
          items: [
            "States: Observing -> Interested -> Greeting.",
            "Behavior component: Greeting.",
            "Principle: Anticipation.",
          ],
        },
        {
          kind: "p",
          text: "Distance is regulated proxemically: stopping in the personal zone feels safe, entering the intimate zone feels uncomfortable. On mobile forms, spatial safety overrides expressive intensity.",
        },
      ],
      dos: ["Acknowledge that the user has been noticed.", "Match approach distance and speed to the context."],
      donts: ["Do not force interaction on a user who is only nearby."],
      related: ["calling", "spin-bow", "approach"],
      source: "lib/pure-system.ts:CONTEXTS.User_Approach; PURE_Knowledge/09_Context_Mapping/User_Approach.md; lib/motion-tokens.ts:approach",
    },
    {
      slug: "alone",
      title: "Alone",
      summary: "The user leaves the AI's space, ending the interaction, and the robot remains present by itself.",
      body: [
        { kind: "p", text: "Expresses a lingering send-off, a natural end, and quiet availability afterwards." },
        {
          kind: "list",
          items: [
            "Moving toward the front door to go out after a conversation.",
            "Leaving the AI's room while turning off the light or closing the door.",
            "Saying a closing line such as 'I'm going to bed now' and moving away.",
          ],
        },
        {
          kind: "p",
          text: "Exception: if the user pretends to leave and comes right back for something forgotten, set a delay / fade-out period before dormancy so emotion tokens do not tangle on a sudden change of direction.",
        },
        {
          kind: "p",
          text: "Idle presence: once alone, the robot is not actively used but remains present (states Observing, Waiting; Waiting Idle component; principle Slow In / Slow Out). Avoid strong repetition, fast movement, and comic-level expression; stay available without demanding attention.",
        },
      ],
      dos: [
        "Lower the head slightly toward the departing user's back (nod / bow), or sustain the joints toward the direction they leave.",
        "After the user leaves the sensor range, do not stop immediately: look that way for 1.5–2 seconds, then slowly release the joints with gravity and return to the default waiting posture.",
      ],
      donts: [
        "Sudden power-off: dropping the head within 0.1 seconds as soon as the user turns to leave. It feels like a cold disconnection.",
        "Endless lingering: staring blankly in the departed direction for minutes after the user is gone. It looks broken and causes confusion.",
      ],
      related: ["passing-by", "side-by-side", "side-sway"],
      source: "guideline-content.ts:leave; lib/pure-system.ts:CONTEXTS.Idle_Presence; PURE_Knowledge/09_Context_Mapping/Idle_Presence.md",
    },
  ],
};
