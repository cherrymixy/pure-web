import type { GuidelineSection } from "./types";

// Primitive motion tokens: the smallest reusable units of expressive robot movement.
// Sources: _ref/pure-web/lib/motion-tokens.ts (MOTION_TOKENS, 14 tokens) and
// _ref/pure-web/PURE_Knowledge/04_Basic_Motion_Tokens/*.md (Feedback tokens).

export const primitiveTokens: GuidelineSection = {
  id: "primitive-tokens",
  title: "Primitive Tokens",
  summary:
    "The smallest reusable motion units, grouped as Direction, Gesture, Timing, Rhythm, Shape and Feedback, each grounded in nonverbal-behavior and HRI research.",
  entries: [
    {
      slug: "tilt",
      title: "Tilt",
      summary:
        "A directional movement that tilts the head, body or target-facing part slightly toward a target to signal attention or curiosity.",
      body: [
        {
          kind: "p",
          text: "Category: Direction. Tilt conveys attention, curiosity, or gentle recognition.",
        },
        {
          kind: "table",
          head: ["Token", "Range", "Unit", "Effect"],
          rows: [
            ["Tilt · direction", "Toward the target (left/right or up/down)", "—", "Points the cue at what is being attended to"],
            ["Tilt · amplitude", "10–25", "deg", "Small"],
            ["Tilt · duration", "200–500", "ms", "Short"],
            ["Tilt · speed", "Slow to moderate", "—", "Calm, non-startling"],
            ["Tilt · smoothness", "Smooth", "—", "Soft onset and settle"],
          ],
        },
        {
          kind: "p",
          text: "Example: a lamp robot tilts its head toward a user who starts reading a book, then turns on its light.",
        },
        {
          kind: "p",
          text: "Evidence (empirical): orienting the head toward a target reveals gaze direction and works as a social gaze cue for attention and curiosity, widely studied in HRI.",
        },
        {
          kind: "list",
          items: [
            "Admoni & Scassellati (2017), Social Eye Gaze in Human-Robot Interaction: A Review, JHRI 6(1)",
            "Bethel & Murphy (2008), Survey of Non-Facial/Non-Verbal Affective Expressions for Appearance-Constrained Robots, IEEE T-SMC-C 38(1) — orientation channel",
          ],
        },
        {
          kind: "p",
          text: "Orient, the general re-orientation token in the Direction category, is expressed through Tilt and Rotate.",
        },
      ],
      dos: [
        "Use when the AI notices the user.",
        "Use to show curiosity.",
        "Use to prepare shared attention.",
      ],
      donts: [
        "Do not use when the user needs urgent feedback.",
        "Do not use when the movement could disturb the user.",
        "Do not use on forms without a directional part.",
      ],
      related: ["lean", "follow", "rotate"],
      source: "lib/motion-tokens.ts:tilt; PURE_Knowledge/03_Motion_Tokens/Tilt.md",
    },
    {
      slug: "rotate",
      title: "Rotate",
      summary:
        "A directional movement that turns the robot around its vertical axis to change where it faces.",
      body: [
        {
          kind: "p",
          text: "Category: Direction. Rotate conveys exploration, transition, or a shift of focus between targets. Useful for non-anthropomorphic attention cues.",
        },
        {
          kind: "table",
          head: ["Token", "Range", "Unit", "Effect"],
          rows: [
            ["Rotate · direction", "Yaw, around the vertical axis", "—", "Changes heading"],
            ["Rotate · amplitude", "Medium to large, up to 360", "deg", "From a glance to a full turn"],
            ["Rotate · duration", "Medium", "—", "Readable turn"],
            ["Rotate · speed", "Constant", "—", "Even, scanning quality"],
            ["Rotate · smoothness", "Smooth and continuous", "—", "No jerks during the turn"],
          ],
        },
        {
          kind: "p",
          text: "Example: a companion bot slowly rotates to scan the room, then rests its attention on the person who just spoke.",
        },
        {
          kind: "p",
          text: "Evidence (empirical): re-orienting and scanning by vertical-axis rotation is a basic behavior of the orientation/gaze channel and signals what the robot is attending to.",
        },
        {
          kind: "list",
          items: [
            "Admoni & Scassellati (2017), Social Eye Gaze in Human-Robot Interaction: A Review, JHRI 6(1)",
            "Bethel & Murphy (2008), IEEE T-SMC-C 38(1) — orientation channel",
          ],
        },
      ],
      dos: [
        "Use to explore or scan the surroundings.",
        "Use to shift attention between targets.",
        "Use to face a new direction.",
      ],
      donts: [
        "Do not use when a subtle cue is enough.",
        "Do not use when the turn would abruptly break eye contact.",
        "Do not use when the form cannot turn in place safely.",
      ],
      related: ["tilt", "follow", "lean"],
      source: "lib/motion-tokens.ts:rotate; PURE_Knowledge/03_Motion_Tokens/Rotate.md",
    },
    {
      slug: "lean",
      title: "Lean",
      summary:
        "A directional movement that shifts the body or center of mass toward a target without traveling.",
      body: [
        {
          kind: "p",
          text: "Category: Direction. Lean conveys engagement, interest, and active participation. It can express interest without imitating a human.",
        },
        {
          kind: "table",
          head: ["Token", "Range", "Unit", "Effect"],
          rows: [
            ["Lean · direction", "Toward the target (forward or sideways)", "—", "Signals who or what is engaged"],
            ["Lean · amplitude", "Small to medium", "—", "Engagement without pressure"],
            ["Lean · duration", "Medium", "—", "Held long enough to read"],
            ["Lean · speed", "Slow", "—", "Calm approach of posture"],
            ["Lean · smoothness", "Smooth, with weight", "—", "Feels grounded"],
          ],
        },
        {
          kind: "p",
          text: "Example: a desk companion leans slightly in when the user starts talking, signaling that it is listening.",
        },
        {
          kind: "p",
          text: "Evidence (empirical): leaning the torso toward a target is a nonverbal posture channel for engagement and immediacy, and posture is a core expressive means for appearance-constrained robots.",
        },
        {
          kind: "list",
          items: [
            "Bethel & Murphy (2008), IEEE T-SMC-C 38(1) — posture channel",
            "Laban Movement Analysis — Shape/Effort (posture and weight shift)",
          ],
        },
      ],
      dos: [
        "Use to show active interest.",
        "Use to deepen engagement during an interaction.",
        "Use to emphasize attention without approaching.",
      ],
      donts: [
        "Do not use when the user may feel pressured.",
        "Do not use when a neutral stance is needed.",
        "Do not use on forms without a flexible body axis.",
      ],
      related: ["tilt", "approach", "expand"],
      source: "lib/motion-tokens.ts:lean; PURE_Knowledge/03_Motion_Tokens/Lean.md",
    },
    {
      slug: "follow",
      title: "Follow",
      summary:
        "A directional movement that continuously tracks a moving target with the robot's heading or body.",
      body: [
        {
          kind: "p",
          text: "Category: Direction. Follow conveys shared attention and sustained focus. It connects attention to behavior patterns.",
        },
        {
          kind: "table",
          head: ["Token", "Range", "Unit", "Effect"],
          rows: [
            ["Follow · direction", "Tracks the target", "—", "Keeps the target in view"],
            ["Follow · amplitude", "Variable, follows the target", "—", "Matches target motion"],
            ["Follow · duration", "Continuous", "—", "Sustained focus"],
            ["Follow · speed", "Matched to the target", "—", "Stays in sync"],
            ["Follow · smoothness", "Smooth and responsive", "—", "Reads as attentive, not mechanical"],
          ],
        },
        {
          kind: "p",
          text: "Example: when the user moves a toy across the table, an animal robot's head follows it.",
        },
        {
          kind: "p",
          text: "Evidence (empirical): tracking a moving target with gaze or head forms joint attention, one of the most studied social gaze behaviors.",
        },
        {
          kind: "list",
          items: ["Admoni & Scassellati (2017), Social Eye Gaze in Human-Robot Interaction: A Review, JHRI 6(1)"],
        },
      ],
      dos: [
        "Use to maintain shared attention.",
        "Use to track a person or object.",
        "Use to show sustained interest.",
      ],
      donts: [
        "Do not use when tracking feels like staring.",
        "Do not use when the target is too fast to follow smoothly.",
        "Do not use when attention should be withdrawn.",
      ],
      related: ["rotate", "tilt", "lean"],
      source: "lib/motion-tokens.ts:follow; PURE_Knowledge/03_Motion_Tokens/Follow.md",
    },
    {
      slug: "retreat",
      title: "Retreat",
      summary:
        "A directional movement that increases distance from a target by moving or leaning away.",
      body: [
        {
          kind: "p",
          text: "Category: Direction. Retreat conveys caution, respect, or giving space.",
        },
        {
          kind: "table",
          head: ["Token", "Range", "Unit", "Effect"],
          rows: [
            ["Retreat · direction", "Away from the target", "—", "Opens distance"],
            ["Retreat · amplitude", "Small to medium", "—", "Gives space without fleeing"],
            ["Retreat · duration", "Medium", "—", "Readable withdrawal"],
            ["Retreat · speed", "Slow", "—", "Calm, not alarmed"],
            ["Retreat · smoothness", "Smooth", "—", "Soft withdrawal"],
          ],
        },
        {
          kind: "p",
          text: "Example: when the user comes close, an ambient device pulls back slightly and lowers its light to give personal space.",
        },
        {
          kind: "p",
          text: "Evidence (empirical): widening distance is a proxemic distance-regulation behavior linked to avoiding intrusion into personal and intimate zones and to perceived comfort.",
        },
        {
          kind: "list",
          items: [
            "Hall (1966), The Hidden Dimension — proxemics (distance zones)",
            "Mumm & Mutlu (2011), Human-Robot Proxemics: Physical and Psychological Distancing in HRI, HRI 2011",
          ],
        },
      ],
      dos: [
        "Use to give the user space.",
        "Use to show caution or shyness.",
        "Use to soften attention.",
      ],
      donts: [
        "Do not use when the user expects responsiveness.",
        "Do not use when withdrawal could read as a malfunction.",
        "Do not use when the form cannot move.",
      ],
      related: ["approach", "lean", "contract"],
      source: "lib/motion-tokens.ts:retreat",
    },
    {
      slug: "approach",
      title: "Approach",
      summary: "A directional movement that moves toward a target to close the distance.",
      body: [
        {
          kind: "p",
          text: "Category: Direction. Approach conveys interest, friendliness, and the intent to engage or support. Distance and speed should match the context.",
        },
        {
          kind: "table",
          head: ["Token", "Range", "Unit", "Effect"],
          rows: [
            ["Approach · direction", "Toward the target", "—", "Closes distance"],
            ["Approach · amplitude", "Medium", "—", "Stops at a comfortable distance"],
            ["Approach · duration", "Medium", "—", "Readable approach"],
            ["Approach · speed", "Slow to moderate", "—", "Friendly, not intrusive"],
            ["Approach · smoothness", "Smooth", "—", "Gentle arrival"],
          ],
        },
        {
          kind: "p",
          text: "Example: a companion bot moves gently toward a user who waves, then stops at a comfortable distance.",
        },
        {
          kind: "p",
          text: "Evidence (empirical): closing distance is a core proxemic behavior; approach and stopping distance affect perceived safety and intimacy (stopping in the personal zone feels safe, entering the intimate zone feels uncomfortable).",
        },
        {
          kind: "list",
          items: [
            "Hall (1966), The Hidden Dimension — proxemics (distance zones)",
            "Mumm & Mutlu (2011), Human-Robot Proxemics, HRI 2011",
          ],
        },
      ],
      dos: [
        "Use to start an interaction.",
        "Use to show friendliness.",
        "Use to offer help.",
      ],
      donts: [
        "Do not use when the user signals they want space.",
        "Do not use when approaching could feel intrusive.",
        "Do not use when the path is not safe.",
      ],
      related: ["retreat", "lean", "follow"],
      source: "lib/motion-tokens.ts:approach; PURE_Knowledge/03_Motion_Tokens/Approach.md",
    },
    {
      slug: "nod",
      title: "Nod",
      summary: "A gesture that briefly moves the head or upper body up and down.",
      body: [
        {
          kind: "p",
          text: "Category: Gesture. Nod conveys acknowledgement, agreement, or listening (backchannel).",
        },
        {
          kind: "table",
          head: ["Token", "Range", "Unit", "Effect"],
          rows: [
            ["Nod · direction", "Vertical (up/down)", "—", "Reads as yes / I hear you"],
            ["Nod · amplitude", "Small", "—", "Light acknowledgement"],
            ["Nod · duration", "300–600", "ms", "Short"],
            ["Nod · speed", "Moderate", "—", "Natural backchannel tempo"],
            ["Nod · smoothness", "Smooth", "—", "Not mechanical"],
          ],
        },
        {
          kind: "p",
          text: "Example: the robot nods briefly at the user's words to signal that it is listening and understands.",
        },
        {
          kind: "p",
          text: "Evidence (empirical): the head nod is a classic kineme (the smallest unit of body motion) for acknowledgement and listening, long studied and confirmed in HRI.",
        },
        {
          kind: "list",
          items: [
            "Birdwhistell (1970), Kinesics and Context — kineme",
            "Admoni & Scassellati (2017), Social Eye Gaze in HRI: A Review, JHRI 6(1)",
          ],
        },
      ],
      dos: [
        "Use to show agreement or acceptance.",
        "Use as a listening backchannel.",
        "Use to confirm completion or receipt.",
      ],
      donts: [
        "Do not use when negation or refusal is needed.",
        "Do not use on forms without a vertical joint or head.",
        "Do not repeat until it feels mechanical.",
      ],
      related: ["tilt", "hold", "pulse"],
      source: "lib/motion-tokens.ts:nod; PURE_Knowledge/04_Basic_Motion_Tokens/Direction_Tokens.md",
    },
    {
      slug: "pause",
      title: "Pause",
      summary: "A timing movement in which the robot briefly stops between motions.",
      body: [
        {
          kind: "p",
          text: "Category: Timing. Pause creates rhythm, signals intent, and gives the user time to read the behavior. It creates space for interpretation.",
        },
        {
          kind: "table",
          head: ["Token", "Range", "Unit", "Effect"],
          rows: [
            ["Pause · amplitude", "None (still)", "—", "Marks a beat"],
            ["Pause · duration", "300–1000", "ms", "Short"],
          ],
        },
        {
          kind: "p",
          text: "Example: before greeting, the robot pauses for a beat after noticing the user so that recognition feels deliberate.",
        },
        {
          kind: "p",
          text: "Evidence (inferred): a short stop between motions is a timing beat that creates rhythm. In PURE v4 (Schulz refinement) micro-timing was moved to the parameter layer, so its status as an independent minimal unit is borderline.",
        },
        {
          kind: "list",
          items: [
            "Laban Movement Analysis — Effort: Time (quick/sustained)",
            "PURE v4 (Schulz et al. 2019 refinement) — timing moved to the parameter layer",
          ],
        },
        {
          kind: "p",
          text: "Delay was removed from the catalog: a pre-response delay has no movement shape and is a pure timing parameter.",
        },
      ],
      dos: [
        "Use to separate two motions.",
        "Use to signal deliberate intent.",
        "Use to let the user catch up.",
      ],
      donts: [
        "Do not use when responsiveness matters.",
        "Do not use when the stop could read as hesitation or lag.",
        "Do not use when continuous motion is expected.",
      ],
      related: ["hold", "drift", "tilt"],
      source: "lib/motion-tokens.ts:pause; PURE_Knowledge/04_Basic_Motion_Tokens/Timing_Tokens.md",
    },
    {
      slug: "hold",
      title: "Hold",
      summary: "A timing movement in which the robot keeps a posture for a noticeable time.",
      body: [
        {
          kind: "p",
          text: "Category: Timing. Hold conveys stability, patience, and steady attention.",
        },
        {
          kind: "table",
          head: ["Token", "Range", "Unit", "Effect"],
          rows: [
            ["Hold · direction", "Keeps the current heading", "—", "Sustains focus"],
            ["Hold · amplitude", "None (posture held)", "—", "Stillness"],
            ["Hold · duration", "1–3", "s", "Long"],
          ],
        },
        {
          kind: "p",
          text: "Example: while the user examines a shared object, the robot keeps its gaze on the object to reinforce joint attention.",
        },
        {
          kind: "p",
          text: "Evidence (inferred): expressive stillness and sustained gaze correspond to Laban's sustained Time quality, and stopping (as opposed to idling) carries the meaning of attention and stability.",
        },
        {
          kind: "list",
          items: [
            "Laban Movement Analysis — Effort: Time (sustained)",
            "Motions of Robots Matter! The Social Effects of Idle and Meaningful Motions (ICSR 2015)",
          ],
        },
        {
          kind: "p",
          text: "Return (back to the rest posture) belongs to the same Timing category and is used to close sequences.",
        },
      ],
      dos: [
        "Use to maintain shared attention.",
        "Use to show calm and patience.",
        "Use while waiting for the user's answer.",
      ],
      donts: [
        "Do not use in dynamic situations.",
        "Do not use when holding could read as unresponsive.",
        "Do not use when the user needs immediate feedback.",
      ],
      related: ["pause", "nod", "follow"],
      source: "lib/motion-tokens.ts:hold; PURE_Knowledge/04_Basic_Motion_Tokens/Timing_Tokens.md",
    },
    {
      slug: "sway",
      title: "Sway",
      summary:
        "A rhythm movement in which the robot rocks slightly side to side or front to back on a slow sine wave.",
      body: [
        {
          kind: "p",
          text: "Category: Rhythm (formerly Oscillation). Not high-frequency vibration: a slow oscillation where servos follow a sinusoidal position command. Conveys a breathing-like liveliness, presence, and a calm idle state.",
        },
        {
          kind: "table",
          head: ["Token", "Range", "Unit", "Effect"],
          rows: [
            ["Sway · direction", "Side to side or front to back", "—", "Breathing motion"],
            ["Sway · amplitude", "Small", "—", "Subtle"],
            ["Sway · duration", "Continuous", "—", "Ongoing idle"],
            ["Sway · speed", "0.2–1", "Hz", "Slow"],
            ["Sway · smoothness", "Smooth, sinusoidal", "—", "Organic"],
          ],
        },
        {
          kind: "p",
          text: "Example: in idle, the robot sways slowly as if breathing, signaling that it is awake and available.",
        },
        {
          kind: "p",
          text: "Evidence (empirical): slow sinusoidal rocking (breathing imitation) is easy to drive with servo position commands and improves robot perception by showing it is on and alive in idle. Forms without joints substitute a light pulse.",
        },
        {
          kind: "list",
          items: [
            "Motions of Robots Matter! The Social Effects of Idle and Meaningful Motions (ICSR 2015)",
            "Breathing/heartbeat-based arousal expression in HRI (physiological expression)",
          ],
        },
      ],
      dos: [
        "Use in idle to show the robot is alive.",
        "Use to add subtle liveliness.",
        "Use to soften a static posture.",
      ],
      donts: [
        "Do not use when stillness communicates focus.",
        "Do not use when the motion would disturb a task.",
        "Do not use on jointless forms — substitute a light pulse.",
      ],
      related: ["pulse", "drift", "hold"],
      source: "lib/motion-tokens.ts:sway; PURE_Knowledge/04_Basic_Motion_Tokens/Rhythm_Tokens.md",
    },
    {
      slug: "pulse",
      title: "Pulse",
      summary:
        "A rhythm movement in which the robot's size or intensity expands and contracts like a heartbeat.",
      body: [
        {
          kind: "p",
          text: "Category: Rhythm. Pulse conveys energy, heartbeat-like liveliness, and emphasis.",
        },
        {
          kind: "table",
          head: ["Token", "Range", "Unit", "Effect"],
          rows: [
            ["Pulse · amplitude", "Small to medium (size)", "—", "Visible beat"],
            ["Pulse · duration", "Continuous", "—", "Ongoing activity"],
            ["Pulse · speed", "Moderate", "—", "Heartbeat tempo"],
            ["Pulse · smoothness", "Smooth", "—", "Soft beat, not a flash"],
          ],
        },
        {
          kind: "p",
          text: "Example: an ambient device pulses softly while processing, signaling that it is active and thinking.",
        },
        {
          kind: "p",
          text: "Evidence (inferred): heartbeat-like expansion and contraction can express arousal as an artificial physiological signal, and can be substituted by brightness or size channels.",
        },
        {
          kind: "list",
          items: ["Artificial breathing/heartbeat arousal expression in HRI (physiological expression)"],
        },
      ],
      dos: [
        "Use to indicate active processing.",
        "Use to convey energy or liveliness.",
        "Use to emphasize a specific moment.",
      ],
      donts: [
        "Do not use when a calm, quiet state is needed.",
        "Do not use when the beat could look like a false alarm.",
        "Do not use when the form cannot change size or light.",
      ],
      related: ["sway", "drift", "hold"],
      source: "lib/motion-tokens.ts:pulse; PURE_Knowledge/04_Basic_Motion_Tokens/Rhythm_Tokens.md",
    },
    {
      slug: "drift",
      title: "Drift",
      summary: "A rhythm movement in which the robot moves slowly and continuously with low energy.",
      body: [
        {
          kind: "p",
          text: "Category: Rhythm. Drift conveys ease, relaxation, and a comfortable presence.",
        },
        {
          kind: "table",
          head: ["Token", "Range", "Unit", "Effect"],
          rows: [
            ["Drift · direction", "Lateral, slow", "—", "Barely noticeable travel"],
            ["Drift · amplitude", "Small", "—", "Background motion"],
            ["Drift · duration", "Continuous, slow", "—", "Ambient"],
            ["Drift · speed", "Very slow", "—", "Undemanding"],
            ["Drift · smoothness", "Very smooth", "—", "Relaxed"],
          ],
        },
        {
          kind: "p",
          text: "Example: in a quiet room the robot floats almost imperceptibly, feeling alive without demanding attention.",
        },
        {
          kind: "p",
          text: "Evidence (heuristic): slow low-energy micro-motion is a form of idle liveliness, but it overlaps with Sway and its support as an independent minimal unit is weak. Repetition and Wiggle in the same category are under review for the same reason.",
        },
        {
          kind: "list",
          items: ["Motions of Robots Matter! (ICSR 2015) — idle motion in general (the specific drift form is unverified)"],
        },
      ],
      dos: [
        "Use to create a calm ambient presence.",
        "Use when resting but alive.",
        "Use when unobtrusive background motion is needed.",
      ],
      donts: [
        "Do not use when alertness is needed.",
        "Do not use when the user needs clear responsiveness.",
        "Do not use when drifting could read as leaving the path.",
      ],
      related: ["sway", "pulse", "hold"],
      source: "lib/motion-tokens.ts:drift; PURE_Knowledge/04_Basic_Motion_Tokens/Rhythm_Tokens.md",
    },
    {
      slug: "expand",
      title: "Expand",
      summary: "A shape movement in which the robot opens its posture outward and upward.",
      body: [
        {
          kind: "p",
          text: "Category: Shape. The posture opens; the material does not inflate. Expand conveys openness, confidence, dominance, or rising arousal.",
        },
        {
          kind: "table",
          head: ["Token", "Range", "Unit", "Effect"],
          rows: [
            ["Expand · direction", "Outward / upward", "—", "Open posture"],
            ["Expand · amplitude", "Medium", "—", "Clearly larger silhouette"],
            ["Expand · duration", "Medium", "—", "Readable change"],
            ["Expand · speed", "Slow to moderate", "—", "Confident, not startling"],
            ["Expand · smoothness", "Smooth", "—", "Even opening"],
          ],
        },
        {
          kind: "p",
          text: "Example: in a moment of welcome or joy, the robot straightens its upper body, rises, and takes an open posture.",
        },
        {
          kind: "p",
          text: "Evidence (inferred): opening and spreading posture maps to Laban Shape rising/spreading; posture is an empirically supported emotional channel for appearance-constrained robots. Because it is posture expansion rather than material deformation, it works on rigid robots.",
        },
        {
          kind: "list",
          items: [
            "Laban Movement Analysis — Shape (open/closed, rising/spreading)",
            "Bethel & Murphy (2008), IEEE T-SMC-C 38(1) — posture channel",
          ],
        },
        {
          kind: "p",
          text: "Compress and Stretch (material squash and stretch) are physically impossible on rigid robots; they are substituted by light or size, or excluded from the principle layer.",
        },
      ],
      dos: [
        "Use to show openness or welcome.",
        "Use to show confidence or vitality.",
        "Use to express positive arousal.",
      ],
      donts: [
        "Do not use when calm or modesty is needed.",
        "Do not use on forms without joints or an axis to open.",
        "Do not use when it could look intimidating.",
      ],
      related: ["lean", "contract", "approach"],
      source: "lib/motion-tokens.ts:expand; PURE_Knowledge/04_Basic_Motion_Tokens/Shape_Tokens.md",
    },
    {
      slug: "contract",
      title: "Contract",
      summary: "A shape movement in which the robot draws its posture inward and downward.",
      body: [
        {
          kind: "p",
          text: "Category: Shape. Contract conveys closing, withdrawal, caution, or falling arousal. It is the pair axis of Expand.",
        },
        {
          kind: "table",
          head: ["Token", "Range", "Unit", "Effect"],
          rows: [
            ["Contract · direction", "Inward / downward", "—", "Closed posture"],
            ["Contract · amplitude", "Small to medium", "—", "Smaller silhouette"],
            ["Contract · duration", "Medium", "—", "Readable change"],
            ["Contract · speed", "Slow", "—", "Careful"],
            ["Contract · smoothness", "Smooth", "—", "Soft closing"],
          ],
        },
        {
          kind: "p",
          text: "Example: in a cautious moment, the robot lowers and draws in its upper body, giving a withdrawn impression.",
        },
        {
          kind: "p",
          text: "Evidence (inferred): closing and drawing in posture maps to Laban Shape sinking/enclosing and is supported as posture-based emotional expression.",
        },
        {
          kind: "list",
          items: [
            "Laban Movement Analysis — Shape (open/closed, sinking/enclosing)",
            "Bethel & Murphy (2008), IEEE T-SMC-C 38(1) — posture channel",
          ],
        },
      ],
      dos: [
        "Use to show caution or shyness.",
        "Use to give space.",
        "Use to lower arousal or energy.",
      ],
      donts: [
        "Do not use when openness or welcome is needed.",
        "Do not use on forms without an axis to draw in.",
        "Do not use when withdrawal could read as a malfunction.",
      ],
      related: ["retreat", "expand", "hold"],
      source: "lib/motion-tokens.ts:contract; PURE_Knowledge/04_Basic_Motion_Tokens/Shape_Tokens.md",
    },
    {
      slug: "light-pulse",
      title: "Light Pulse",
      summary: "A feedback token that pulses the light channel to support or substitute physical motion.",
      body: [
        {
          kind: "p",
          text: "Category: Feedback. Light Pulse is the most universal support token for low-motion forms. When an archetype cannot perform an expressive Rhythm or Dynamic token physically, PURE substitutes Light Pulse if a Light channel exists.",
        },
        {
          kind: "p",
          text: "Evidence (empirical): color and light are a core nonverbal emotional channel for appearance-constrained robots. Bethel & Murphy list five channels: body movement, posture, orientation, color, and sound.",
        },
        {
          kind: "list",
          items: [
            "Used in: Waiting Idle, Delight Reaction and Completion components.",
            "Substitutes Sway on jointless forms.",
          ],
        },
      ],
      dos: ["Use when physical motion capability is low.", "Use to clarify motion, not to compete with it."],
      donts: ["Do not replace motion with light when the form can move (Motion First)."],
      related: ["pulse", "sway", "brighten-dim"],
      source: "PURE_Knowledge/04_Basic_Motion_Tokens/Feedback_Tokens.md; lib/pure-system.ts:substituteFor",
    },
    {
      slug: "brighten-dim",
      title: "Brighten / Dim",
      summary: "A pair of feedback tokens that raise or lower light intensity to frame attention.",
      body: [
        {
          kind: "p",
          text: "Category: Feedback. Brighten marks recognition, greeting, and completion; Dim gives space and lowers presence. When a form cannot perform a Timing token or Orient physically, PURE substitutes Brighten.",
        },
        {
          kind: "p",
          text: "Evidence (empirical): light and color are an established nonverbal channel for appearance-constrained robots (Bethel & Murphy 2008).",
        },
        {
          kind: "list",
          items: [
            "Brighten is used in the Greeting and Completion components.",
            "Dim is recommended for ambient devices.",
          ],
        },
      ],
      dos: ["Use to frame attention on low-motion forms.", "Use Dim to give the user space."],
      donts: ["Do not flash brightness so that it reads as an alarm."],
      related: ["light-pulse", "retreat"],
      source: "PURE_Knowledge/04_Basic_Motion_Tokens/Feedback_Tokens.md; lib/pure-system.ts:MOTION_TOKEN_CATEGORIES",
    },
    {
      slug: "soft-chime",
      title: "Soft Chime",
      summary: "A feedback token that plays a short, soft sound cue to support motion.",
      body: [
        {
          kind: "p",
          text: "Category: Feedback. Soft Chime is the substitute when a form has no Light channel but has Sound.",
        },
        {
          kind: "p",
          text: "Evidence (empirical): sound is one of the five nonverbal emotional channels for appearance-constrained robots (Bethel & Murphy 2008).",
        },
      ],
      dos: ["Use to clarify a motion beat when light is not available."],
      donts: ["Do not let sound compete with motion."],
      related: ["light-pulse", "haptic-tap"],
      source: "PURE_Knowledge/04_Basic_Motion_Tokens/Feedback_Tokens.md",
    },
    {
      slug: "haptic-tap",
      title: "Haptic Tap",
      summary: "A feedback token that delivers a short tactile cue.",
      body: [
        {
          kind: "p",
          text: "Category: Feedback. Haptic Tap is the last-resort substitute when a form has neither Light nor Sound but has a Haptic channel.",
        },
        {
          kind: "p",
          text: "Evidence (moderate): tactile channel; the supporting evidence is moderate.",
        },
      ],
      dos: ["Use for close-range confirmation on forms with a haptic channel."],
      donts: ["Do not use as a primary expression when motion is available."],
      related: ["soft-chime", "light-pulse"],
      source: "PURE_Knowledge/04_Basic_Motion_Tokens/Feedback_Tokens.md",
    },
  ],
};
