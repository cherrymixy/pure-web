// Face videos on the PURE Desk screen (CLAUDE.md rule 9: content lives in data/).
// The face is never drawn: every face is one of these mp4s (public/pure-desk/faces/).
// "auto" plays the per-behavior video from public/pure-desk/faces/faces.json.
export const FACE_DIR = "/pure-desk/faces/";

export const FACE_VIDEOS = {
  neutral: { file: "neutral.mp4", label: "Neutral", hint: "calm open eyes, the default face" },
  smile: { file: "smile.mp4", label: "Smile", hint: "smiling eyes, friendly and pleased" },
  heart: { file: "heart.mp4", label: "Heart", hint: "heart eyes, delight and affection" },
  surprise: { file: "surprise.mp4", label: "Surprise", hint: "wide eyes, surprised or alert" },
  tilt: { file: "tilt.mp4", label: "Tilt", hint: "tilted eyes, curious or puzzled" },
  sad: { file: "sad.mp4", label: "Sad", hint: "downturned eyes, sad or sorry" },
  sleepy: { file: "sleepy.mp4", label: "Sleepy", hint: "half-closed eyes, sleepy or calm" },
} as const;

export type FaceVideoName = keyof typeof FACE_VIDEOS;
export const FACE_AUTO = "auto";
export const FACE_AUTO_LABEL = "Auto";
export const FACE_AUTO_HINT = "the video that goes with each behavior";

/** Every face value a spec may hold: a video name or "auto". */
export const FACE_NAMES = [...(Object.keys(FACE_VIDEOS) as FaceVideoName[]), FACE_AUTO] as const;

/** Old drawn-face presets → the video that replaces them (saved projects and old pure.json). */
export const LEGACY_FACES: Record<string, string> = {
  soft: "smile",
  wide: "surprise",
  blink: "neutral",
  happy: "smile",
  video: FACE_AUTO,
};
