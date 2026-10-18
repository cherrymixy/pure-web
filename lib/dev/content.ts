import { COMPONENTS } from "@/data/components";
import { SIM_BEHAVIORS } from "@/data/sim-behaviors";
import { COMPONENT_DEMOS, PROMPT_DEMOS } from "@/data/demo-recipes";
import { FACE_VIDEOS } from "@/data/face-videos";
import { countEntries } from "@/data/guideline";
import { SITUATION_PATTERNS } from "@/data/patterns";
import { SUGGESTED_PROMPTS } from "@/data/prompts";
import { PURE_DESK_STRUCTURE } from "@/data/pure-desk";
import { ROBOT_TYPES } from "@/data/robot-types";
import { SEED_EXPRESSIONS, SEED_LIBRARY, SEED_PROFILE, SEED_PROJECTS, SEED_ROBOTS, SEED_USER_DATA } from "@/data/seed";
import { AXIS_ORDER, TONE_DICTIONARY } from "@/data/signature";
import { SOUND_CUES } from "@/data/sound-cues";
import { STRINGS } from "@/data/strings";

export interface ContentRow {
  file: string;
  item: string;
  count: number;
  placeholders?: number;
}

function leafCount(value: unknown): number {
  if (typeof value === "string") return 1;
  if (Array.isArray(value)) return value.reduce((n, v) => n + leafCount(v), 0);
  if (value && typeof value === "object") return Object.values(value).reduce((n, v) => n + leafCount(v), 0);
  return 0;
}

export function contentSummary(): ContentRow[] {
  return [
    { file: "data/robot-types.ts", item: "Robot types", count: ROBOT_TYPES.length },
    { file: "data/pure-desk.ts", item: "PURE Desk joints", count: PURE_DESK_STRUCTURE.joints.length },
    { file: "data/components.ts", item: "Components (guideline behaviors)", count: COMPONENTS.length },
    { file: "data/sim-behaviors.ts", item: "Simulator behaviors", count: SIM_BEHAVIORS.length },
    { file: "data/patterns.ts", item: "Situation patterns", count: SITUATION_PATTERNS.length },
    { file: "data/prompts.ts", item: "Suggested prompts", count: SUGGESTED_PROMPTS.length },
    { file: "data/face-videos.ts", item: "Face videos", count: Object.keys(FACE_VIDEOS).length },
    { file: "data/sound-cues.ts", item: "Sound cues", count: SOUND_CUES.length },
    { file: "data/signature.ts", item: "Signature axes", count: AXIS_ORDER.length },
    { file: "data/signature.ts", item: "Tone keywords", count: Object.keys(TONE_DICTIONARY).length },
    { file: "data/demo-recipes.ts", item: "Demo recipes (prompt + component)", count: Object.keys(PROMPT_DEMOS).length + Object.keys(COMPONENT_DEMOS).length },
    { file: "data/seed.ts", item: "Projects", count: SEED_PROJECTS.length },
    { file: "data/seed.ts", item: "Team members", count: SEED_PROFILE.team.length },
    { file: "data/seed.ts", item: "Expressions", count: SEED_EXPRESSIONS.length },
    { file: "data/seed.ts", item: "Library", count: SEED_LIBRARY.length },
    { file: "data/seed.ts", item: "User data motions", count: SEED_USER_DATA.length },
    { file: "data/seed.ts", item: "Robots", count: SEED_ROBOTS.length },
    { file: "data/strings.ts", item: "UI strings", count: leafCount(STRINGS) },
    ...countEntries().map((s) => ({
      file: `data/guideline/${s.section}.ts`,
      item: `Guideline · ${s.section}`,
      count: s.entries,
      placeholders: s.placeholders,
    })),
  ];
}
