import type { FaceSpec, MotionProps, Recipe, SoundCue } from "@/lib/models";
import { FACE_PRESETS, type FacePresetName } from "./face-presets";
import { cueAt } from "./sound-cues";
import type { SuggestedPromptId } from "./prompts";

/** Shape the generator returns (PRD §6 rule 6) — used as the fallback when Ollama is off or fails. */
export interface DemoExpression {
  name: string;
  currentStatus: string;
  reasoning: string;
  motion: { recipe: Recipe; props: MotionProps };
  face: FaceSpec;
  sound: { cues: SoundCue[] };
}

const face = (preset: FacePresetName): FaceSpec => ({ preset, tokens: { ...FACE_PRESETS[preset] } });
const props = (amplitude: number, duration: number, smoothness: number, speed: number, frequency: number): MotionProps => ({
  amplitude, duration, smoothness, speed, frequency,
});

// One per suggested prompt (data/prompts.ts).
export const PROMPT_DEMOS: Record<SuggestedPromptId, DemoExpression> = {
  here: {
    name: "Hello wave",
    currentStatus: "Someone just arrived and the robot wants to say hi.",
    reasoning: "A wake-up lift into a bow reads as noticing the person, then welcoming them.",
    motion: {
      recipe: { steps: [
        { behavior: "wake", speed: 1.1, amplitude: 0.9, repeat: 1, face: "wide" },
        { behavior: "greet", speed: 1, amplitude: 1, repeat: 1, face: "happy" },
      ] },
      props: props(64, 48, 58, 62, 50),
    },
    face: face("happy"),
    sound: { cues: [cueAt("rising-chirp", 0.6), cueAt("signature", 2.4)] },
  },
  presentation: {
    name: "Proud bounce",
    currentStatus: "The presentation went well and the robot shares the excitement.",
    reasoning: "Happy bounces with a nod affirm the success; bright cues add celebration.",
    motion: {
      recipe: { steps: [
        { behavior: "happy", speed: 1.1, amplitude: 1, repeat: 1, face: "happy" },
        { behavior: "nod", speed: 1.2, amplitude: 0.8, repeat: 2, face: "happy" },
      ] },
      props: props(72, 55, 52, 70, 64),
    },
    face: face("happy"),
    sound: { cues: [cueAt("rising-chirp", 0.3), cueAt("rising-chirp", 1.4), cueAt("signature", 3)] },
  },
  tired: {
    name: "Sleepy nod",
    currentStatus: "I'm nodding off because I'm tired.",
    reasoning: "Slow dozing with drooping nods shows fatigue; soft breaths keep it gentle.",
    motion: {
      recipe: { steps: [
        { behavior: "doze", speed: 0.8, amplitude: 0.9, repeat: 1, face: "sleepy" },
        { behavior: "nod", speed: 0.6, amplitude: 0.7, repeat: 2, face: "sleepy" },
      ] },
      props: props(71, 53, 64, 85, 60),
    },
    face: face("sleepy"),
    sound: { cues: [cueAt("soft-breath", 0.4), cueAt("soft-breath", 3.2)] },
  },
  startled: {
    name: "Startled hop",
    currentStatus: "Something surprising just happened.",
    reasoning: "A sharp alert snap upward, then a look around to find the cause.",
    motion: {
      recipe: { steps: [
        { behavior: "alert", speed: 1.2, amplitude: 1, repeat: 1, face: "wide" },
        { behavior: "look_around", speed: 1, amplitude: 0.8, repeat: 1, face: "wide" },
      ] },
      props: props(80, 40, 35, 78, 55),
    },
    face: face("wide"),
    sound: { cues: [cueAt("rising-chirp", 0.1), cueAt("falling-tone", 1.6)] },
  },
};

const single = (behavior: string, preset: FacePresetName, cue: string, name: string, status: string): DemoExpression => ({
  name,
  currentStatus: status,
  reasoning: `Demo fallback built from the ${behavior} component.`,
  motion: { recipe: { steps: [{ behavior, speed: 1, amplitude: 1, repeat: 1, face: preset }] }, props: props(50, 50, 50, 50, 50) },
  face: face(preset),
  sound: { cues: [cueAt(cue, 0.3)] },
});

// One per component chip (data/components.ts ids).
export const COMPONENT_DEMOS: Record<string, DemoExpression> = {
  idle: single("idle", "neutral", "soft-breath", "Quiet idle", "Waiting calmly."),
  doze: single("doze", "sleepy", "soft-breath", "Dozing", "Drifting off."),
  sleep: single("sleep", "sleepy", "soft-breath", "Sleeping", "Asleep."),
  wake: single("wake", "wide", "rising-chirp", "Waking up", "Just woke up."),
  nod: single("nod", "soft", "low-warm", "Nod", "Agreeing."),
  shake: single("shake", "neutral", "falling-tone", "Head shake", "Disagreeing."),
  look_around: single("look_around", "wide", "rising-chirp", "Look around", "Looking for something."),
  curious: single("curious", "wide", "rising-chirp", "Curious tilt", "Something caught its interest."),
  happy: single("happy", "happy", "rising-chirp", "Happy bounce", "Feeling happy."),
  sad: single("sad", "soft", "falling-tone", "Sad droop", "Feeling down."),
  alert: single("alert", "wide", "rising-chirp", "Alert", "Something needs attention."),
  greet: single("greet", "happy", "signature", "Greeting", "Saying hello."),
  sweep: single("sweep", "neutral", "low-warm", "Sweep", "Scanning the desk."),
  focus: single("focus", "neutral", "low-warm", "Focus", "Concentrating on the task."),
  home: single("home", "neutral", "low-warm", "Rest", "Back to rest."),
};

/** "Make it softer" variant: slower, smaller, softer landing, quieter. */
export function applySofterDemo(demo: DemoExpression): DemoExpression {
  return {
    ...demo,
    name: `${demo.name} (softer)`,
    motion: {
      recipe: { ...demo.motion.recipe, steps: demo.motion.recipe.steps.map((s) => ({ ...s, speed: s.speed * 0.8, amplitude: s.amplitude * 0.75 })) },
      props: { ...demo.motion.props, amplitude: Math.round(demo.motion.props.amplitude * 0.75), smoothness: Math.min(100, demo.motion.props.smoothness + 15), speed: Math.round(demo.motion.props.speed * 0.8) },
    },
    face: { ...demo.face, tokens: { ...demo.face.tokens, brightness: Math.max(0.1, demo.face.tokens.brightness * 0.85) } },
    sound: { cues: demo.sound.cues.map((c) => ({ ...c, volumeDb: c.volumeDb - 4 })) },
  };
}
