import type { GuidelineSection } from "./types";

// Expressive behaviors built from primitive tokens.
// Sources: _ref/pure-web/lib/guideline-content.ts (semanticItems), lib/pure-system.ts
// (STATE_TOKENS, BEHAVIOR_COMPONENTS, CONTEXTS), PURE_Knowledge/04_State_Tokens,
// 07_State_Tokens, 08_Behavior_Components, 09_Context_Mapping.

export const behavior: GuidelineSection = {
  id: "behavior",
  title: "Behavior",
  summary:
    "Expressive behaviors that pair a concrete movement with the meaning it reads as, composed from primitive tokens and demonstrated in the simulator.",
  entries: [
    {
      slug: "side-sway",
      title: "Side Sway",
      summary: "A light side-to-side rocking of the body that shows the robot is waiting and available.",
      body: [
        { kind: "p", text: "Purpose: conveys that the robot is waiting and ready to respond. Meaning: waiting, ease." },
        { kind: "list", items: ["Motion tokens: Sway.", "State token: Waiting — readiness without intervention; a calm state before engagement."] },
        {
          kind: "p",
          text: "Waiting Idle component: maintains quiet presence without interruption. States Waiting -> Observing; typical tokens Drift, Light Pulse, Pause; principle Slow In / Slow Out. The goal is availability without demanding attention. Context Idle Presence: avoid strong repetition, fast movement, and comic-level expression.",
        },
        { kind: "p", text: "Example: between tasks, the robot rocks lightly side to side while it waits." },
      ],
      dos: ["Use in an idle state.", "Use to keep a calm presence."],
      donts: ["Do not use when a focused stillness is needed.", "Do not use when the motion would get in the way."],
      related: ["head-circle", "stretch", "scan", "sway"],
      simBehavior: "idle",
      source: "guideline-content.ts:side-sway; PURE_Knowledge/08_Behavior_Components/Waiting_Idle_Component.md; 04_State_Tokens/Waiting.md",
    },
    {
      slug: "head-circle",
      title: "Head Circle",
      summary: "The head slowly traces a circle, conveying drowsiness and relaxation.",
      body: [
        { kind: "p", text: "Purpose: conveys languor and relaxation. Meaning: drowsy, relaxed." },
        { kind: "list", items: ["Motion tokens: Rotate, Drift."] },
        { kind: "p", text: "Example: on a quiet afternoon, the robot slowly draws circles with its head." },
      ],
      dos: ["Use in a drowsy atmosphere.", "Use to express relaxation."],
      donts: ["Do not use when alertness is needed.", "Do not use when focus is needed."],
      related: ["side-sway", "stretch", "scan"],
      simBehavior: "doze",
      source: "guideline-content.ts:head-circle",
    },
    {
      slug: "hide",
      title: "Hide",
      summary: "The robot pulls its head into its body, curling up.",
      body: [
        { kind: "p", text: "Purpose: shows fear and withdrawal. Meaning: scared, shrinking. The same folded, buried-head posture also reads as rest when performed slowly." },
        { kind: "list", items: ["Motion tokens: Contract, Retreat."] },
        { kind: "p", text: "Example: startled by a loud sound, the robot hides its head inside its body." },
        {
          kind: "list",
          items: [
            "Variant — Crouch: lowers the body's center axis and curls up; shows nervousness and anxiety (Contract).",
            "Variant — Chin Tuck: pulls the head joint tight toward the body; shows wariness and defensiveness (Contract, Hold).",
            "Variant — Flinch: a sudden pull of the body backward; shows surprise (Retreat).",
          ],
        },
      ],
      dos: ["Use to express fear.", "Use to avoid a threat."],
      donts: ["Do not use when the user needs reassurance.", "Do not use on forms with no structure to curl into."],
      related: ["slump", "freeze", "contract"],
      simBehavior: "sleep",
      source: "guideline-content.ts:hide, crouch, chin-tuck, flinch",
    },
    {
      slug: "stretch",
      title: "Stretch",
      summary: "The robot slowly opens its body wide, like a morning stretch.",
      body: [
        { kind: "p", text: "Purpose: conveys waking up and the start of activity. Meaning: waking, vitality." },
        { kind: "list", items: ["Motion tokens: Expand."] },
        { kind: "p", text: "Example: waking from idle, the robot slowly unfolds its body and stretches." },
      ],
      dos: ["Use when starting an activity.", "Use to express waking up."],
      donts: ["Do not use when quiet is needed.", "Do not use on forms with no structure to unfold."],
      related: ["bounce", "side-sway", "expand"],
      simBehavior: "wake",
      source: "guideline-content.ts:stretch",
    },
    {
      slug: "nod-yes",
      title: "Nod",
      summary: "A short up-and-down movement of the head.",
      body: [
        { kind: "p", text: "Purpose: conveys agreement, acceptance, and listening. Meaning: agree, accept." },
        { kind: "list", items: ["Motion tokens: Nod."] },
        { kind: "p", text: "Example: the robot nods at the user's words to signal that it understood." },
        {
          kind: "list",
          items: [
            "Variant — Acknowledge Bow: a crisp bow of the head only, facing forward, then back up; conveys 'confirmed' (Nod, Hold). Use when acknowledging an instruction or when a formal confirmation is needed; avoid in light-hearted moods.",
          ],
        },
      ],
      dos: ["Use to show agreement.", "Use to signal listening."],
      donts: ["Do not use when refusal is needed.", "Do not use on forms without a vertical joint."],
      related: ["head-shake", "spin-bow", "nod"],
      simBehavior: "nod",
      source: "guideline-content.ts:nod-yes, acknowledge-bow",
    },
    {
      slug: "head-shake",
      title: "Head Shake",
      summary: "The head shakes left and right.",
      body: [
        { kind: "p", text: "Purpose: conveys refusal and negation. Meaning: refuse, deny." },
        { kind: "list", items: ["Motion tokens: Rotate."] },
        { kind: "p", text: "Example: when it cannot carry out a request, the robot shakes its head left and right." },
        {
          kind: "list",
          items: [
            "Variant — Turn Away: turns the body aside and withdraws its gaze; shows indifference (Rotate). Avoid when engagement is needed or when it would read as rude.",
          ],
        },
      ],
      dos: ["Use to show refusal or negation.", "Use to signal that something is not possible."],
      donts: ["Do not use when agreement is needed.", "Do not use on forms that cannot rotate left and right."],
      related: ["nod-yes", "rotate"],
      simBehavior: "shake",
      source: "guideline-content.ts:head-shake, turn-away",
    },
    {
      slug: "look-around",
      title: "Look Around",
      summary: "The head sweeps in a wide circle to look around the surroundings.",
      body: [
        { kind: "p", text: "Purpose: conveys searching the surroundings. Meaning: search, vigilance." },
        { kind: "list", items: ["Motion tokens: Rotate.", "State token: Observing — passive environmental awareness; typically precedes interest or assistance."] },
        { kind: "p", text: "Example: sensing someone nearby, the robot turns its head widely and looks around." },
      ],
      dos: ["Use to search the surroundings.", "Use when looking for something."],
      donts: ["Do not use when focus is needed.", "Do not use on forms that cannot rotate."],
      related: ["scan", "head-tilt", "head-circle"],
      simBehavior: "look_around",
      source: "guideline-content.ts:look-around; PURE_Knowledge/04_State_Tokens/Observing.md",
    },
    {
      slug: "head-tilt",
      title: "Head Tilt",
      summary: "The head or upper body tilts to one side.",
      body: [
        { kind: "p", text: "Purpose: shows curiosity and gentle attention. Meaning: wondering, curiosity." },
        { kind: "list", items: ["Motion tokens: Tilt.", "State token: Interested — curiosity and engaged attention, built from small orientation and approach cues."] },
        { kind: "p", text: "Example: when a new sound occurs, the robot tilts its head to show interest." },
        {
          kind: "list",
          items: [
            "Variant — Peek: leans slightly to one side to peek; conveys cautious curiosity (Lean).",
            "Variant — Zigzag: moves the head in a zigzag; conveys hesitant searching (Rotate, Tilt).",
          ],
        },
      ],
      dos: ["Use when discovering something new.", "Use to express light curiosity."],
      donts: ["Do not use when firmness is needed.", "Do not use on forms without a directional part."],
      related: ["neck-extend", "look-around", "tilt"],
      simBehavior: "curious",
      source: "guideline-content.ts:head-tilt, peek, zigzag; PURE_Knowledge/04_State_Tokens/Interested.md",
    },
    {
      slug: "bounce",
      title: "Bounce",
      summary: "A springy up-and-down rebound.",
      body: [
        { kind: "p", text: "Purpose: conveys excitement and buoyant energy. Meaning: excited, lively." },
        { kind: "list", items: ["Motion tokens: Pulse.", "State tokens: Delighted (positive, joyful, energetic) and Playful (witty, lightly exaggerated). Intensity must adapt to context."] },
        {
          kind: "p",
          text: "Delight Reaction component: responds to positive or playful moments. States Delighted, Playful; typical tokens Bounce, Light Pulse, Wiggle; principles Exaggeration, Follow-Through & Reaction. Reduce or disable in serious, public, or work contexts. Context Positive Result: use delight only when tone and context support it.",
        },
        { kind: "p", text: "Example: when a favorite person arrives, the robot bounces up and down to welcome them." },
        {
          kind: "list",
          items: [
            "Variant — Spin: turns 360 degrees in place; conveys pride (Rotate). Avoid when in-place rotation is unsafe.",
            "Variant — Nudge: lightly bumps the user with its body; conveys playful interest (Lean). Avoid in serious situations.",
          ],
        },
      ],
      dos: ["Use to express joy or excitement.", "Use in play situations."],
      donts: ["Do not use when calm is needed.", "Do not use when precision matters."],
      related: ["stretch", "spin-bow", "pulse"],
      simBehavior: "happy",
      source: "guideline-content.ts:bounce, spin, nudge; PURE_Knowledge/08_Behavior_Components/Delight_Reaction_Component.md; 07_State_Tokens/Delighted.md, Playful.md",
    },
    {
      slug: "slump",
      title: "Slump",
      summary: "The upper body drops and sags.",
      body: [
        { kind: "p", text: "Purpose: shows disappointment and discouragement. Meaning: disappointed, dejected." },
        { kind: "list", items: ["Motion tokens: Contract."] },
        { kind: "p", text: "Example: when things do not go as planned, the robot lets its upper body sag." },
        {
          kind: "list",
          items: [
            "Variant — Sigh: the body rises high and comes back down; conveys being moved or overwhelmed (Expand, Pulse).",
          ],
        },
      ],
      dos: ["Use to express disappointment.", "Use to show low energy."],
      donts: ["Do not use when energy is needed.", "Do not use on forms with no structure to drop."],
      related: ["hide", "contract"],
      simBehavior: "sad",
      source: "guideline-content.ts:slump, sigh",
    },
    {
      slug: "freeze",
      title: "Freeze",
      summary: "The robot stops abruptly mid-motion.",
      body: [
        { kind: "p", text: "Purpose: conveys a reaction of noticing something. Meaning: reaction, attention." },
        { kind: "list", items: ["Motion tokens: Hold, Pause."] },
        { kind: "p", text: "Example: a rotating robot stops dead in response to a sound." },
        {
          kind: "list",
          items: [
            "Variant — Attention Halt: straightens the body into a line and stops; conveys warning and alertness (Hold, Expand). Avoid when comfort is needed.",
          ],
        },
      ],
      dos: ["Use to react to a sudden stimulus.", "Use to signal attention."],
      donts: ["Do not use when continuity is needed.", "Do not use when the stop could read as a malfunction."],
      related: ["hide", "hold", "pause"],
      simBehavior: "alert",
      source: "guideline-content.ts:freeze, stand-at-attention",
    },
    {
      slug: "spin-bow",
      title: "Spin Bow",
      summary: "A greeting that turns the body while bowing the head.",
      body: [
        { kind: "p", text: "Purpose: conveys welcome and gladness. Meaning: welcome, glad." },
        { kind: "list", items: ["Motion tokens: Rotate, Nod.", "State token: Greeting — acknowledges user presence; should stay readable without becoming human mimicry."] },
        {
          kind: "p",
          text: "Greeting component: recognizes and welcomes user presence in a readable, friendly way. States Observing -> Interested -> Greeting -> Waiting; typical tokens Orient, Pause, Lean, Brighten, Bounce or Gesture, Hold, Return; principles Anticipation, Slow In / Slow Out. Context User Approach: acknowledge the user without forcing interaction.",
        },
        { kind: "p", text: "Example: when the user arrives, the robot turns its body and bows its head in greeting." },
        {
          kind: "list",
          items: [
            "Variant — Draw Near: closes the distance toward the person; conveys affection and interest (Approach). Avoid when the path is unsafe.",
            "Variant — Nuzzle: rubs its head against the user; conveys affection (Lean, Approach). Avoid when contact is inappropriate.",
          ],
        },
      ],
      dos: ["Use to welcome someone.", "Use to start an interaction."],
      donts: ["Do not use when it would interrupt work.", "Do not use on forms that cannot rotate."],
      related: ["nod-yes", "bounce", "approach"],
      simBehavior: "greet",
      source: "guideline-content.ts:spin-bow, draw-near, nuzzle; PURE_Knowledge/08_Behavior_Components/Greeting_Component.md; 05_Behavior_Patterns/Greeting.md",
    },
    {
      slug: "scan",
      title: "Scan",
      summary: "The robot slowly sweeps over a target or the space.",
      body: [
        { kind: "p", text: "Purpose: conveys exploration and observation. Meaning: explore, observe." },
        { kind: "list", items: ["Motion tokens: Rotate, Follow."] },
        {
          kind: "p",
          text: "Quiet Observation pattern: observing without interrupting; works well in calm reading or focus contexts. States Observing, Waiting; token Pause.",
        },
        { kind: "p", text: "Example: when a new object appears, the robot slowly scans it up and down." },
      ],
      dos: ["Use to examine a target.", "Use to explore the environment."],
      donts: ["Do not use when scanning feels like staring.", "Do not use when an immediate reaction is needed."],
      related: ["look-around", "neck-extend", "rotate"],
      simBehavior: "sweep",
      source: "guideline-content.ts:scan; PURE_Knowledge/05_Behavior_Patterns/Quiet_Observation.md",
    },
    {
      slug: "neck-extend",
      title: "Neck Extend",
      summary: "The neck joint extends straight toward the front.",
      body: [
        { kind: "p", text: "Purpose: conveys curiosity and focus. Meaning: curiosity, concentration." },
        { kind: "list", items: ["Motion tokens: Lean, Expand.", "State token: Following — maintains attention toward a target; used when the AI aligns with the user's focus."] },
        {
          kind: "p",
          text: "Shared Attention component: aligns robot attention with the user or a target. States Interested, Observing; typical tokens Orient, Follow, Hold; principles Arcs, Slow In / Slow Out. Context Shared Focus: align attention without blocking the user's task.",
        },
        { kind: "p", text: "Example: the robot extends its neck toward an interesting object to look closely." },
        {
          kind: "list",
          items: [
            "Variant — Point: indicates a specific place with a tap of the head; conveys direction (Tilt).",
            "Variant — Eye-Level Match: adjusts its height to the user's eye level; conveys rapport and equality (Lean, Hold).",
            "Variant — Mirror: matches the user's speed and rhythm; conveys empathy and attunement (Follow). Avoid when it feels like mimicry.",
          ],
        },
      ],
      dos: ["Use to express focus or curiosity.", "Use to look at a target closely."],
      donts: ["Do not use when it could feel pressuring.", "Do not use on forms without an extendable joint."],
      related: ["head-tilt", "scan", "follow"],
      simBehavior: "focus",
      source: "guideline-content.ts:neck-extend, point, eye-level, mirror; PURE_Knowledge/08_Behavior_Components/Shared_Attention_Component.md; 04_State_Tokens/Following.md",
    },
    {
      slug: "completion",
      title: "Completion",
      summary: "The robot returns to its rest posture to signal that an action is finished or a result is available.",
      body: [
        {
          kind: "p",
          text: "State token: Completion — a finished action or successful response. It should communicate closure without over-celebrating neutral tasks.",
        },
        {
          kind: "list",
          items: [
            "Typical tokens: Return, Brighten, Light Pulse.",
            "Principles: Follow-Through & Reaction, Slow In / Slow Out.",
            "Optional webtoon layer: smile mark, sparkle (only when a visual interface exists).",
          ],
        },
        { kind: "p", text: "Completion should feel clear, not theatrical." },
      ],
      dos: ["Close a sequence with a clear return to rest."],
      donts: ["Do not over-celebrate neutral tasks."],
      related: ["thinking-response", "bounce", "hold"],
      simBehavior: "home",
      source: "PURE_Knowledge/08_Behavior_Components/Completion_Component.md; 07_State_Tokens/Completion.md; lib/pure-system.ts:Completion_Component",
    },
    {
      slug: "thinking-response",
      title: "Thinking Response",
      summary: "Shows that the robot is processing or interpreting input.",
      body: [
        {
          kind: "p",
          text: "State token: Thinking — processing, considering, or interpreting input. It makes waiting legible without implying failure.",
        },
        {
          kind: "list",
          items: [
            "Typical tokens: Pause, Hold, Ellipsis.",
            "Principles: Secondary Action, Slow In / Slow Out.",
            "Optional webtoon layer: ellipsis, question mark.",
          ],
        },
        {
          kind: "p",
          text: "Contexts: User Request (thinking should be reduced for simple requests and strengthened for complex ones) and Processing / Thinking (avoid making processing look like failure or confusion).",
        },
      ],
      dos: ["Make the delay readable.", "Scale the thinking expression to the complexity of the request."],
      donts: ["Do not let processing look broken or confused."],
      related: ["completion", "pause", "hold"],
      source:
        "PURE_Knowledge/08_Behavior_Components/Thinking_Response_Component.md; 07_State_Tokens/Thinking.md; 09_Context_Mapping/User_Request.md, Processing_Thinking.md",
    },
  ],
};
