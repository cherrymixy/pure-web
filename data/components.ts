import type { SimBehaviorId } from "./sim-behaviors";

// Component chips (editor Context) = the guideline's 16 behaviors (PURE guideline v3 §7-1, cmp.*).
// `sim` is the simulator behavior that plays it (data/sim-behaviors.ts); several are approximations.
export interface ComponentSim {
  behavior: SimBehaviorId;
  speed?: number;
  amplitude?: number;
}

export const COMPONENTS = [
  { id: "nod", label: "Nod", description: "Two small nods right after a question, then back to rest.", sim: { behavior: "nod" } },
  { id: "shake", label: "Shake", description: "The agreed signal for “no”, kept as it is.", sim: { behavior: "shake" } },
  { id: "bow", label: "Bow", description: "Only when someone arrives or leaves. Starts from a slight bow and never bows deep.", sim: { behavior: "greet" } },
  { id: "doze", label: "Doze", description: "After a long time without input, slowly loses strength.", sim: { behavior: "doze" } },
  { id: "point", label: "Point", description: "Gaze first, body after, and a clear stop on the target.", sim: { behavior: "sweep" } },
  { id: "joy", label: "Joy", description: "An even rhythm twice, with a smiling face and a bright sound.", sim: { behavior: "happy" } },
  { id: "laugh", label: "Laugh", description: "The same rhythm as joy, bigger. Never used without a face.", sim: { behavior: "happy", amplitude: 1.2 } },
  { id: "sad", label: "Sad", description: "Sinks down as strength drains, and stays. No repeats.", sim: { behavior: "sad" } },
  { id: "surprise", label: "Surprise", description: "Once, short, and straight back to rest.", sim: { behavior: "alert" } },
  { id: "fear", label: "Fear", description: "Backs off, lowers and stops. A change of posture, not trembling.", sim: { behavior: "alert", amplitude: 0.7 } },
  { id: "curious", label: "Curious", description: "When input is unclear: one tilt, then a stop.", sim: { behavior: "curious" } },
  { id: "approach", label: "Approach", description: "Moves closer, then stops at eye level.", sim: { behavior: "focus" } },
  { id: "keep_distance", label: "Keep distance", description: "Backs off and stops. Reads as a shy, cat-like character.", sim: { behavior: "home" } },
  { id: "close", label: "Close", description: "Watches like a send-off, holds, lowers its sound and settles to rest.", sim: { behavior: "home" } },
  { id: "stretch", label: "Stretch", description: "Now and then after a long wait. No meaning, just a sign of life.", sim: { behavior: "wake" } },
  { id: "rub", label: "Rub", description: "Rubs against a hand or an object. A sign of affection.", sim: { behavior: "happy", speed: 0.7 } },
] as const satisfies readonly { id: string; label: string; description: string; sim: ComponentSim }[];

export type ComponentId = (typeof COMPONENTS)[number]["id"];

export const componentOf = (id: string) => COMPONENTS.find((c) => c.id === id);

/** Guideline Behavior entry for a component (data/guideline/behavior.ts slugs = kebab-case ids). */
export function guidelineSlugFor(id: string): string | null {
  return componentOf(id) ? id.replace(/_/g, "-") : null;
}
