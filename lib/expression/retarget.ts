import type { Channel, SavedExpression, Structure } from "../models";
import type { BuiltExpression } from "./build";

/**
 * Library → "Apply to this robot" (PRD §6 rule 15). Same joints: copied as is.
 * Different structure: channel mapping only — keyframe clips whose joints the robot
 * lacks fall back to the recipe, and channels the robot doesn't have are emptied.
 */
export function applyToRobot(saved: SavedExpression, structure: Structure): { expression: BuiltExpression; dropped: Channel[]; clipDropped: boolean } {
  const ids = new Set(structure.joints.map((j) => j.id));
  const clip = saved.motion.clip;
  const clipFits = !!clip && Object.keys(clip.tracks).every((id) => ids.has(id));
  const clipDropped = saved.motion.mode === "clip" && !clipFits;
  const dropped: Channel[] = [];
  let face = structuredClone(saved.face);
  let sound = structuredClone(saved.sound);
  if (!structure.channels.includes("face") && face.preset) {
    face = { ...face, preset: "", keys: undefined };
    dropped.push("face");
  }
  if (!structure.channels.includes("sound") && sound.cues.length) {
    sound = { cues: [] };
    dropped.push("sound");
  }
  const { id: _id, projectId: _p, version: _v, history: _h, createdAt: _c, savedAt: _s, channels: _ch, ...rest } = structuredClone(saved);
  return {
    expression: {
      ...rest,
      motion: clipFits ? rest.motion : { mode: "recipe", recipe: rest.motion.recipe, props: rest.motion.props },
      face,
      sound,
    },
    dropped,
    clipDropped,
  };
}
