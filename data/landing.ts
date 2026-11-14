import { ROBOT_TYPES } from "@/data/robot-types";

// Landing (Figma slides 1067:3102 · 3116 · 3131 · 3151 · 3160). Copy as designed; images swap here later.
// hero.video: set a /public path (mp4/webm) and scroll scrubs its frames; until then the still image is used.

export const LANDING = {
  nav: {
    simulation: { label: "Web Simulation (now HERE!)", href: "" }, // "you are here" badge, not a link
    behance: { label: "Behance", href: "" }, // shortcut: empty until the link exists — renders as plain text
    github: { label: "GitHub", href: "https://github.com/cherrymixy/pure-web" },
  },
  hero: {
    image: "/figma/landing/hero-robot.png",
    video: "",
    wordmark: "/figma/landing/pure-wordmark.svg",
    tagline: "A new way for robots to move",
    leftTitle: "Hongik Univ. Design Convergence",
    leftBody: "We believe that a robot's movements are not merely a means to execute commands, but a form of expression that can build relationships and convey emotions.",
    rightTitle: "Seounggeun Choi Taerim Bang SeungA Jeon",
    rightBody: "Starting from this idea, PURE is a graduation project that helps robots express their unique personality through movements and actions, beyond just performing assigned functions.",
  },
  moments: {
    lines: [["Every ", "pure", " moment"], ["we encounter"], ["in life"]],
    // image: "" → gray placeholder box (Figma #ddd)
    items: [1, 2, 3, 4, 5].map((n) => ({ image: "", caption: `이미지에 해당하는 순간 서술 ${n}` })),
  },
  robots: {
    lines: ["Any type of robot", "Without restrictions"],
    // One frame per PURE robot type, clockwise from the top.
    frames: ROBOT_TYPES.map((t) => ({ image: `/figma/type/${t.id}.png`, caption: t.name })),
  },
  outro: { top: "PURE", bottom: "Web Simulation", start: "Click to Start", circle: "/figma/landing/start-circle.svg", href: "/lab" },
};
