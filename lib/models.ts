// Data model (PRD §7). Types are inferred from the zod schemas so validation and
// typing never drift. Pure: no React, no I/O.

import { z } from "zod";

// ------------------------------------------------------------------ primitives

export const ROBOT_TYPES = ["full-body", "joint-walking", "joint-driving", "jointless-driving", "joint-fixed"] as const;
export const RobotTypeSchema = z.enum(ROBOT_TYPES);
export type RobotType = z.infer<typeof RobotTypeSchema>;

export const CHANNELS = ["motion", "face", "sound"] as const;
export const ChannelSchema = z.enum(CHANNELS);
export type Channel = z.infer<typeof ChannelSchema>;

/** Same names as lib/sim/motion.ts EasingName (kept literal here so models stay standalone). */
export const EASINGS = [
  "linear",
  "ease_in_out",
  "ease_in",
  "ease_out",
  "ease_out_back",
  "ease_out_elastic",
  "ease_out_bounce",
] as const;
export const EasingSchema = z.enum(EASINGS);

/** Robot joint id, e.g. `shoulder_pitch` (PURE Desk `jointKeys`). */
export type JointId = string;

const IsoDate = z.string().datetime();

// ------------------------------------------------------------------ structure

export const JointSchema = z
  .object({
    id: z.string().min(1),
    label: z.string(),
    /** Structure range (Edit limits can only narrow the rig range) */
    min: z.number(),
    max: z.number(),
    rigMin: z.number(),
    rigMax: z.number(),
  })
  .refine((j) => j.rigMin <= j.min && j.min < j.max && j.max <= j.rigMax, {
    message: "Joint range must sit inside the rig range (rigMin ≤ min < max ≤ rigMax)",
  });
export type Joint = z.infer<typeof JointSchema>;

export const StructureSchema = z.object({
  type: RobotTypeSchema,
  joints: z.array(JointSchema),
  channels: z.array(ChannelSchema),
  source: z.enum(["pure-desk", "import"]),
  file: z.object({ name: z.string(), size: z.number(), path: z.string() }).optional(),
});
export type Structure = z.infer<typeof StructureSchema>;

// ------------------------------------------------------------------ signature

export const AXES = ["tempo", "amp", "settle", "antic", "rhythm", "eyes", "pitch", "density"] as const;
export const AxisSchema = z.enum(AXES);
export type Axis = z.infer<typeof AxisSchema>;
const AxisValue = z.number().min(0).max(100);

export const SourceSchema = z.object({
  kind: z.enum(["pdf", "url", "figma", "default"]),
  name: z.string(),
  path: z.string().optional(),
  url: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

export const SignatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number().int().min(1),
  axes: z.record(AxisSchema, AxisValue),
  tone: z.array(z.string()),
  mapping: z.array(z.object({ axis: AxisSchema, value: AxisValue, reason: z.string(), page: z.number().int().optional() })),
  sources: z.array(SourceSchema),
  note: z.string(),
  createdAt: IsoDate,
});
export type Signature = z.infer<typeof SignatureSchema>;

// ------------------------------------------------------------------ project

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: RobotTypeSchema,
  status: z.enum(["analyzing", "draft", "ready"]),
  progress: z.number().min(0).max(100).optional(),
  structure: StructureSchema.optional(),
  signatureId: z.string().optional(),
  signatureHistory: z.array(SignatureSchema),
  channelsUsed: z.array(ChannelSchema),
  updatedAt: IsoDate,
});
export type Project = z.infer<typeof ProjectSchema>;

// ------------------------------------------------------------------ expression

export const RecipeStepSchema = z.object({
  behavior: z.string(),
  speed: z.number().positive(),
  amplitude: z.number().min(0),
  repeat: z.number().int().min(1),
  /** Face video name shown while this step plays */
  face: z.string().optional(),
});
export type RecipeStep = z.infer<typeof RecipeStepSchema>;

export const RecipeSchema = z.object({
  steps: z.array(RecipeStepSchema),
  loop: z.boolean().optional(),
});
export type Recipe = z.infer<typeof RecipeSchema>;

export const KeySchema = z.object({ t: z.number().min(0), value: z.number(), easing: EasingSchema });
export type Key = z.infer<typeof KeySchema>;

export const ClipSchema = z.object({
  format: z.literal("lelamp.clip/1"),
  duration: z.number().positive(),
  tracks: z.record(z.string(), z.array(KeySchema)),
  loop: z.boolean().optional(),
});
export type Clip = z.infer<typeof ClipSchema>;

export const FaceKeySchema = z.object({ t: z.number().min(0), preset: z.string() });
export type FaceKey = z.infer<typeof FaceKeySchema>;

export const FaceSpecSchema = z.object({
  /** Face video name (data/face-videos.ts) or "auto" for the per-behavior video; "" = no face channel */
  preset: z.string(),
  /** Timeline keys: from t on, this video plays (held until the next key) */
  keys: z.array(FaceKeySchema).optional(),
});
export type FaceSpec = z.infer<typeof FaceSpecSchema>;

export const SoundCueSchema = z.object({
  id: z.string(),
  t: z.number().min(0),
  pitchSt: z.number(),
  tempo: z.number().positive(),
  lengthS: z.number().positive(),
  timbre: z.enum(["bright", "soft"]),
  volumeDb: z.number(),
});
export type SoundCue = z.infer<typeof SoundCueSchema>;

export const SoundSpecSchema = z.object({ cues: z.array(SoundCueSchema) });
export type SoundSpec = z.infer<typeof SoundSpecSchema>;

export const MotionPropsSchema = z.object({
  amplitude: z.number().min(0).max(100),
  duration: z.number().min(0).max(100),
  smoothness: z.number().min(0).max(100),
  speed: z.number().min(0).max(100),
  frequency: z.number().min(0).max(100),
});
export type MotionProps = z.infer<typeof MotionPropsSchema>;

export const ReferenceSchema = z.object({
  id: z.string(),
  kind: z.enum(["video", "image", "userData"]),
  path: z.string(),
  thumb: z.string(),
  durationS: z.number().optional(),
  frames: z.array(z.string()).optional(),
  /** Vision summary, made right after upload and reused by every Generate (keeps describe off the critical path) */
  summary: z.string().optional(),
  status: z.enum(["ok", "failed"]),
});
export type Reference = z.infer<typeof ReferenceSchema>;

const ExpressionBase = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  currentStatus: z.string(),
  components: z.array(z.string()),
  pattern: z.string(),
  references: z.array(ReferenceSchema),
  motion: z.object({
    mode: z.enum(["recipe", "clip"]),
    recipe: RecipeSchema,
    clip: ClipSchema.optional(),
    props: MotionPropsSchema,
  }),
  face: FaceSpecSchema,
  sound: SoundSpecSchema,
  signatureSnapshot: SignatureSchema,
  version: z.number().int().min(1),
  createdAt: IsoDate,
});

/** Expression body for create/update (the server assigns id, projectId, version, history, createdAt). */
export const ExpressionInputSchema = ExpressionBase.omit({ id: true, projectId: true, version: true, createdAt: true });

export type Expression = z.infer<typeof ExpressionBase> & { history: Expression[] };
export const ExpressionSchema: z.ZodType<Expression> = ExpressionBase.extend({
  history: z.lazy(() => z.array(ExpressionSchema)),
});

export type SavedExpression = Expression & { savedAt: string; channels: Channel[] };
export const SavedExpressionSchema: z.ZodType<SavedExpression> = ExpressionBase.extend({
  history: z.lazy(() => z.array(ExpressionSchema)),
  savedAt: IsoDate,
  channels: z.array(ChannelSchema),
});

// ------------------------------------------------------------------ share · user data · profile

export const ShareSchema = z.object({
  id: z.string(),
  expressionIds: z.array(z.string()),
  signatureVersion: z.number().int(),
  type: RobotTypeSchema,
  expiresAt: IsoDate,
  /** PRD `password`: stored as "salt:scrypt-hash", never plain text */
  passwordHash: z.string().optional(),
  allowDownload: z.boolean(),
  attempts: z.number().int().min(0),
  /** 5 wrong passwords → locked for 5 minutes */
  lockedUntil: IsoDate.optional(),
  createdAt: IsoDate,
});
export type Share = z.infer<typeof ShareSchema>;

export const USER_DATA_CATEGORIES = ["Idle", "Approach", "Interaction", "Task", "Expressive", "Other"] as const;

export const UserDataMotionSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(USER_DATA_CATEGORIES),
  uses: z.number().int().min(0),
  preview: RecipeSchema,
  source: z.enum(["seed", "user"]),
});
export type UserDataMotion = z.infer<typeof UserDataMotionSchema>;

export const TEAM_ROLES = ["Owner", "Admin", "Editor", "Viewer"] as const;

export const TeamMemberSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.enum(TEAM_ROLES),
  pending: z.boolean().optional(),
  expiresAt: IsoDate.optional(),
});
export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const ProfileSchema = z.object({
  /** W05 Edit profile: 1–20 characters */
  name: z.string().min(1).max(20),
  email: z.string().email(),
  company: z.string(),
  signedInWith: z.string(),
  team: z.array(TeamMemberSchema),
});
export type Profile = z.infer<typeof ProfileSchema>;

/** Dummy robots for "Test on your robot" (W02F-1). Not in PRD §7; seed only. */
export const RobotDeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: RobotTypeSchema,
  online: z.boolean(),
});
export type RobotDevice = z.infer<typeof RobotDeviceSchema>;

// ------------------------------------------------------------------ jobs · settings · db (not in PRD §7)

export const JOB_KINDS = ["dev-echo", "analyze-model", "signature-extract", "generate"] as const;
export const JobSchema = z.object({
  id: z.string(),
  kind: z.enum(JOB_KINDS),
  projectId: z.string().nullable(),
  status: z.enum(["queued", "running", "done", "failed", "canceled"]),
  /** 0–100 */
  progress: z.number().min(0).max(100),
  /** Current step index — a restarted runner resumes from here */
  step: z.number().int().min(0),
  stepLabel: z.string().optional(),
  input: z.unknown(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  /** Machine-readable failure, e.g. E1 codes FIGMA_UNSUPPORTED / NO_TEXT */
  errorCode: z.string().optional(),
  createdAt: IsoDate,
  updatedAt: IsoDate,
});
export type Job = z.infer<typeof JobSchema>;
export type JobKind = Job["kind"];

export const SettingsSchema = z.object({
  /** LLM routes use the demo fallback instead of Ollama */
  demoMode: z.boolean(),
  /** Sound −12 dB (STEP 9) */
  quietHours: z.boolean(),
  /** STEP 12 experiment: vision model writes the keyframe clip directly (default off; env FLAG_DIRECT_CLIP=1 also turns it on) */
  directClip: z.boolean().optional(),
});
export type Settings = z.infer<typeof SettingsSchema>;

export interface Db {
  schemaVersion: 1;
  profile: Profile;
  projects: Project[];
  expressions: Expression[];
  library: SavedExpression[];
  shares: Share[];
  userData: UserDataMotion[];
  robots: RobotDevice[];
  settings: Settings;
  jobs: Job[];
}
