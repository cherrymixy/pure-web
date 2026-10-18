// Situation patterns (editor Context) = guideline v3 §8-1 (pat.*). Guideline detail lives in data/guideline/situation.ts (same slugs).
// The last four are proposed in the guideline.
export const SITUATION_PATTERNS = [
  { id: "face-to-face", label: "Face to Face", hint: "Facing each other, focused on the interaction." },
  { id: "touching", label: "Touching", hint: "The person touches the robot's body or joints directly." },
  { id: "calling", label: "Calling", hint: "A voice or signal asks for attention right away." },
  { id: "carried", label: "Carried", hint: "The robot is lifted up or carried somewhere." },
  { id: "pass-by", label: "Pass By", hint: "Someone walks past without any intent." },
  { id: "leave", label: "Leave", hint: "The person leaves the space and the interaction ends." },
  { id: "by-your-side", label: "By your side", hint: "Sharing the same space without talking." },
  { id: "conversation", label: "Conversation", hint: "A yes/no or unclear moment in a conversation." },
  { id: "feedback", label: "Feedback", hint: "Reacting to the result after a task is done." },
  { id: "guiding", label: "Guiding", hint: "Showing a direction or a place." },
  { id: "sudden", label: "Sudden", hint: "An unexpected sound or movement." },
] as const;

export type SituationPatternId = (typeof SITUATION_PATTERNS)[number]["id"];
