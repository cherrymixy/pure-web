import { z } from "zod";
import {
  ClipSchema, FaceSpecSchema, MotionPropsSchema, RecipeSchema, RobotTypeSchema, SoundSpecSchema, StructureSchema,
  AxisSchema, type Expression, type Project, type Signature,
} from "../models";

// pure.json: the exported expression package (PRD rule 13).
export const PURE_JSON_FORMAT = "pure.json/1";

export const PureJsonSchema = z.object({
  format: z.literal(PURE_JSON_FORMAT),
  meta: z.object({ name: z.string(), project: z.string(), team: z.string(), createdAt: z.string(), app: z.string() }),
  robot: z.object({ type: RobotTypeSchema, structure: StructureSchema }),
  signature: z.object({ name: z.string(), version: z.number().int(), axes: z.record(AxisSchema, z.number()), tone: z.array(z.string()) }),
  expression: z.object({
    name: z.string(),
    currentStatus: z.string(),
    motion: z.object({ mode: z.enum(["recipe", "clip"]), recipe: RecipeSchema, props: MotionPropsSchema, clip: ClipSchema }),
    face: FaceSpecSchema,
    sound: SoundSpecSchema,
  }),
  options: z.object({ includeFallback: z.boolean(), loop: z.boolean() }),
  fallback: z.object({ motion: ClipSchema }).optional(),
});
export type PureJson = z.infer<typeof PureJsonSchema>;

export interface PureJsonOptions {
  includeFallback?: boolean;
  loop?: boolean;
  team?: string;
  now?: Date;
}

/** `clip` is the expression's playback clip (recipeToClip or the edited timeline clip). */
export function buildPureJson(
  project: Pick<Project, "name" | "type" | "structure">,
  signature: Signature,
  expression: Pick<Expression, "name" | "currentStatus" | "motion" | "face" | "sound">,
  clip: z.infer<typeof ClipSchema>,
  options: PureJsonOptions = {},
): { json: PureJson; text: string; bytes: number } {
  if (!project.structure) throw new Error("Project has no confirmed structure");
  const json: PureJson = {
    format: PURE_JSON_FORMAT,
    meta: {
      name: expression.name,
      project: project.name,
      team: options.team ?? "",
      createdAt: (options.now ?? new Date()).toISOString(),
      app: "PURE Expert Lab",
    },
    robot: { type: project.type, structure: project.structure },
    signature: { name: signature.name, version: signature.version, axes: signature.axes, tone: signature.tone },
    expression: {
      name: expression.name,
      currentStatus: expression.currentStatus,
      motion: { mode: expression.motion.mode, recipe: expression.motion.recipe, props: expression.motion.props, clip },
      face: expression.face,
      sound: expression.sound,
    },
    options: { includeFallback: !!options.includeFallback, loop: !!options.loop },
    ...(options.includeFallback ? { fallback: { motion: clip } } : {}),
  };
  const text = JSON.stringify(json, null, 2);
  return { json, text, bytes: new TextEncoder().encode(text).length };
}

export function parsePureJson(text: string): PureJson {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("Not a JSON file");
  }
  return PureJsonSchema.parse(raw);
}
