/**
 * Robot registry — every simulated robot shares the same five command channels
 * (`JointName`), but each robot gives them its own meaning, labels, model files and
 * camera.
 *
 * The behaviour library (`behaviors.ts`) was authored in LeLamp channel space (the
 * engine keeps those internal channel names). A robot whose joints mean something different declares a
 * `retarget`: a linear map from LeLamp channels to its own channels. Because the map is
 * linear, retargeting each keyframe's *full* pose and each oscillation's amplitude gives
 * exactly the same trajectory as retargeting every sampled frame — easing and
 * interpolation commute with it.
 *
 * Pure module: no React, no three, no I/O. (The face manifest is fetched by the runtime.)
 */

import { JOINT_NAMES, type JointName, type Motion, type Oscillation, type Pose } from './motion';
import { HOME } from './behaviors';

export type RobotId = 'pure-desk' | 'pure-rover';

export interface CameraView {
  azimuth: number;
  elevation: number;
  distance: number;
  lookAt: [number, number, number];
}

/**
 * A flat face display on the head body (drawn by the web viewer, not by MuJoCo).
 * All lengths in metres, in the head body's frame; the display faces −Y.
 */
export interface FaceDisplay {
  /** Centre of the visible opening */
  center: [number, number, number];
  /** Half width / half height of the visible opening (the video is fitted to this) */
  halfWidth: number;
  halfHeight: number;
  /** Corner radius of the opening */
  radius: number;
  /** Extra size hidden behind the bezel, so no gap shows at the edges */
  bleed: number;
  /** Forward lean of the panel about the head's X axis, degrees (0 = upright) */
  pitchDeg?: number;
}

/**
 * Which expression video plays when. Loaded at runtime from `RobotSpec.facesManifest`
 * (JSON next to the videos), so videos can be swapped without touching code:
 *   { "default": "idle.mp4", "behaviors": { "nod": "nod.mp4", "sleep": "sleep.mp4" } }
 * Paths are relative to the manifest. `default` plays while no behaviour runs.
 */
export interface FaceManifest {
  default?: string;
  behaviors?: Record<string, string>;
}

/** out[channel] = Σ gain · lelamp[source] */
export type RetargetMatrix = Record<JointName, Partial<Record<JointName, number>>>;

export interface RobotSpec {
  id: RobotId;
  /**
   * Uniform size multiplier applied when the model loads (components/sim/robot-scale.ts): meshes and offsets ×s,
   * masses ×s³, inertia and servo gains ×s⁵ so joint motions keep their feel. Camera views / display stay written
   * at the model's own size; the viewer scales them. 1 = as modelled.
   */
  scale?: number;
  /** Short name for the robot picker */
  label: string;
  /** Folder under /public holding manifest.json, the scene XML and assets/ */
  modelBase: string;
  /** Body the head-mounted light / glow follows */
  headBody: string;
  /** Body that stays fixed on the table (used by the kinematic preview) */
  baseBody: string;
  /** Channel name shown in the UI, per command channel */
  jointKeys: Record<JointName, string>;
  jointLabels: Record<JointName, string>;
  jointHints: Record<JointName, string>;
  heroView: CameraView;
  /** Spot light inside the head (LeLamp's shade). null = the robot has no beam. */
  beam: { pos: [number, number, number]; dir: [number, number, number] } | null;
  /** Face display on the head. null = no display (LeLamp). */
  display: FaceDisplay | null;
  /** URL of the FaceManifest JSON. null = no expression videos. */
  facesManifest: string | null;
  /** LeLamp channel space → this robot. null = identity. */
  retarget: RetargetMatrix | null;
  /** Smooth mesh normals below this angle (degrees) in the web viewer — for scanned meshes. Unset = flat per-face shading. */
  creaseAngleDeg?: number;
  /** Extra gain on the negative side of a retargeted channel (e.g. leaning back), applied after `retarget`. */
  backGain?: Partial<Record<JointName, number>>;
}

// ------------------------------------------------------------- PURE desk robot

/**
 * PURE desk robot (5-DOF, v2 body: round head on a dome turret).
 *   1 base yaw · 2 shoulder · 3 elbow · 4 head pan · 5 head tilt
 * Channel 4 is our own head-pan axis — it is *not* LeLamp's wrist roll, so the
 * `wrist_roll` channel carries head pan on this robot.
 *
 * Retarget (same gains as the PURE Desk emotion-motion preview the v2 body comes from):
 * - Gaze (LeLamp base_yaw) is split 65 / 35 between base yaw and head pan, so the head
 *   leads the body — overlapping action — while the total heading stays the same.
 * - Shoulder keeps LeLamp's sign and size (−26…34° fits −28…41°); the elbow is scaled 0.55
 *   so LeLamp's −62…18° lands inside −135…10°.
 * - Head tilt only spans −2…21°, so it takes a fifth of LeLamp's head nod plus a fifth of the
 *   (scaled) arm swing — on this robot shoulder, elbow and tilt share one axis direction, and
 *   that share keeps the screen's pitch moving with the arm instead of against it.
 *   LeLamp's wrist roll has no counterpart and is dropped.
 */
const PURE_DESK_RETARGET: RetargetMatrix = {
  base_yaw: { base_yaw: 0.65 },
  base_pitch: { base_pitch: 1 },
  elbow_pitch: { elbow_pitch: 0.55 },
  wrist_roll: { base_yaw: 0.35 },
  wrist_pitch: { wrist_pitch: 0.2, base_pitch: 0.2, elbow_pitch: 0.11 },
};

const PURE_DESK: RobotSpec = {
  id: 'pure-desk',
  label: 'PURE Desk',
  modelBase: '/pure-desk/model',
  // Shown 1.5× its modelled ≈36 cm (≈54 cm) — closer to furniture scale next to the 3D assets.
  scale: 1.5,
  headBody: 'head',
  baseBody: 'base',
  jointKeys: {
    base_yaw: 'base_yaw',
    base_pitch: 'shoulder_pitch',
    elbow_pitch: 'elbow_pitch',
    wrist_roll: 'head_pan',
    wrist_pitch: 'head_tilt',
  },
  jointLabels: {
    base_yaw: 'Base yaw',
    base_pitch: 'Shoulder',
    elbow_pitch: 'Elbow',
    wrist_roll: 'Head pan',
    wrist_pitch: 'Head tilt',
  },
  jointHints: {
    base_yaw: 'Turns everything above the base split line',
    base_pitch: 'Swings the lower arm in the dome slot (+ leans forward)',
    elbow_pitch: 'Bends the upper arm (+ folds forward-down)',
    wrist_roll: 'Turns the head left / right on the neck',
    wrist_pitch: 'Tilts the screen (− looks down)',
  },
  // ≈36 cm tall — closer camera, aimed at the arm.
  // The screen faces −Y, so the camera sits in front (azimuth ≈ 60° looks toward +Y).
  heroView: { azimuth: 62, elevation: -8, distance: 0.95, lookAt: [0, -0.02, 0.2] },
  beam: null,
  /*
   * The largest 5 : 3 rounded rectangle inside the black face plate (head_bezel), centred;
   * the plate leans 5.5° forward, so the panel does too.
   */
  display: {
    center: [-0.00096, -0.03988, 0.01912],
    halfWidth: 0.05753,
    halfHeight: 0.03452,
    radius: 0.00624,
    bleed: 0,
    pitchDeg: 5.49,
  },
  facesManifest: '/pure-desk/faces/faces.json',
  retarget: PURE_DESK_RETARGET,
  // Leaning back reads as falling over on this robot: the shoulder's backward swing is halved.
  backGain: { base_pitch: 0.5 },
};

// ------------------------------------------------------------- PURE Rover

/**
 * PURE Rover (Pure bot v2: round shell with a front screen on two wheels, 30 cm, Jointless Driving).
 *   1 body yaw · 2 drive (slide, metres) · 3 rock about the axle · 4 side roll · 5 nod about the shell centre
 * The wheels follow the drive through equality constraints in robot.xml.
 *
 * Retarget from LeLamp channel space (library ranges: yaw ±65°, shoulder −26…34°, elbow −62…18°,
 * wrist roll −95…52°, wrist pitch −45…78°):
 * - Gaze turns the whole body (1:1).
 * - Shoulder lean drives the rover along its heading: 0.34 → −26…34° becomes −8.8…11.6° of command
 *   = about −15…20 cm (a slide reads its command in radians as metres). Leaning in rolls toward the
 *   person, leaning back rolls away, and turns while driving trace a path on the floor.
 * - The arm bend rocks the shell on its axle (elbow 0.25 + shoulder 0.25 → about −22…13°).
 * - Wrist roll becomes a small side lean (0.1); wrist pitch a small nod (0.2), like the desk head tilt.
 */
const PURE_ROVER_RETARGET: RetargetMatrix = {
  base_yaw: { base_yaw: 1 },
  base_pitch: { base_pitch: 0.34 },
  elbow_pitch: { elbow_pitch: 0.25, base_pitch: 0.25 },
  wrist_roll: { wrist_roll: 0.1 },
  wrist_pitch: { wrist_pitch: 0.2 },
};

const PURE_ROVER: RobotSpec = {
  id: 'pure-rover',
  label: 'PURE Rover',
  modelBase: '/pure-rover/model',
  headBody: 'shell',
  baseBody: 'base',
  jointKeys: {
    base_yaw: 'body_yaw',
    base_pitch: 'drive',
    elbow_pitch: 'rock',
    wrist_roll: 'roll',
    wrist_pitch: 'nod',
  },
  jointLabels: {
    base_yaw: 'Turn',
    base_pitch: 'Drive',
    elbow_pitch: 'Rock',
    wrist_roll: 'Roll',
    wrist_pitch: 'Nod',
  },
  jointHints: {
    base_yaw: 'Turns in place on the wheels',
    base_pitch: 'Drives forward / back along its heading (+ toward the person)',
    elbow_pitch: 'Rocks the shell on the axle (+ leans forward)',
    wrist_roll: 'Leans to one side',
    wrist_pitch: 'Nods the shell (− looks down)',
  },
  // 30 cm tall, screen toward −Y: camera in front, a little above the screen.
  heroView: { azimuth: 62, elevation: -10, distance: 0.75, lookAt: [0, -0.02, 0.14] },
  beam: null,
  /*
   * Flat 5 : 3 panel just in front of the black visor, centred on it (visor front at z 0.205 sits at y −0.124);
   * the visor leans back about 23°, so the panel does too.
   */
  display: {
    center: [0, -0.1265, 0.205],
    halfWidth: 0.075,
    halfHeight: 0.045,
    radius: 0.018,
    bleed: 0,
    pitchDeg: -23,
  },
  facesManifest: '/pure-desk/faces/faces.json',
  retarget: PURE_ROVER_RETARGET,
  creaseAngleDeg: 50,
};

export const ROBOTS: Record<RobotId, RobotSpec> = {
  'pure-desk': PURE_DESK,
  'pure-rover': PURE_ROVER,
};

export const PURE_DESK_ROBOT = PURE_DESK;
export const PURE_ROVER_ROBOT = PURE_ROVER;

/** The simulated robot for a project structure source ("pure-rover" → PURE Rover, anything else → PURE Desk). */
export const robotForSource = (source: string | undefined): RobotSpec => (source === 'pure-rover' ? PURE_ROVER : PURE_DESK);

export const ROBOT_IDS = Object.keys(ROBOTS) as RobotId[];

export const isRobotId = (value: unknown): value is RobotId =>
  typeof value === 'string' && value in ROBOTS;

// ------------------------------------------------------------------ retarget

/** Apply a channel map to a full pose. `null` = identity. */
export function mapPose(matrix: RetargetMatrix | null, pose: Pose): Pose {
  if (!matrix) return { ...pose };
  const out = {} as Pose;
  for (const joint of JOINT_NAMES) {
    let value = 0;
    for (const [source, gain] of Object.entries(matrix[joint])) {
      value += (gain ?? 0) * pose[source as JointName];
    }
    out[joint] = value;
  }
  return out;
}

export const retargetPose = (robot: RobotSpec, pose: Pose): Pose => mapPose(robot.retarget, pose);

/**
 * LeLamp-authored motion → this robot's channels.
 *
 * Keyframes hold "previous value" for joints they omit, and the map mixes channels, so
 * each keyframe is first resolved to an absolute LeLamp pose (starting from HOME, the
 * same start `motionToClip` uses) and then mapped. The result has full poses only.
 */
export function retargetMotion(robot: RobotSpec, motion: Motion): Motion {
  const matrix = robot.retarget;
  if (!matrix) return motion;

  let current: Pose = { ...HOME };
  // Looping motions start from their own last pose — resolve that first so the first
  // keyframe's omitted joints match what the loop actually holds.
  if (motion.loop) {
    for (const kf of motion.keyframes) current = { ...current, ...kf.pose } as Pose;
  }
  const back = robot.backGain ?? {};
  const keyframes = motion.keyframes.map((kf) => {
    current = { ...current, ...kf.pose } as Pose;
    const pose = mapPose(matrix, current);
    for (const [joint, gain] of Object.entries(back) as [JointName, number][]) if (pose[joint] < 0) pose[joint] *= gain;
    return { ...kf, pose };
  });

  const overlays: Oscillation[] = [];
  for (const osc of motion.overlays ?? []) {
    for (const joint of JOINT_NAMES) {
      const gain = matrix[joint][osc.joint];
      if (gain) overlays.push({ ...osc, joint, amplitude: osc.amplitude * gain });
    }
  }
  return { ...motion, keyframes, overlays };
}
