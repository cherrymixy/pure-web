import type { GenerationOutput } from "../llm/generation";
import type { Expression, MotionProps } from "../models";

// Editor "@motion" edits: the chosen version is the base, the request changes only what it names.
// baseOutput turns a saved version back into generator output; refineByWords is the no-AI fallback (rule 11: the demo path never dies).

/** A saved version as generator output (the base the AI, or the fallback, edits). */
export function baseOutput(e: Pick<Expression, "name" | "currentStatus" | "motion" | "face" | "sound">): GenerationOutput {
  return {
    name: e.name,
    currentStatus: e.currentStatus,
    reasoning: "",
    motion: { steps: e.motion.recipe.steps.map(({ behavior, speed, amplitude, repeat, face }) => ({ behavior, speed, amplitude, repeat, ...(face ? { face } : {}) })) as GenerationOutput["motion"]["steps"] },
    face: { preset: e.face.preset } as GenerationOutput["face"],
    sound: { cues: e.sound.cues.map((c) => ({ preset: c.sound, t: c.t })) as GenerationOutput["sound"]["cues"] },
  };
}

/** "Change this motion": the base in one line for the prompt. */
export function baseText(b: GenerationOutput): string {
  const steps = b.motion.steps.map((s) => `${s.behavior} (speed ${s.speed}, amplitude ${s.amplitude}, repeat ${s.repeat}${s.face ? `, face ${s.face}` : ""})`).join(" → ");
  const sound = b.sound.cues.map((c) => `${c.preset} at ${c.t}s`).join(", ") || "none";
  return `"${b.name}": ${steps}; face ${b.face.preset || "none"}; sound ${sound}`;
}

const WORDS: { re: RegExp; edit: (s: GenerationOutput["motion"]["steps"][number]) => void; note: string }[] = [
  { re: /bigger|larger|wider|deeper|크게|깊게|크고|과장/i, edit: (s) => void (s.amplitude *= 1.3), note: "bigger" },
  { re: /smaller|subtle|less|gentler|작게|살짝|약하게|덜/i, edit: (s) => void (s.amplitude *= 0.7), note: "smaller" },
  { re: /faster|quicker|quick|빠르게|빨리/i, edit: (s) => void (s.speed *= 1.3), note: "faster" },
  { re: /slower|slowly|slow|느리게|천천히/i, edit: (s) => void (s.speed *= 0.75), note: "slower" },
  { re: /again|more times|twice|한 번 더|여러 번|반복/i, edit: (s) => void (s.repeat += 1), note: "one more time" },
  { re: /\bonce\b|한 번만/i, edit: (s) => void (s.repeat = 1), note: "once" },
];

/** The right-panel dials move with the words too, so a step already at its amplitude cap still grows on screen. */
export function refineProps(props: MotionProps, request: string): MotionProps {
  const has = (note: string) => WORDS.some((w) => w.note === note && w.re.test(request));
  const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));
  const bigger = has("bigger") && !has("smaller");
  return {
    ...props,
    amplitude: clamp(props.amplitude + (bigger ? 15 : has("smaller") ? -15 : 0)),
    speed: clamp(props.speed + (has("faster") ? 15 : has("slower") ? -15 : 0)),
  };
}

/** No AI: apply the size / speed / count words in the request to every step of the base. Guardrails clamp afterwards. */
export function refineByWords(base: GenerationOutput, request: string): GenerationOutput {
  // "smaller" words win over "more" inside "less"-type phrases, so test the specific ones first.
  const hits = WORDS.filter((w) => w.re.test(request));
  const bigger = hits.some((h) => h.note === "bigger");
  const smaller = hits.some((h) => h.note === "smaller");
  const applied = bigger && smaller ? hits.filter((h) => h.note !== "bigger") : hits;
  const steps = base.motion.steps.map((s) => {
    const next = { ...s };
    for (const h of applied) h.edit(next);
    next.speed = Math.round(next.speed * 100) / 100;
    next.amplitude = Math.round(next.amplitude * 100) / 100;
    return next;
  });
  return {
    ...base,
    reasoning: applied.length ? `Same motion, ${applied.map((h) => h.note).join(", ")}.` : "Kept the motion as it was; no size, speed or count change was asked.",
    motion: { steps },
  };
}
