import { ROBOT_TYPES } from "@/data/robot-types";
import type { Channel, RobotType, Structure } from "@/lib/models";

/** What the browser reads from a 3D file (lib/robot/read-model.ts). */
export interface ModelReading {
  format: "glb" | "obj" | "stl";
  meshes: number;
  vertices: number;
  /** Bone names in skeleton order ("" when unnamed) */
  bones: string[];
}

/** Per analysis step (4 steps). PURE Desk is staged to 8 s (BuildPlay STEP 10②); imports read faster. */
export const ANALYZE_STEP_MS = { "pure-desk": 2000, import: 1200 } as const;

/** PRD §6 rule 2: imported rigs get ±90° until the user narrows them. */
export const IMPORT_RIG_RANGE = 90;

const WHEEL = /wheel/i;
const LEG = /(leg|hip|knee|ankle|foot|thigh|shin|calf)/i;

/** Rough type guess from bone names and count (shown, never enforced). */
export function estimateType(bones: string[]): RobotType {
  const wheels = bones.filter((b) => WHEEL.test(b)).length;
  const legs = bones.filter((b) => LEG.test(b)).length;
  const joints = bones.length - wheels;
  if (wheels > 0) return joints === 0 ? "jointless-driving" : "joint-driving";
  if (bones.length >= 15) return "full-body";
  if (legs >= 4) return "joint-walking";
  return "joint-fixed";
}

function jointId(name: string, i: number, used: Set<string>): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `joint_${i + 1}`;
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}_${n}`;
  used.add(id);
  return id;
}

/** Bones → structure. Throws NO_RIG (E2) when the model has no skeleton. */
export function structureFromReading(reading: ModelReading, file: Structure["file"]): Structure {
  if (reading.bones.length === 0) throw Object.assign(new Error("No rig found"), { code: "NO_RIG" });
  const type = estimateType(reading.bones);
  const used = new Set<string>();
  const channels: Channel[] = ROBOT_TYPES.find((t) => t.id === type)?.channels ?? ["motion"];
  return {
    type,
    source: "import",
    file,
    channels: [...channels],
    joints: reading.bones.map((name, i) => ({
      id: jointId(name, i, used),
      label: name.trim() || `Joint ${i + 1}`,
      min: -IMPORT_RIG_RANGE,
      max: IMPORT_RIG_RANGE,
      rigMin: -IMPORT_RIG_RANGE,
      rigMax: IMPORT_RIG_RANGE,
    })),
  };
}
