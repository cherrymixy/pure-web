// The 15 playable simulator behaviors (lib/sim/behaviors.ts). Recipe steps ("behavior") use these ids.
// Editor component chips (data/components.ts) are the guideline's 16 behaviors; each plays as one of these.
export const SIM_BEHAVIORS = [
  { id: "idle", label: "Idle", description: "Breathes quietly and shifts its gaze once in a while." },
  { id: "doze", label: "Doze", description: "Head slowly droops, then jolts awake, over and over." },
  { id: "sleep", label: "Sleep", description: "Folds its arm, tucks its head in and breathes slowly." },
  { id: "wake", label: "Wake", description: "Wakes up, stretches and settles into posture." },
  { id: "nod", label: "Nod", description: "Yes · agreement." },
  { id: "shake", label: "Shake", description: "No · refusal." },
  { id: "look_around", label: "Look around", description: "Scans the surroundings." },
  { id: "curious", label: "Curious", description: "Tilts its head out of curiosity." },
  { id: "happy", label: "Happy", description: "Bounces with joy." },
  { id: "sad", label: "Sad", description: "Shoulders drop and the head hangs." },
  { id: "alert", label: "Alert", description: "Spots something and snaps its head up." },
  { id: "greet", label: "Greet", description: "Bows its head in greeting." },
  { id: "sweep", label: "Sweep", description: "Turns its base wide to scan the whole room." },
  { id: "focus", label: "Focus", description: "Faces the desk straight on and holds still." },
  { id: "home", label: "Home", description: "Returns to the rest pose." },
] as const;

export type SimBehaviorId = (typeof SIM_BEHAVIORS)[number]["id"];

export const simBehaviorLabel = (id: string): string => SIM_BEHAVIORS.find((b) => b.id === id)?.label ?? id;
