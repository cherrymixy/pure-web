import { faceDoc } from "./docs/face";
import { semanticDoc } from "./docs/principles/semantic";
import { guardrailsDoc } from "./docs/principles/guardrails";
import { combinationDoc } from "./docs/principles/combination";
import { animationDoc } from "./docs/principles/animation";
import { commonDoc } from "./docs/principles/common";
import { motionDoc } from "./docs/principles/motion";
import { soundDoc } from "./docs/principles/sound";
import type { GuidelineSection } from "./types";

// Source: PURE guideline final structure v3 (2026-10-19) §3 Semantic, §4 Animation 6, §5 Channel & Common.

const SRC = "PURE guideline final structure v3 (2026-10-19)";

export const principles: GuidelineSection = {
  id: "principles",
  title: "Principles",
  summary:
    "The grammar of the Foundation: semantic principles (what to express and when), animation operators (how to move), and channel principles (how to use body, face and sound).",
  entries: [
    {
      slug: "semantic",
      doc: semanticDoc,
      group: "semantic",
      ref: "sp.1–5",
      title: "Semantic",
      summary: "Five principles from the main study. Every MUST guardrail comes from here.",
      body: [
        {
          kind: "table",
          title: "Five principles",
          head: ["ID", "Principle", "Content", "Evidence (empirical)", "Derived rule"],
          rows: [
            ["sp.1", "Context decides meaning", "The same nod means \"yes\" after a question and \"hello\" at a first meeting.", "49% read a nod as a greeting", "Every behavior has a trigger and a forbid condition"],
            ["sp.2", "Not looking broken comes first", "If it looks broken, liking and trust collapse even when the meaning gets across. Three causes: irregular tremor, oversized motion, sudden acceleration.", "Perceived malfunction × overall rating r = −0.80 (strongest in the main study), pilot −0.76", "No tremor · size limit · repeat twice"],
            ["sp.3", "One meaning per motion", "Nod (yes) and bow (greeting) are both up-down, so they are often confused.", "Nod → greeting misread 49%", "Confusable pairs differ in at least one of direction, start pose or timing"],
            ["sp.4", "Body carries intensity; face and sound carry good or bad", "Gesture alone conveys arousal but not valence well.", "Sad → laughing 32%, fear → sneering 32%", "Negative emotion uses 2+ channels including face or sound. Otherwise do not express it."],
            ["sp.5", "Start, stop, return", "Without a stop at the end it reads as \"still going\".", "34% read pointing as \"looking around\"", "End hold 0.3–0.5 s · repeat twice · return to rest"],
          ],
        },
      ],
      related: ["guardrails", "combination-rules"],
      source: `${SRC} §3-1`,
    },
    {
      slug: "guardrails",
      doc: guardrailsDoc,
      group: "semantic",
      ref: "gr.*",
      title: "Guardrails",
      summary: "Eight rules nobody can change. A violation is corrected automatically and the user is told.",
      proposed: true,
      body: [
        {
          kind: "table",
          title: "MUST guardrails",
          head: ["ID", "Rule", "Check (example)", "On violation", "From"],
          rows: [
            ["gr.trigger", "Every behavior has a trigger and a forbid condition", "trigger != null && forbid_when != null", "Not generated", "SP-1"],
            ["gr.no_irregular_tremor", "Repeats are evenly spaced. No irregular tremor.", "cv(interval) <= 0.1", "Corrected to an even rhythm", "SP-2"],
            ["gr.amp_limit", "Size 40% ROM by default, 70% at most", "amp_pct_rom <= 70", "Scaled down as a whole + notice", "SP-2"],
            ["gr.one_meaning", "Confusable pairs differ in direction, start pose or timing", "diff(axis, start_pose, timing) >= 1", "Not generated", "SP-3"],
            ["gr.negative_two_channels", "Negative emotion uses 2+ channels including face or sound", "valence<0 → channels>=2 && (face||sound)", "Emotion omitted", "SP-4"],
            ["gr.end_hold", "Signals such as pointing or closing hold 0.3–0.5 s at the end", "hold_end_ms >= 300", "Hold inserted", "SP-5"],
            ["gr.repeat_max_2", "Two repeats at most, then back to rest", "count(repeat) <= 2", "Cut at 2 and return", "SP-2 · SP-5"],
            ["gr.response_time", "No silence over 1 s; safety within 0.1 s", "idle_gap_ms <= 1000, safety_latency_ms <= 100", "Small reaction inserted", "SP-2 (heuristic)"],
          ],
        },
        { kind: "p", text: "The IDs and check expressions are proposed. Actual thresholds (e.g. cv 0.1) are set in the simulator." },
      ],
      related: ["semantic", "combination-rules", "auto-checks"],
      source: `${SRC} §3-2`,
    },
    {
      slug: "combination-rules",
      doc: combinationDoc,
      group: "semantic",
      ref: "cmb.*",
      title: "Combination rules",
      summary: "HARD rules block generation; SOFT rules warn and allow. In short: one mind inside a beat, freedom between beats.",
      body: [
        {
          kind: "table",
          title: "HARD — not generated",
          head: ["ID", "HARD — not generated"],
          rows: [
            ["H1", "Do not use a large AMP and a large OVER in the same beat (it gets noisy)."],
            ["H2", "Total wait before moving (delay + pause + ANTIC) ≤ 1.2 s. Recommended ≤ 0.8 s."],
            ["H3", "Precision tasks (handing over objects) get no OVER and a limited AMP."],
            ["H4", "Slot grammar: ANTIC once at the very front; REACT and FOLLOW only after the main motion ends; no ANTIC on every beat."],
            ["H5", "Idle (loops) gets no ANTIC, REACT or OVER. Only continuous ones (breathing EASE, micro SECOND)."],
            ["H6", "Physical limits: min-jerk profile, minimum duration from vmax/amax, dead band."],
            ["H7", "No two commands on one channel at once (e.g. light breathing + light pulse)."],
          ],
        },
        {
          kind: "table",
          title: "SOFT — warning, then allowed",
          head: ["ID", "SOFT — warning, then allowed"],
          rows: [
            ["S1", "Arousal match inside a beat: mixing calm and excited signals warns (e.g. slow yet bouncy)."],
            ["S2", "State match: warns when the motion mood is far from the intended state."],
            ["S3", "Contrast between beats is allowed — \"quiet, then suddenly\" is how surprise is staged."],
          ],
        },
        { kind: "p", text: "Validated over about 26,000 simulated combinations. The H1 and H3 thresholds are still written in the old unit (AMP multiplier 1.2×, OVER > 10%) and will be restated in ROM %." },
      ],
      related: ["guardrails", "animation"],
      source: `${SRC} §3-3`,
    },
    {
      slug: "animation",
      doc: animationDoc,
      group: "animation",
      ref: "op.*",
      title: "Animation",
      summary: "Six Disney principles with robotics evidence, used by AI as generation operators. Each has a default, an allowed range and a style axis.",
      body: [
        {
          kind: "table",
          title: "Operators",
          head: ["ID", "Principle", "Definition", "Default (SHOULD)", "Range · MUST", "Style axis", "Evidence"],
          rows: [
            ["op.antic", "Anticipation", "A small move the opposite way just before a large motion", "7% of the main motion, 120 ms (turns: 2–3° the other way)", "Length 80–400 ms (pending). Never on symbolic signals (S1), repeats or idle.", "P5", "Literature (Takayama 2011)"],
            ["op.ease", "Slow in / slow out", "Start slow → fast → stop slow", "Normal: ease-in-out / reaction: ease-out (instant start) / limp exit: ease-in", "Only within motor speed and acceleration limits", "P2", "Literature (Saerbeck) + SP-5"],
            ["op.arc", "Arcs", "Lift slightly and come down on a curve while turning", "Tilt 4–8° during a turn, peak at 50%. Gaze part first, body 0.1–0.2 s later.", "Fixed quality rule, independent of style", "—", "Literature"],
            ["op.second", "Secondary action", "A small supporting move after a large one (blink, breath …)", "≤ 30% of the main motion, 0.15 s later, one at a time", "No other axis during a symbolic signal. Channel per robot (blink, breath, ear, tail, light, weight shift).", "P1", "Empirical + literature"],
            ["op.follow", "Follow-through", "The end part settles late when stopping", "End lag 0.06–0.12 s, one residual sway", "One residual sway at most (more = tremor = malfunction)", "P4", "Literature"],
            ["op.react", "Reaction", "Two sub-definitions (pending): 1 result reaction after a task (Takayama), back slot only; 2 contact reaction to petting or lifting", "Contact reaction within 0.3 s", "Fixed quality rule", "—", "Literature + heuristic"],
            ["op.amp", "Exaggeration (size)", "Upper bound of motion size", "40% ROM", "Max 70% ROM. 30% smaller with each repeat. Matches the intensity of the situation, not of the emotion.", "P1", "Empirical"],
            ["op.over", "Overshoot", "Pass the target slightly and come back", "3–8%, once", "Max 10%. Never on rest poses or precision tasks.", "P6", "Literature + heuristic"],
          ],
        },
        {
          kind: "p",
          text: "There are six principles; FOLLOW/REACT and AMP/OVER are split into two operators each in the data, giving eight IDs. Timing became the time tokens (pause, hold, delay, pulse, drift) and Staging became the spatial tokens (track, approach, retreat).",
        },
        {
          kind: "table",
          title: "Principles and style axes",
          head: ["Style axis", "Operator / parameter it moves", "Guardrail (cannot cross)"],
          rows: [
            ["P1 Reach", "AMP (amplitude per joint group) · SECOND (number of channels)", "Amplitude cap · joint limits"],
            ["P2 Speed contrast", "EASE (curve · time split)", "Servo max speed"],
            ["P3 Stillness", "Time tokens pause · hold", "End hold of pointing and closing cannot go to 0 (SP-5)"],
            ["P4 Afterglow", "FOLLOW (residual sway · decay)", "One residual sway · no irregular tremor"],
            ["P5 Anticipation", "ANTIC (size · length)", "Never on symbolic signals · skipped on repeats"],
            ["P6 Return", "Return remainder · OVER", "Repeating motions return fully"],
            ["—", "ARC · REACT", "Fixed quality rules, independent of style"],
          ],
        },
        {
          kind: "code",
          title: "Operator schema",
          lang: "json",
          text: `{ "id": "op.antic", "name": {"en": "Anticipation"}, "level": "SHOULD",
  "default": { "amount_pct": 7, "dur_ms": 120 },
  "range":   { "amount_pct": [0, 40], "dur_ms": [80, 400] },
  "style_axis": "P5",
  "apply_when": "main.amplitude >= rotate.turn",
  "never_on": ["S1_symbolic", "repeating", "idle"],
  "evidence": { "type": "literature", "ref": "Takayama et al. 2011" } }`,
        },
      ],
      related: ["combination-rules", "signature"],
      source: `${SRC} §4`,
    },
    {
      slug: "common",
      doc: commonDoc,
      group: "channel",
      ref: "ch.common",
      title: "Common",
      summary: "Channel order, priority, the fallback chain, and states that override behaviors.",
      body: [
        {
          kind: "table",
          title: "Rules",
          head: ["Rule", "Content"],
          rows: [
            ["Order", "Sound → face → body, 0.1 s apart"],
            ["Priority (higher interrupts lower)", "1 Safety (fall risk · strong force, 0.1 s) 2 Call · touch (turn within 1 s) 3 Reactions in conversation (backchannel · answers) 4 Waiting (habits · breathing)"],
            ["Fallback chain", "Missing channel → another channel stands in → otherwise omitted. Never fill in by enlarging motion (the \"no screen → +20%\" rule is removed)."],
            ["State before behavior", "See the states below"],
          ],
        },
        {
          kind: "table",
          title: "States",
          head: ["State", "What changes"],
          rows: [
            ["Carried", "Curl up, keep level, skip other behaviors"],
            ["Low battery", "Smaller; dozes earlier"],
            ["Quiet hours", "Less sound, smaller motion"],
            ["Error", "Stop and tell with the face"],
          ],
        },
      ],
      related: ["body", "face", "sound", "carried"],
      source: `${SRC} §5-4`,
    },
    {
      slug: "body",
      doc: motionDoc,
      group: "channel",
      ref: "ch.body",
      title: "Motion",
      summary: "Write motion for roles, slow down near limits, gaze before body, and always start, stop and return.",
      body: [
        {
          kind: "table",
          title: "Rules",
          head: ["Rule", "Content", "Level"],
          rows: [
            ["Write for roles", "Not \"tilt the head\" but \"tilt the gaze part\". If the role is missing another part stands in; if none, skip.", "MUST"],
            ["Slow near limits", "Decelerate from 85% ROM. A motion that cannot be followed is scaled down as a whole (not clipped) + notice.", "MUST"],
            ["Gaze first, body later", "The gaze part leads; the body follows 0.1–0.2 s later. Gaze and tilt point the same way.", "SHOULD"],
            ["Start → hold → return", "Every motion has three phases. During a hold keep ±0.5° micro motion (fully frozen feels like a security camera).", "MUST (structure) · SHOULD (values)"],
            ["Contact reaction", "Petting or holding a joint → follow with 40% less force (within 0.3 s).", "SHOULD"],
            ["Lifted reaction", "Within 0.1 s curl up and keep the gaze level.", "MUST"],
            ["Impact reaction", "Stop expressing emotion → protective pose.", "MUST"],
            ["Never", "Joints moving independently while lifted · moving fast near limits · enlarging motion to make up for a missing face or sound.", "MUST"],
          ],
        },
      ],
      related: ["face", "common", "notation"],
      source: `${SRC} §5-1`,
    },
    {
      slug: "face",
      group: "channel",
      ref: "ch.face",
      title: "Face",
      summary: "An expression is a change of values on one base face. Eye shape carries valence.",
      body: [
        {
          kind: "table",
          title: "Face classes",
          head: ["Face class", "Looks", "Usable tokens"],
          rows: [
            ["none", "No screen", "None → emotion is omitted"],
            ["light", "One LED", "eye.size → brightness, blink → flashing"],
            ["eyes", "Two eyes on a screen", "The 4 eye tokens"],
            ["full", "Eyes · eyebrows · mouth", "4 eye tokens + eyebrow · mouth · nose"],
          ],
        },
        {
          kind: "table",
          title: "Rules",
          head: ["Rule", "Content"],
          rows: [
            ["Expression = change of values", "Size, angle and shape change on one base face. Pictures are not swapped."],
            ["Eye shape carries valence", "So a robot with only eyes can show emotion. A full face is settled eyes → eyebrows → mouth."],
            ["Rhythm", "Enter fast 0.2–0.4 s · hold 1–7 s (shape fixed, only position moves in the emotion's rhythm) · return 0.2–0.4 s"],
            ["Transition", "Same family: smooth (TWEEN). Different family (heart …): squash, then switch (SWAP). Never melt through in-between shapes."],
            ["Boundary", "Expressions do not pass through the base face; one blink is the boundary."],
            ["With the body", "The face holds 0.6 s after the body stops. Never change only the face while the body is still."],
            ["Never", "Eyes and mouth telling different emotions · irregular tremor during a hold · 100% blinks (close to 70% only)."],
          ],
        },
        {
          kind: "table",
          title: "Hold-loop signatures",
          head: ["Emotion", "Hold loop", "Pattern"],
          rows: [
            ["Smile", "bounce", "Fast, even small bounces (0.32 s period)"],
            ["Sad", "sob_burst", "Two short bursts → 0.5 s rest"],
            ["Heart", "float", "Slow continuous sine (1.7 s)"],
            ["Surprise", "saccade", "Still-move-still"],
            ["Head tilt", "none", "Fully still"],
            ["Doze", "decay", "Monotonic fall"],
          ],
        },
        { kind: "p", text: "Loop rules: arousal → period (high 0.25–0.4 s ↔ low 1.2–1.8 s); valence → pattern (positive = continuous, negative = burst-rest). Measured in the FaceUI v2 analysis." },
      ],
      related: ["eye-shape", "blink", "pure-desk"],
      source: `${SRC} §5-2; Figma W03-2L 808:1649`,
      doc: faceDoc,
    },
    {
      slug: "sound",
      doc: soundDoc,
      group: "channel",
      ref: "ch.sound",
      title: "Sound",
      summary: "One source sound per behavior; emotion is pitch and tempo; timbre stays fixed.",
      body: [
        {
          kind: "table",
          title: "Rules",
          head: ["Rule", "Content"],
          rows: [
            ["One source sound", "One source sound per behavior. Every emotional variation comes from it."],
            ["Emotion = pitch + tempo", "Up = positive or question, down = negative or closing / fast = energy, slow = weight."],
            ["Timbre is fixed", "Timbre is the robot's character. It does not change per emotion."],
            ["Order", "Sound 0.1 s first → face → body. 1 s fade at the end."],
            ["Frequency", "At most 2 per 10 s, at least 0.8 s apart. No sound on every gaze shift. Fewer during quiet hours."],
            ["No speaker", "Positive → body + face as is / negative → expressed if there is a face, otherwise omitted (kept when 2 channels remain)."],
          ],
        },
        {
          kind: "table",
          title: "Emotion variations",
          head: ["Emotion", "Variation"],
          rows: [
            ["Excited", "+5 st · 1.4×"],
            ["Curious", "+2 st · rising end"],
            ["Worried", "−3 st · slower"],
            ["Sad", "−6 st · fades out"],
          ],
        },
        { kind: "p", text: "Evidence: heuristic." },
      ],
      related: ["pitch", "tempo", "common"],
      source: `${SRC} §5-3`,
    },
  ],
};
