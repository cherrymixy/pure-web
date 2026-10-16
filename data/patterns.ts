// Situation patterns (editor Context). Guideline detail lives in data/guideline/situation.ts (same slugs).
export const SITUATION_PATTERNS = [
  { id: "face-to-face", label: "Face to Face", hint: "The person is right in front of the robot, facing it." },
  { id: "touching", label: "Touching", hint: "The person touches or pats the robot." },
  { id: "side-by-side", label: "Side by side", hint: "Working next to each other, both facing the desk." },
  { id: "passing-by", label: "Passing by", hint: "Someone walks past without stopping." },
  { id: "calling", label: "Calling", hint: "The person calls the robot from across the room." },
  { id: "at-a-distance", label: "At a distance", hint: "The person is in the room but far away." },
  { id: "alone", label: "Alone", hint: "Nobody is around." },
] as const;

export type SituationPatternId = (typeof SITUATION_PATTERNS)[number]["id"];
