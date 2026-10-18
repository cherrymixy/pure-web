import type { Expression, MotionProps, Reference, Signature, Structure } from "../models";
import type { GenerationOutput } from "../llm/generation";
import { signatureToParams } from "../signature/axes";
import { paramsToProps, propsToParams } from "./props";
import { sampleRecipe } from "./sample";
import { sanitizeName, validateFace, validateRecipe, validateSound, type Issue } from "./validate";

export interface BuildContext {
  structure: Structure;
  signature: Signature;
  components?: string[];
  pattern?: string;
  references?: Reference[];
  /** Motion Properties override; default = the signature's playback as slider positions */
  props?: MotionProps;
}

export type BuiltExpression = Omit<Expression, "id" | "projectId" | "version" | "history" | "createdAt">;

/** Generation output → validated expression ready for repo.expressions.create. */
export function buildExpression(output: GenerationOutput, ctx: BuildContext): { expression: BuiltExpression; issues: Issue[] } {
  const sig = signatureToParams(ctx.signature.axes);
  const props = ctx.props ?? paramsToProps(sig.playback);
  const { params } = propsToParams(props, ctx.signature.axes);
  const recipe = validateRecipe(output.motion, ctx.structure, params);
  const { duration } = sampleRecipe(recipe.recipe, params, 10);
  const face = validateFace(output.face);
  const sound = validateSound(output.sound.cues, { duration, maxCues: sig.sound.maxCues, pitchSt: sig.sound.pitchSt });
  const name = sanitizeName(output.name, output.currentStatus);
  const issues = [...recipe.issues, ...face.issues, ...sound.issues];
  if (name !== output.name) issues.push({ field: "name", message: `"${output.name}" → "${name}"` });
  return {
    expression: {
      name,
      currentStatus: output.currentStatus.trim(),
      components: ctx.components ?? [],
      pattern: ctx.pattern ?? "",
      references: ctx.references ?? [],
      motion: { mode: "recipe", recipe: recipe.recipe, props },
      face: face.face,
      sound: { cues: sound.cues },
      signatureSnapshot: ctx.signature,
    },
    issues,
  };
}

/** "Make it softer": slower, smaller, softer landing, quieter. */
export function applySoftener<T extends Pick<Expression, "motion" | "face" | "sound">>(expr: T): T {
  const p = expr.motion.props;
  return {
    ...expr,
    motion: {
      ...expr.motion,
      props: { ...p, speed: Math.round(p.speed * 0.8), amplitude: Math.round(p.amplitude * 0.75), smoothness: Math.min(100, p.smoothness + 15) },
    },
    sound: { cues: expr.sound.cues.map((c) => ({ ...c, volumeDb: c.volumeDb - 4 })) },
  };
}
