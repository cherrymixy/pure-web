import type { GuidelineSection } from "./types";

// Source: PURE guideline final structure v3 (2026-10-19) §0 structure, §1 premises, §2 pipeline, §12-1 ID prefixes, §12-2 AI rules.

const SRC = "PURE guideline final structure v3 (2026-10-19)";

export const overview: GuidelineSection = {
  id: "overview",
  title: "Overview",
  summary:
    "How the PURE Motion System is layered, the premises behind it, how values are written, and where each layer is used when AI generates motion.",
  entries: [
    {
      slug: "structure",
      title: "System structure",
      summary: "Guideline (Foundation, Component, Pattern, Template) is shared by every robot and style. Style changes per user or brand. Validation checks the result.",
      body: [
        {
          kind: "code",
          title: "Layer map",
          lang: "text",
          text: [
            "PURE Motion System",
            "├─ Guideline ──────────── shared by every robot and every style",
            "│  ├─ Foundation ──────── the base that does not change (grammar + words)",
            "│  │  ├─ Principle (grammar: how to use it)",
            "│  │  │  ├─ 1 Semantic      SP-1–5 → 8 MUST guardrails + token combination rules",
            "│  │  │  ├─ 2 Animation 6   ANTIC · EASE · ARC · SECOND · FOLLOW/REACT · AMP/OVER",
            "│  │  │  │                  = AI generation operators: default + allowed range + style axis",
            "│  │  │  └─ 3 Channel       body · face · sound + common (order · priority · fallback · state)",
            "│  │  └─ Primitive (words: the smallest units and their values)",
            "│  │     ├─ Role         ATTEND · POSTURE · LOCOMOTE · GESTURE (+ FACE · VOICE · LIGHT)",
            "│  │     ├─ Body 10      space: tilt · rotate · track · approach · retreat",
            "│  │     │               time:  pause · hold · delay · pulse · drift",
            "│  │     ├─ Face 4       eye.size · eye.angle · eye.shape · blink (+ eyebrow · mouth · nose)",
            "│  │     └─ Sound 4      pitch · tempo · timbre · length (volume is set by state)",
            "│  ├─ Component ── 16 behaviors = body · face · sound tracks + trigger / forbid + ρ + recognize",
            "│  ├─ Pattern ──── 7 situations (+4 proposed) = trigger → behavior sequence → exit + transitions · priority",
            "│  └─ Template ─── 5 form-factor profiles (role → real joints) × 4 face classes",
            "│                  + source profiles (human · dog · cat · character parts → roles)",
            "│                  + robot instances (PURE pet robot, PURE Desk …)",
            "├─ Style ──────────────── differs per user and brand",
            "│     Signature = 6 axes P1–P6 + strength w; presets: Cat · Dog · Drama · Animation",
            "│     Only inside SHOULD ranges · never past MUST · damped per behavior by ρ",
            "└─ Validation ─────────── recognition rate · perceived malfunction + automatic checks after generation",
          ].join("\n"),
        },
        {
          kind: "table",
          title: "Rules between layers",
          head: ["Rule", "Meaning"],
          rows: [
            ["Refer only downward", "A Component uses only Foundation token and operator names. A Pattern uses only Components. Tokens are never written into a Pattern directly."],
            ["Style changes values only", "Style moves token values and operator parameters only inside SHOULD ranges. It cannot change rules (MUST)."],
            ["Template changes the body", "The same Component runs on different joints per robot through the Template's role mapping."],
            ["One data source, two views", "The source is one set of JSON/YAML. The human web guide and the AI input are both built from it."],
          ],
        },
      ],
      related: ["premises", "pipeline"],
      source: `${SRC} §0`,
    },
    {
      slug: "premises",
      title: "Premises and levels",
      summary: "Four premises shape the design. The core idea: define ranges, not fixed values.",
      body: [
        {
          kind: "table",
          title: "Four premises",
          head: ["#", "Premise", "Effect on the design"],
          rows: [
            ["1", "It is for many robot forms (stand, humanoid, wheeled …), not for a single robot.", "Rules and tokens are not tied to joint names → role-based, normalized units."],
            ["2", "AI makes motion from this guideline (e.g. dog video → analysis → robot motion).", "The guideline is a document and also AI input data → machine-readable and checkable."],
            ["3", "The user's style is applied (e.g. an anime-style dog motion).", "Unlike a UX/UI system that fixes values, it defines ranges, rules and priorities."],
            ["4", "People must understand it easily on the web.", "The AI spec and the human page both come from the same data."],
          ],
        },
        {
          kind: "table",
          title: "Ranges, not values",
          head: ["Level", "Meaning", "Who can change it", "On violation"],
          rows: [
            ["MUST", "Breaking it reads as malfunction, misunderstanding or danger. Grounded in the main study.", "Nobody", "Auto-corrected + user notice (HARD)"],
            ["SHOULD", "Has a recommended value and an allowed range.", "Style only inside the range. A designer may edit outside it.", "Warning on manual edits outside the range (SOFT)"],
            ["MAY", "Identity area, set by the source video and the user's style.", "Anyone", "—"],
          ],
        },
      ],
      related: ["units-evidence", "structure"],
      source: `${SRC} §1-1, §1-2`,
    },
    {
      slug: "units-evidence",
      title: "Units and evidence",
      summary: "Perceived values are absolute; body-size values are ratios. Every value carries an evidence tag.",
      body: [
        {
          kind: "table",
          title: "Units",
          head: ["Kind of value", "How it is written", "Example"],
          rows: [
            ["Perceived by people (independent of robot size)", "Absolute: time ms · angle ° · pitch semitones (st)", "End hold 300 ms, tilt 12°"],
            ["Depends on body size", "Ratio: distance = body height (BH) · size = joint range of motion % (ROM) · speed = % of max speed (vmax)", "approach 0.3 BH, AMP 40% ROM, rotate 35% vmax"],
            ["Face size", "Ratio of screen height", "eye.size 0.24"],
          ],
        },
        { kind: "p", text: "Tilt angles stay in degrees because they are perceptual thresholds. They are clamped to the joint limits of the robot class." },
        {
          kind: "table",
          title: "Evidence tags",
          head: ["Tag", "Meaning"],
          rows: [
            ["Empirical", "Confirmed in the PURE main study (n=47) or pilot (n=4)"],
            ["Literature", "Robotics and animation research papers"],
            ["Heuristic", "Set by the designer; to be calibrated with user tests"],
            ["Hypothesis", "Kept as an independent variable in tests (e.g. idle intensity)"],
          ],
        },
        {
          kind: "p",
          text: "Notation: \"%\" = share of respondents; \"pt\" = a 7-point mean converted to 0–100 ((mean − 1) ÷ 6 × 100). Recognition rates use the strict criterion of the main study only.",
        },
      ],
      related: ["premises", "id-rules"],
      source: `${SRC} §1-3, §1-4`,
    },
    {
      slug: "pipeline",
      title: "Generation pipeline",
      summary: "Five steps from input to pure.json, and which layer each step reads.",
      body: [
        {
          kind: "table",
          title: "Steps",
          head: ["Step", "Question", "Reads"],
          rows: [
            ["1 Meaning recognition", "Which behavior is this movement?", "Component.recognize"],
            ["2 Signature measurement", "How did it move (P1–P6)?", "Style axis definitions"],
            ["3 Retarget", "Which part of this robot does it?", "Template role mapping + source profile"],
            ["4 Style", "User style × per-behavior ρ", "Style + Component.ρ"],
            ["5 Guardrail check", "Fix MUST violations, joint and speed limits", "Foundation MUST + Template limits"],
          ],
        },
        { kind: "p", text: "Input: a dog video, an image or link, or a conversation. Output: pure.json + preview + correction notices." },
        {
          kind: "code",
          title: "Formula",
          lang: "text",
          text: [
            "final = clamp( source + w × ρ × (style − source), guardrail range )",
            "",
            "  source  signature measured from the source video (P1–P6 → operator parameters)",
            "  style   the style coordinates the user picked (e.g. Animation)",
            "  w       style strength (0–1, set by the user)",
            "  ρ       the behavior's style acceptance (a Component property)",
            "  clamp   MUST guardrails + the robot class's joint and speed limits",
          ].join("\n"),
        },
        {
          kind: "p",
          text: "Example: Joy (high ρ) takes on the animation style strongly; Shake (low ρ) keeps almost its original shape. A dog shaking its body irregularly hits \"no irregular tremor\", is corrected to an even rhythm (pulse), and the user is told.",
        },
      ],
      related: ["structure", "rho"],
      source: `${SRC} §2`,
    },
    {
      slug: "id-rules",
      title: "IDs and AI-friendly rules",
      summary: "Every item has a unique ID with a layer prefix, and every rule is written so a machine can check it.",
      body: [
        {
          kind: "table",
          title: "ID prefixes",
          head: ["Layer", "Prefix", "Example"],
          rows: [
            ["Semantic principle", "sp.", "sp.4"],
            ["Guardrail", "gr.", "gr.repeat_max_2"],
            ["Combination rule", "cmb.", "cmb.H2"],
            ["Operator", "op.", "op.antic"],
            ["Channel principle", "ch.", "ch.face"],
            ["Role", "role.", "role.attend"],
            ["Token", "tok.", "tok.body.tilt.m"],
            ["Behavior", "cmp.", "cmp.curious"],
            ["Situation", "pat.", "pat.calling"],
            ["Form factor · source · robot", "ff. · src. · robot.", "ff.legged"],
            ["Style", "style.", "style.animation"],
            ["Evidence", "ev.", "ev.b11.malfunction"],
          ],
        },
        {
          kind: "list",
          title: "Seven rules for AI-readable data",
          items: [
            "Every item has a unique ID with its layer prefix.",
            "Body parts are role-based.",
            "Units are normalized (see Units and evidence).",
            "Rules are checkable expressions (check).",
            "Each rule has a level MUST / SHOULD / MAY and on_violation: clamp / substitute / skip / warn.",
            "Two-way: making (recipe) and recognizing (recognize).",
            "Evidence tags (evidence).",
          ],
        },
      ],
      related: ["units-evidence", "notation"],
      source: `${SRC} §12-1, §12-2`,
    },
  ],
};
