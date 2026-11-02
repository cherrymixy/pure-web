// Situation patterns (editor Context) = guideline v3 §8-1 (pat.*). Guideline detail lives in data/guideline/situation.ts (same slugs).
// The last four are proposed in the guideline. `uses` = the pattern's sequence (component ids, data/guideline/situation.ts).
export const SITUATION_PATTERNS = [
  { id: "face-to-face", label: "Face to Face", hint: "Facing each other, focused on the interaction.", art: "/figma/patterns/face-to-face.svg", uses: ["nod", "curious", "joy"] },
  { id: "touching", label: "Touching", hint: "The person touches the robot's body or joints directly.", art: "/figma/patterns/touching.svg", uses: ["rub", "joy"] },
  { id: "calling", label: "Calling", hint: "A voice or signal asks for attention right away.", uses: ["approach", "bow"] },
  { id: "carried", label: "Carried", hint: "The robot is lifted up or carried somewhere.", uses: [] },
  { id: "pass-by", label: "Pass By", hint: "Someone walks past without any intent.", uses: ["track"] },
  { id: "leave", label: "Leave", hint: "The person leaves the space and the interaction ends.", uses: ["bow", "close"] },
  { id: "by-your-side", label: "By your side", hint: "Sharing the same space without talking.", uses: ["doze", "stretch"] },
  { id: "conversation", label: "Conversation", hint: "A yes/no or unclear moment in a conversation.", uses: ["nod", "shake", "curious"] },
  { id: "feedback", label: "Feedback", hint: "Reacting to the result after a task is done.", uses: ["joy", "sad", "laugh"] },
  { id: "guiding", label: "Guiding", hint: "Showing a direction or a place.", uses: ["point"] },
  { id: "sudden", label: "Sudden", hint: "An unexpected sound or movement.", uses: ["surprise", "fear"] },
] as const;

export type SituationPatternId = (typeof SITUATION_PATTERNS)[number]["id"];

/**
 * Patterns an expression fits (editor Context › Situation Pattern): the one chosen when it was generated, then every
 * pattern whose sequence (`uses` = guideline §8 component ids) shares a component with it — most shared first.
 */
export function appliedPatterns(chosen: string | undefined, components: readonly string[]) {
  const shared = (uses: readonly string[]) => uses.filter((c) => components.includes(c)).length;
  return SITUATION_PATTERNS.filter((p) => p.id === chosen || shared(p.uses) > 0).sort(
    (a, b) => Number(b.id === chosen) - Number(a.id === chosen) || shared(b.uses) - shared(a.uses),
  );
}
