import type { Db, Expression, Profile, Project, RobotDevice, SavedExpression, Share, Signature, UserDataMotion } from "@/lib/models";
import { SIM_BEHAVIORS } from "./sim-behaviors";
import { COMPONENT_DEMOS, PROMPT_DEMOS, type DemoExpression } from "./demo-recipes";
import { PURE_DESK_STRUCTURE } from "./pure-desk";
import { PURE_DEFAULT_SIGNATURE } from "./signature";

// Demo data loaded by "Reset demo data" (STEP 5). Dates are fixed so the demo is repeatable.

export const SEED_PROFILE: Profile = {
  name: "SeungA Jeon",
  email: "SeungA@purebot.com",
  company: "Purebot Co.",
  signedInWith: "Google",
  team: [
    { name: "SeungA Jeon", email: "SeungA@purebot.com", role: "Owner" },
    { name: "Minjun Park", email: "minjun@purebot.com", role: "Admin" },
    { name: "Jiwoo Kim", email: "jiwoo@purebot.com", role: "Editor" },
    { name: "Hana Choi", email: "hana@purebot.com", role: "Viewer" },
  ],
};

const PUREBOT_SIGNATURE: Signature = {
  id: "sig-purebot-1",
  name: "Purebot Brand",
  version: 1,
  axes: { tempo: 42, amp: 56, settle: 70, antic: 50, rhythm: 58, eyes: 56, pitch: 46, density: 52 },
  tone: ["warm", "precise", "playful"],
  mapping: [
    { axis: "settle", value: 70, reason: "“precise” on p.12 raises Settle to 70.", page: 12 },
    { axis: "tempo", value: 42, reason: "“warm” on p.4 lowers Tempo to 42.", page: 4 },
    { axis: "rhythm", value: 58, reason: "“playful” on p.7 raises Rhythm to 58.", page: 7 },
  ],
  sources: [{ kind: "pdf", name: "Purebot_Brand_Guide.pdf" }],
  note: "Draft from the Purebot brand guide.",
  createdAt: "2026-10-10T10:20:00.000Z",
};

export const SEED_PROJECTS: Project[] = [
  {
    id: "p-test-01", name: "Test-01", type: "joint-fixed", status: "ready", structure: PURE_DESK_STRUCTURE,
    signatureId: PUREBOT_SIGNATURE.id, signatureHistory: [PUREBOT_SIGNATURE], channelsUsed: ["motion", "face", "sound"],
    updatedAt: "2026-10-15T16:40:00.000Z",
  },
  {
    id: "p-sleepy-robot", name: "Sleepy robot", type: "joint-fixed", status: "ready", structure: PURE_DESK_STRUCTURE,
    signatureId: PUREBOT_SIGNATURE.id, signatureHistory: [PUREBOT_SIGNATURE], channelsUsed: ["motion", "face"],
    updatedAt: "2026-10-14T11:05:00.000Z",
  },
  {
    id: "p-surprising", name: "Surprising", type: "joint-fixed", status: "draft", structure: PURE_DESK_STRUCTURE,
    signatureHistory: [], channelsUsed: ["motion"], updatedAt: "2026-10-12T09:30:00.000Z",
  },
  {
    id: "p-test-final", name: "Test- final", type: "joint-fixed", status: "draft", structure: PURE_DESK_STRUCTURE,
    signatureId: PURE_DEFAULT_SIGNATURE.id, signatureHistory: [PURE_DEFAULT_SIGNATURE], channelsUsed: ["motion", "sound"],
    updatedAt: "2026-10-09T18:15:00.000Z",
  },
  {
    id: "p-mini-rover", name: "Mini rover", type: "joint-fixed", status: "draft", structure: PURE_DESK_STRUCTURE,
    signatureId: PUREBOT_SIGNATURE.id, signatureHistory: [PUREBOT_SIGNATURE], channelsUsed: ["motion", "face"],
    updatedAt: "2026-10-11T14:20:00.000Z",
  },
  {
    id: "p-purebot-dog", name: "Pure bot - dog", type: "joint-walking", status: "analyzing", progress: 62,
    signatureHistory: [], channelsUsed: [], updatedAt: "2026-10-16T08:50:00.000Z",
  },
];

function toExpression(id: string, projectId: string, demo: DemoExpression, component: string, signature: Signature, createdAt: string): Expression {
  return {
    id,
    projectId,
    name: demo.name,
    currentStatus: demo.currentStatus,
    components: [component],
    pattern: "face-to-face",
    references: [],
    motion: { mode: "recipe", recipe: demo.motion.recipe, props: demo.motion.props },
    face: demo.face,
    sound: demo.sound,
    signatureSnapshot: signature,
    version: 1,
    history: [],
    createdAt,
  };
}

export const SEED_EXPRESSIONS: Expression[] = [
  toExpression("e-sleepy-nod", "p-sleepy-robot", PROMPT_DEMOS.tired, "doze", PUREBOT_SIGNATURE, "2026-10-14T11:00:00.000Z"),
  toExpression("e-hello-wave", "p-test-01", PROMPT_DEMOS.here, "bow", PUREBOT_SIGNATURE, "2026-10-15T16:30:00.000Z"),
];

const saved = (e: Expression, savedAt: string): SavedExpression => ({
  ...e,
  savedAt,
  channels: (["motion", "face", "sound"] as const).filter((c) => c !== "sound" || e.sound.cues.length > 0),
});

export const SEED_LIBRARY: SavedExpression[] = [
  saved(SEED_EXPRESSIONS[0], "2026-10-14T11:10:00.000Z"),
  saved(SEED_EXPRESSIONS[1], "2026-10-15T16:35:00.000Z"),
  saved(toExpression("e-curious-tilt", "p-test-01", { ...COMPONENT_DEMOS.curious, name: "Curious tilt" }, "curious", PUREBOT_SIGNATURE, "2026-10-13T14:00:00.000Z"), "2026-10-13T14:05:00.000Z"),
  saved(toExpression("e-startled-hop", "p-surprising", PROMPT_DEMOS.startled, "surprise", PURE_DEFAULT_SIGNATURE, "2026-10-12T09:20:00.000Z"), "2026-10-12T09:25:00.000Z"),
];

const CATEGORY: Record<string, UserDataMotion["category"]> = {
  idle: "Idle", doze: "Idle", sleep: "Idle", focus: "Task", sweep: "Task", home: "Other",
  greet: "Approach", wake: "Approach", alert: "Approach",
  nod: "Interaction", shake: "Interaction", look_around: "Interaction", curious: "Interaction",
  happy: "Expressive", sad: "Expressive",
};
const USES = [312, 148, 96, 205, 487, 133, 174, 268, 391, 87, 156, 452, 64, 119, 41];

export const SEED_USER_DATA: UserDataMotion[] = [
  ...SIM_BEHAVIORS.map((c, i): UserDataMotion => ({
    id: `ud-${c.id}`,
    name: c.label,
    category: CATEGORY[c.id],
    uses: USES[i],
    preview: { steps: [{ behavior: c.id, speed: 1, amplitude: 1, repeat: 1 }] },
    source: "seed",
  })),
  // Community motions drawn in Figma (943:1134) that aren't a single simulator behavior.
  { id: "ud-stretch", name: "Stretch", category: "Expressive", uses: 226, preview: { steps: [{ behavior: "wake", speed: 0.8, amplitude: 1.2, repeat: 1 }] }, source: "seed" },
  { id: "ud-surprise", name: "Surprise", category: "Expressive", uses: 219, preview: { steps: [{ behavior: "alert", speed: 1.2, amplitude: 1.2, repeat: 1 }] }, source: "seed" },
  {
    id: "ud-fear",
    name: "Fear",
    category: "Expressive",
    uses: 131,
    preview: { steps: [{ behavior: "alert", speed: 1.3, amplitude: 0.8, repeat: 1 }, { behavior: "shake", speed: 1.4, amplitude: 0.6, repeat: 1 }] },
    source: "seed",
  },
];

/** Databases saved before a seed motion existed get it added on load (user data is never touched). */
export function addMissingSeedMotions(db: Db): void {
  const have = new Set(db.userData.map((u) => u.id));
  const firstUser = db.userData.findIndex((u) => u.source === "user");
  const missing = SEED_USER_DATA.filter((u) => !have.has(u.id)).map((u) => structuredClone(u));
  // Seeds go before user uploads so "Recently" (newest first) keeps uploads on top.
  db.userData.splice(firstUser < 0 ? db.userData.length : firstUser, 0, ...missing);
}

/** Repo load migration: seed projects that are missing (deleted, or added after the DB was made) come back — the lab home shows a fixed set. */
export function addMissingSeedProjects(db: Db): void {
  const have = new Set(db.projects.map((p) => p.id));
  db.projects.push(...SEED_PROJECTS.filter((p) => !have.has(p.id)).map((p) => structuredClone(p)));
}

export const SEED_ROBOTS: RobotDevice[] = [
  { id: "r-purebot-desk", name: "Purebot Desk", type: "joint-fixed", online: true },
  { id: "r-studio-arm", name: "Studio arm", type: "joint-fixed", online: false },
];

export const SEED_SHARES: Share[] = [];

export const SEED_SIGNATURES: Signature[] = [PURE_DEFAULT_SIGNATURE, PUREBOT_SIGNATURE];

/** A fresh database built from the seed (deep copy, safe to mutate). */
export function seedDb(): Db {
  return structuredClone({
    schemaVersion: 1,
    profile: SEED_PROFILE,
    projects: SEED_PROJECTS,
    expressions: SEED_EXPRESSIONS,
    library: SEED_LIBRARY,
    shares: SEED_SHARES,
    userData: SEED_USER_DATA,
    robots: SEED_ROBOTS,
    settings: { demoMode: false, quietHours: false },
    jobs: [],
  } satisfies Db);
}
