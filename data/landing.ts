// W00-1 landing copy (docs/conventions.md rule 9). Text = Figma "W00-1.landing / Landing" (901:6909), English as drawn.
// The only source of landing text. Robot-type card text lives here (display copy), not in data/robot-types.ts.

export const LANDING = {
  nav: {
    items: [
      { label: "Why PURE", href: "#why" },
      { label: "For Expert", href: "#expert" },
      { label: "Robot types", href: "#robot-types" },
      { label: "Guideline", href: "#guideline" },
    ],
    signIn: "Sign in",
    tryPure: "Try PURE",
    logoAlt: "PURE",
  },
  hero: {
    badge: "Motion Design System for Physical AI",
    headline: ["Pure motion,", "is its own signature"],
    robotAlt: "PURE Desk robot",
  },
  why: {
    label: "Why PURE",
    headline: ["Robots are learning to move.", "Few of them feel like anyone."],
    body: "The same motion can feel completely different on two robots. PURE turns how a robot moves, looks and sounds into one character people can read.",
  },
  channels: {
    title: "One signature, three channels",
    motion: {
      title: "Motion",
      body: "How fast it moves, how far it leans, how it settles.",
      rows: [
        { token: "tilt.s", value: "8°", use: "listen" },
        { token: "tilt.m", value: "14°", use: "greet" },
        { token: "tilt.l", value: "22°", use: "curious" },
      ],
    },
    face: {
      title: "Face",
      body: "Eyes and expressions that change with the body.",
      basic: "Basic",
      sizeUp: "Size Up",
    },
    sound: {
      title: "Sound",
      body: "Short cues tuned to the same personality.",
    },
    axesLabel: "+ 8 axes",
    axes: ["tempo", "amplitude", "settle", "anticipation", "rhythm", "eyes", "pitch", "density"],
  },
  daily: {
    label: "For Daily User",
    headline: ["Say what’s happening.", "Your robot answers in motion."],
    body: "Tell it “someone came home” or show it a video.\nPurebot replies with a motion in its own character,\nand you can save it to play on its own.",
    points: ["Pick a robot, shape its character", "Say it, or show a video", "Send it to your robot"],
    cta: "Get the app",
    phoneHomeAlt: "PURE app home: Hi SeungA, what’s happening?",
    phonePlayingAlt: "PURE app: playing a motion on Purebot",
  },
  expert: {
    label: "For Expert",
    headline: "From a 3D model to a brand-ready motion spec",
    steps: [
      "Try a PURE robot type, or import your own",
      "Turn the brand guide into a signature",
      "Generate, tune and test on the robot",
      "Export pure.json or send to the robot",
    ],
    cta: "Open Lab",
    imageAlt: "PURE Expert Lab on a desktop monitor",
  },
  robotTypes: {
    title: "Made for every kind of physical AI",
    body: "Pick the type first. PURE sets joints, limits and channels for that body.",
    jointsLabel: "Joints",
    channelsLabel: "Channels",
    channels: ["Motion", "Face", "Sound"],
    cards: [
      { id: "jointless-driving", name: "Jointless Driving", description: "Wheeled bodies, no joints", joints: "0 joints · wheels" },
      { id: "joint-driving", name: "Joint Driving", description: "Wheeled bodies with joints", joints: "2–6 joints + wheels" },
      { id: "joint-fixed", name: "Joint Fixed", description: "Desk, service and industrial arms", joints: "5–9 DoF" },
      { id: "joint-walking", name: "Joint Walking", description: "Two-legged walkers", joints: "10–14 DoF" },
      { id: "full-body", name: "Full-body", description: "Two arms, two legs, a face", joints: "23–43 DoF" },
    ],
  },
  guideline: {
    label: "GUIDELINE",
    headline: ["Built on an open", "motion design system"],
    body: "Principles, tokens, components and patterns for robot motion, documented like any design system.",
    cta: "Read the guideline",
    tokens: [
      { token: "tilt.s", use: "listen", value: "8°" },
      { token: "tilt.m", use: "greet / default", value: "14°" },
      { token: "tilt.l", use: "curious", value: "22°" },
      { token: "tilt.xl", use: "excited", value: "30°" },
    ],
  },
  cta: {
    headline: "Give your robot a signature.",
    body: "Start at home with the app, or build one for your brand on the web.",
    button: "Try PURE",
  },
  footer: {
    brand: "PURE",
    tagline: "Motion design system for physical AI",
    columns: [
      { title: "Product", links: [{ label: "Try PURE", href: "/lab" }, { label: "Sign in", href: "/lab" }, { label: "Get the app", href: "/lab" }] },
      { title: "Resources", links: [{ label: "Guideline", href: "/guideline" }, { label: "Download", href: "/lab" }, { label: "Robot types", href: "#robot-types" }] },
      { title: "Company", links: [{ label: "Terms", href: null }, { label: "Privacy", href: null }, { label: "Contact", href: null }] },
    ],
    copyright: "© 2026 PURE",
  },
} as const;
