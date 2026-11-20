// Lab home shows these six projects only, in this order (Figma 1095:6556 card grid, left→right, top→bottom).
// Placement numbers are Figma px straight from get_design_context; images live in public/figma/lab/home.

/** [left, top, width, height] in px inside the parent frame. */
export type Box = [number, number, number, number];

/** One image layer: `box` is the frame, `crop` places the image inside it as [left%, top%, width%, height%]
 *  ("cover"/"contain" = object-fit). `flip` mirrors horizontally. */
export interface ArtLayer {
  src: string;
  box: Box;
  crop: [number, number, number, number] | "cover" | "contain";
  flip?: boolean;
}

/** Blurred floor shadow: the SVG is larger than `box` by `bleed` = [y%, x%] on each side. */
export interface ArtShadow {
  src: string;
  box: Box;
  bleed: [number, number];
}

/** White patch behind the robot (fills transparent holes in the cut-out). */
export interface ArtPatch {
  box: Box;
  w: number;
  h: number;
  rotate: number;
}

export interface RobotArt {
  /** Paint order matches Figma: shadow, patch, robot (avatar art paints the robot first when `shadowOnTop`). */
  robot: ArtLayer;
  shadow?: ArtShadow;
  patch?: ArtPatch;
  shadowOnTop?: boolean;
}

export interface ShowcaseCard {
  projectId: string;
  /** Tag on the picture, as written in Figma. */
  tag: string;
  favourite: boolean;
  /** Picture art, laid out in Figma's 330.665 × 134.863 frame (centred in the 16:9 card picture). */
  thumb: RobotArt;
  /** 29.97 card-header avatar. */
  avatar: RobotArt;
  /** 30 sidebar Favourites avatar (favourites only). */
  fav?: RobotArt;
}

const H = "/figma/lab/home";
const THUMB_SHADOW: ArtShadow = { src: `${H}/thumb-shadow.svg`, box: [143.52, 116.88, 43.625, 7.492], bleed: [80, 13.74] };
const AVATAR_SHADOW: ArtShadow = { src: `${H}/avatar-shadow.svg`, box: [9.77, 23.38, 10.422, 7.492], bleed: [80, 57.51] };
const FULL: Box = [0, 0, 29.97, 29.97];
// Pure bot v1 cut-out is a sprite: same crop wherever it appears.
const V1_CROP: [number, number, number, number] = [-382.23, -58.09, 866.33, 218.87];
const DRIVING_PATCH: ArtPatch = { box: [141.64, 71.31, 35.087, 28.922], w: 30.476, h: 21.728, rotate: 15.11 };
const FAV_SHADOW_3: ArtShadow = { src: `${H}/fav-shadow-3.svg`, box: [5.34, 21.75, 19.324, 10], bleed: [80, 41.4] };

/** Joint filter options and card tags, in this order. */
export const JOINT_TAGS = ["Joint Fixed", "Joint Driving", "Joint Walking", "Jointless Driving", "Full-Body"] as const;

export const LAB_SHOWCASE: ShowcaseCard[] = [
  {
    projectId: "p-test-01",
    tag: "Joint Fixed",
    favourite: true,
    thumb: {
      shadow: THUMB_SHADOW,
      patch: { box: [143.59, 20.41, 23.748, 25.86], w: 18.731, h: 21.728, rotate: 15.11 },
      robot: { src: `${H}/robot-v1.png`, box: [141.1, 13.49, 48.473, 107.891], crop: V1_CROP },
    },
    avatar: { shadow: AVATAR_SHADOW, robot: { src: `${H}/robot-v1.png`, box: [9.2, 2.1, 11.58, 25.774], crop: V1_CROP } },
    fav: {
      shadow: { src: `${H}/fav-shadow-1.svg`, box: [9.84, 21.75, 10.311, 10], bleed: [80, 77.59] },
      robot: { src: `${H}/robot-v1.png`, box: [9.27, 2.25, 11.457, 25.5], crop: V1_CROP },
    },
  },
  {
    projectId: "p-surprising",
    tag: "Jointless Driving",
    favourite: false,
    thumb: {
      shadow: THUMB_SHADOW,
      patch: DRIVING_PATCH,
      robot: { src: `${H}/robot-v2.png`, box: [120.64, -10.69, 93, 206], crop: "contain" },
    },
    avatar: { shadowOnTop: true, shadow: AVATAR_SHADOW, robot: { src: `${H}/robot-v2.png`, box: FULL, crop: [14.11, 7.82, 72.73, 86.6] } },
  },
  {
    projectId: "p-purebot-dog",
    tag: "Joint Walking",
    favourite: true,
    thumb: {
      patch: { box: [143.52, 51.31, 44.394, 31.376], w: 40.138, h: 21.728, rotate: -15 },
      shadow: { src: `${H}/thumb-shadow-wide.svg`, box: [124.14, 116.79, 83.1, 6.412], bleed: [80, 6.17] },
      robot: { src: `${H}/robot-bear.png`, box: [119.52, 28.31, 92.333, 92.333], crop: [-20, -20, 140, 140] },
    },
    avatar: { shadowOnTop: true, shadow: AVATAR_SHADOW, robot: { src: `${H}/robot-bear.png`, box: FULL, crop: [-3.88, -3.1, 105.16, 105.16] } },
    fav: {
      shadow: { src: `${H}/fav-shadow-2.svg`, box: [3.52, 21.75, 22.95, 10], bleed: [80, 34.86] },
      robot: { src: `${H}/robot-bear.png`, box: [2.25, 2.25, 25.5, 25.5], crop: [-20, -20, 140, 140] },
    },
  },
  {
    projectId: "p-mini-rover",
    tag: "Jointless Driving",
    favourite: false,
    thumb: {
      shadow: THUMB_SHADOW,
      patch: DRIVING_PATCH,
      robot: { src: `${H}/robot-v2-final.png`, box: [120.64, -17.69, 93, 206], crop: "contain" },
    },
    // Figma reuses the Pure bot v2 render for this avatar.
    avatar: { shadowOnTop: true, shadow: AVATAR_SHADOW, robot: { src: `${H}/robot-v2.png`, box: FULL, crop: [14.11, 7.82, 72.73, 86.6] } },
  },
  {
    projectId: "p-sleepy-robot",
    tag: "Joint Fixed",
    favourite: true,
    thumb: {
      shadow: THUMB_SHADOW,
      robot: { src: `${H}/robot-v1-test.png`, box: [126.76, 18.55, 72, 108], crop: [-13.69, -0.05, 126.17, 99.9] },
    },
    avatar: { shadow: AVATAR_SHADOW, robot: { src: `${H}/robot-v1-test.png`, box: [9.2, 2.1, 11.58, 25.774], crop: "cover" } },
    fav: { shadow: FAV_SHADOW_3, robot: { src: `${H}/robot-v1-test.png`, box: [4.26, 2.25, 21.471, 25.5], crop: "cover", flip: true } },
  },
  {
    projectId: "p-test-final",
    tag: "Joint Driving",
    favourite: true,
    thumb: {
      shadow: THUMB_SHADOW,
      robot: { src: `${H}/robot-serving.png`, box: [120.64, -10.69, 93, 206], crop: [0, 14.48, 100, 53.62] },
    },
    avatar: { shadowOnTop: true, shadow: AVATAR_SHADOW, robot: { src: `${H}/robot-serving.png`, box: FULL, crop: [11.36, 6.88, 72.61, 86.24] } },
    fav: { shadow: FAV_SHADOW_3, robot: { src: `${H}/robot-serving.png`, box: [4.26, 2.25, 21.471, 25.5], crop: [-0.06, 0, 100.12, 100] } },
  },
];
