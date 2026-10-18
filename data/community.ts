import type { UserDataMotion } from "@/lib/models";
import type { SituationPatternId } from "./patterns";

// Community cards (Figma 943:1134) and detail (943:1619).
// Card art = one transparent image per motion (robot + face + motion arrows), drawn in the card's 318×308 art box at @2x.
// The eight motions drawn in Figma use that art (composed from each card's art layers, public/figma/community);
// every other behavior is the simulator's round-head PURE Desk holding a representative pose (public/community).

const FIGMA = "/figma/community";
const RENDER = "/community";

export type Waveform = "wave20" | "wave16" | "wave12";

export interface CommunityCard {
  art: string;
  /** Sound preview drawn on the card; null = a flat line (no sound) */
  wave: Waveform | null;
}

export const WAVEFORM_SRC: Record<Waveform | "flat", string> = {
  wave20: `${FIGMA}/wave20.svg`,
  wave16: `${FIGMA}/wave16.svg`,
  wave12: `${FIGMA}/wave12.svg`,
  flat: `${FIGMA}/flat.svg`,
};

/** Figma-drawn motions, by motion id */
const MOTION_CARDS: Record<string, CommunityCard> = {
  "ud-look_around": { art: `${FIGMA}/look-around@2x.png`, wave: "wave20" },
  "ud-greet": { art: `${FIGMA}/greet@2x.png`, wave: "wave20" },
  "ud-sleep": { art: `${FIGMA}/sleep@2x.png`, wave: null },
  "ud-happy": { art: `${FIGMA}/happy@2x.png`, wave: "wave16" },
  "ud-stretch": { art: `${FIGMA}/stretch@2x.png`, wave: null },
  "ud-sad": { art: `${FIGMA}/sad@2x.png`, wave: "wave12" },
  "ud-surprise": { art: `${FIGMA}/surprise@2x.png`, wave: "wave20" },
  "ud-fear": { art: `${FIGMA}/fear@2x.png`, wave: null },
};

/** Everything else (other seeds, user uploads), by the motion's first behavior */
const BEHAVIOR_CARDS: Record<string, CommunityCard> = {
  idle: { art: `${RENDER}/idle@2x.png`, wave: null },
  doze: { art: `${RENDER}/doze@2x.png`, wave: "wave12" },
  sleep: MOTION_CARDS["ud-sleep"],
  wake: { art: `${RENDER}/wake@2x.png`, wave: "wave16" },
  nod: { art: `${RENDER}/nod@2x.png`, wave: "wave12" },
  shake: { art: `${RENDER}/shake@2x.png`, wave: null },
  look_around: MOTION_CARDS["ud-look_around"],
  curious: { art: `${RENDER}/curious@2x.png`, wave: "wave16" },
  happy: MOTION_CARDS["ud-happy"],
  sad: MOTION_CARDS["ud-sad"],
  alert: { art: `${RENDER}/alert@2x.png`, wave: "wave20" },
  greet: MOTION_CARDS["ud-greet"],
  sweep: { art: `${RENDER}/sweep@2x.png`, wave: null },
  focus: { art: `${RENDER}/focus@2x.png`, wave: null },
  home: { art: `${RENDER}/home@2x.png`, wave: null },
};

export function communityCard(m: Pick<UserDataMotion, "id" | "preview">): CommunityCard {
  return MOTION_CARDS[m.id] ?? BEHAVIOR_CARDS[m.preview.steps[0]?.behavior ?? ""] ?? BEHAVIOR_CARDS.home;
}

/** List tabs (sidebar sub-nav, ?tab=): All · Popular (most used) · Recently (newest first) */
export type CommunityTab = "all" | "popular" | "recent";
export const tabOf = (value: string | null): CommunityTab => (value === "popular" || value === "recent" ? value : "all");

/** Cards shown before "More" (and added per click) */
export const COMMUNITY_PAGE_SIZE = 12;

/** Detail stage camera: the robot at the Figma size (≈ 41% of the stage height), farther than the editor's hero view */
export const COMMUNITY_STAGE_VIEW = { distance: 1.3 };

/** Detail › Situation Pattern, by motion category */
export const CATEGORY_PATTERNS: Record<UserDataMotion["category"], SituationPatternId[]> = {
  Idle: ["alone", "at-a-distance"],
  Approach: ["calling", "face-to-face"],
  Interaction: ["face-to-face", "touching"],
  Task: ["side-by-side", "passing-by"],
  Expressive: ["face-to-face", "touching"],
  Other: ["passing-by"],
};

/** Detail › User Review: photos people shared of the motion on their robot (Figma 943:1619 demo photos) */
export const COMMUNITY_REVIEWS = [
  { src: `${FIGMA}/review-1.jpg`, alt: "PURE Desk beside a laptop at night" },
  { src: `${FIGMA}/review-2.jpg`, alt: "PURE Desk on a white desk" },
  { src: `${FIGMA}/review-3.jpg`, alt: "PURE Desk on a café table" },
];
