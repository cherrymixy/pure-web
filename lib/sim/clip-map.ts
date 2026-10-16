/**
 * Model clip (PRD §7: tracks keyed by robot joint id) ↔ engine clip (`Track[]` keyed by
 * the engine's internal channels). The simulator contract only speaks model clips.
 *
 * Pure module.
 */

import type { Clip } from '../models';
import { CLIP_FORMAT, type Clip as EngineClip } from './clip';
import { JOINT_NAMES, type JointName } from './motion';
import type { RobotSpec } from './robots';

export function toEngineClip(clip: Clip, robot: RobotSpec, name = 'clip'): EngineClip {
  return {
    name,
    label: name,
    description: '',
    duration: clip.duration,
    loop: !!clip.loop,
    tracks: JOINT_NAMES.map((joint) => ({
      joint,
      keys: (clip.tracks[robot.jointKeys[joint]] ?? []).map((k) => ({ ...k })),
    })).filter((track) => track.keys.length > 0),
  };
}

export function fromEngineClip(clip: EngineClip, robot: RobotSpec): Clip {
  const tracks: Clip['tracks'] = {};
  for (const track of clip.tracks) {
    tracks[robot.jointKeys[track.joint as JointName]] = track.keys.map((k) => ({ ...k }));
  }
  return { format: CLIP_FORMAT, duration: clip.duration, tracks, loop: clip.loop };
}

/** Robot joint id → engine channel. */
export function engineJoint(robot: RobotSpec, id: string): JointName | null {
  return JOINT_NAMES.find((j) => robot.jointKeys[j] === id) ?? null;
}
