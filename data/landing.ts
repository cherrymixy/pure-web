// W00-1 landing copy (CLAUDE.md rule 9). Final wording is aligned to Figma in the design pass.
export const LANDING = {
  hero: {
    tagline: "Pure motion, is its own signature.",
    body: "Design how your robot moves, looks and sounds — from your brand guide to a file the robot can play.",
    cta: "Open Lab",
  },
  why: {
    title: "Why PURE",
    body: "Robots are starting to share our desks and homes. How they move is how they speak. PURE turns a brand's character into motion people can read.",
    points: [
      { title: "Signature first", body: "Your brand guide becomes an 8-axis motion signature: tempo, amplitude, settle, anticipation, rhythm, eyes, pitch and density." },
      { title: "Situations, not keyframes", body: "Describe the moment — \"I'm so tired, I keep nodding off\" — and get a full expression to refine." },
      { title: "Checked before it ships", body: "Every expression is checked against joint limits and speed before it reaches a robot." },
    ],
  },
  expert: {
    title: "For Expert",
    body: "One editor for the three channels a robot expresses with.",
    channels: [
      { id: "motion", title: "Motion", body: "Behavior recipes on a real physics simulation, tuned with properties and a 30fps timeline." },
      { id: "face", title: "Face", body: "Eyes and brows drawn from tokens — size, angle, brightness and blink — keyed along the timeline." },
      { id: "sound", title: "Sound", body: "Short synthesized cues placed on the same timeline, pitched by your signature." },
    ],
  },
  daily: {
    title: "For Daily User",
    body: "People never see a keyframe. They see a robot that greets them, gets curious and dozes off in a way that feels like one consistent character.",
  },
  robotTypes: {
    title: "Robot types",
    body: "PURE describes five robot classes. This demo runs Joint Fixed on PURE Desk.",
  },
  guideline: {
    title: "Guideline",
    body: "Principles, primitive tokens, behaviors and situations — the shared language behind every expression.",
    cta: "Read the guideline",
  },
  footer: {
    line: "PURE Expert Lab · Graduation exhibition demo",
    company: "Purebot Co.",
  },
} as const;
