import type { GuidelineEntry, GuidelineSection } from "./types";

// Source: PURE guideline final structure v3 (2026-10-19) §9 Template — form factors, sources, robots.
// Form-factor slugs = data/robot-types.ts ids (same order).

const SRC = "PURE guideline final structure v3 (2026-10-19) §9";

interface Ff {
  slug: string;
  ref: string;
  title: string;
  alias: string;
  roles: [attend: string, posture: string, locomote: string, gesture: string];
  substitute: string;
}

const ff = (f: Ff): GuidelineEntry => ({
  slug: f.slug,
  ref: f.ref,
  title: f.title,
  summary: `Form-factor profile: ${f.alias}.`,
  body: [
    {
      kind: "table",
      title: "Roles",
          head: ["Role", "Real part"],
      rows: [
        ["role.attend", f.roles[0]],
        ["role.posture", f.roles[1]],
        ["role.locomote", f.roles[2]],
        ["role.gesture", f.roles[3]],
        ["substitute", f.substitute],
      ],
    },
    {
      kind: "p",
      text: "Profile fields: roles (role → real joints) · limits (joint ranges · max_speed · max_accel) · channels (face class · speaker · light) · substitute (stand-ins for missing roles) · behaviors (each of the 16 behaviors as is / substituted / skipped).",
    },
  ],
  related: ["form-factors"],
  source: `${SRC}-1`,
});

export const templates: GuidelineSection = {
  id: "templates",
  title: "Templates",
  summary:
    "Which body runs a Component: five form-factor profiles (roles → real joints) × four face classes, source profiles for analysis, and robot instances.",
  entries: [
    {
      slug: "form-factors",
      title: "Form factors",
      summary: "Five profiles classified by form. The same Component runs on different joints through the role mapping.",
      body: [
        {
          kind: "table",
          title: "Five form factors",
          head: ["ID", "Form", "Also called", "Attend", "Posture", "Locomote", "Gesture", "Substitute"],
          rows: [
            ["ff.fixed_jointed", "Joint Fixed", "Stand · tabletop · robot arm", "Head · wrist", "Torso", "—", "(attend)", "Locomote → lean"],
            ["ff.wheeled_rigid", "Jointless Driving", "Wheeled · cylinder", "Body turn", "—", "Wheels", "Body turn", "Posture → skip"],
            ["ff.wheeled_jointed", "Joint Driving", "Wheels + head / arm", "Head", "(torso)", "Wheels", "Arm (if any)", "Gesture → body turn"],
            ["ff.legged", "Joint Walking", "Quadruped · pet robot", "Head · body", "Height and tilt with legs", "Legs", "(attend)", ""],
            ["ff.full_body", "Full-body", "Humanoid", "Head", "Torso · legs", "Legs", "Arms", "All roles"],
          ],
        },
        {
          kind: "code",
          title: "Profile example",
          lang: "json",
          text: `{ "id": "ff.fixed_jointed", "name": { "en": "Joint Fixed", "alias": ["Stand", "Robot arm"] },
  "roles": { "ATTEND": ["head_pan", "head_tilt"], "POSTURE": ["torso_pitch"],
             "LOCOMOTE": null, "GESTURE": "ATTEND" },
  "limits": { "head_tilt_deg": [-30, 30], "max_speed_deg_s": 350 },
  "channels": { "face": "eyes", "voice": "earcon", "light": null },
  "substitute": { "LOCOMOTE": "POSTURE.lean" } }`,
        },
      ],
      related: ["notation", "face"],
      source: `${SRC}-1`,
    },
    ff({ slug: "full-body", ref: "ff.full_body", title: "Full-body", alias: "humanoid", roles: ["Head", "Torso · legs", "Legs", "Arms"], substitute: "All roles present" }),
    ff({ slug: "joint-walking", ref: "ff.legged", title: "Joint Walking", alias: "quadruped · pet robot", roles: ["Head · body", "Height and tilt with legs", "Legs", "(attend)"], substitute: "Gesture → attend" }),
    ff({ slug: "joint-driving", ref: "ff.wheeled_jointed", title: "Joint Driving", alias: "wheels + head / arm", roles: ["Head", "(torso)", "Wheels", "Arm (if any)"], substitute: "Gesture → body turn" }),
    ff({ slug: "jointless-driving", ref: "ff.wheeled_rigid", title: "Jointless Driving", alias: "wheeled · cylinder", roles: ["Body turn", "—", "Wheels", "Body turn"], substitute: "Posture → skip" }),
    ff({ slug: "joint-fixed", ref: "ff.fixed_jointed", title: "Joint Fixed", alias: "stand · tabletop · robot arm", roles: ["Head · wrist", "Torso", "—", "(attend)"], substitute: "Locomote → lean (posture)" }),
    {
      slug: "sources",
      ref: "src.*",
      title: "Source profiles",
      summary: "Maps the parts in a source video onto robot roles. Used in the analysis steps of the pipeline (1, 2).",
      proposed: true,
      body: [
        {
          kind: "table",
          title: "Source profiles",
          head: ["Source", "Source part → role", "Parts without a match"],
          rows: [
            ["src.human", "Head → attend · torso → posture · gait → locomote · arms and hands → gesture · expression → face", "—"],
            ["src.dog", "Head → attend · torso → posture · gait → locomote · front paws → gesture", "Tail wag → SECOND (body sway or blink), else skipped · ears → SECOND or skipped"],
            ["src.cat", "(same as dog)", "Tail · ears → SECOND or skipped"],
            ["src.character", "Animated character — the closest human or animal profile; exaggeration is split off into Style", "—"],
          ],
        },
        { kind: "p", text: "The need is confirmed; the content is proposed." },
      ],
      related: ["pipeline", "presets"],
      source: `${SRC}-2`,
    },
    {
      slug: "pure-pet",
      ref: "robot.pure_pet",
      title: "PURE pet robot",
      summary: "A robot designed by the user: Joint Walking × eyes.",
      body: [
        {
          kind: "table",
          title: "Spec",
          head: ["Field", "Value"],
          rows: [
            ["form factor × face", "ff.legged × eyes"],
            ["expressive parts", "Screen eyes + legs. Ears are fixed."],
            ["SECOND channels", "Blink · breathing · weight shift on the legs"],
          ],
        },
      ],
      related: ["joint-walking", "pure-desk"],
      source: `${SRC}-3`,
    },
    {
      slug: "pure-desk",
      ref: "robot.pure_desk",
      title: "PURE Desk",
      summary: "The desk robot (film scenario): Joint Fixed × eyes, 5 joints + a face screen.",
      proposed: true,
      body: [
        {
          kind: "table",
          title: "Spec",
          head: ["Field", "Value"],
          rows: [
            ["form factor × face", "ff.fixed_jointed × eyes"],
            ["joints", "5 axes + a face screen (about 115 × 69 mm, 5:3)"],
            ["face spec", "FaceUI v2: canvas 480 × 320, 30 fps, two colors, safe area, file rules, faces.json mapping"],
          ],
        },
        {
          kind: "p",
          text: "FaceUI v2 is the production spec of one robot's screen, so it sits here as the robot instance's face implementation spec, not in the Foundation (proposed).",
        },
      ],
      related: ["joint-fixed", "face"],
      source: `${SRC}-3`,
    },
    {
      slug: "export",
      title: "Export",
      summary: "PDF report · pure.json · CSV · dataset — class + channels + signature + patterns, bundled for the robot and the team.",
      body: [{ kind: "list", title: "Formats", items: ["PDF report", "pure.json", "CSV", "Dataset"] }],
      related: ["pure-desk"],
      source: `${SRC}-4`,
    },
  ],
};
