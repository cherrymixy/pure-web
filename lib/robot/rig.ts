import { PURE_DESK_JOINTS } from "@/data/pure-desk";
import type { Db, Structure } from "@/lib/models";

const RIG = new Map<string, { rigMin: number; rigMax: number }>(PURE_DESK_JOINTS.map((j) => [j.id, j]));

/**
 * Fit a PURE Desk structure saved for an earlier body to the current rig: rig ranges are
 * replaced and Edit-limits ranges clamped inside them (a range that no longer fits falls
 * back to the full rig range). Returns true when anything changed.
 */
export function fitToRig(structure: Structure): boolean {
  if (structure.source !== "pure-desk") return false;
  let changed = false;
  for (const joint of structure.joints) {
    const rig = RIG.get(joint.id);
    if (!rig || (joint.rigMin === rig.rigMin && joint.rigMax === rig.rigMax)) continue;
    const min = Math.max(joint.min, rig.rigMin);
    const max = Math.min(joint.max, rig.rigMax);
    Object.assign(joint, rig, min < max ? { min, max } : { min: rig.rigMin, max: rig.rigMax });
    changed = true;
  }
  return changed;
}

/** Applied once when the DB file loads; the fitted ranges are saved with the next write. */
export function fitDbToRig(db: Db): void {
  for (const project of db.projects) if (project.structure) fitToRig(project.structure);
}
