import type { GuidelineEntry, GuidelineSection } from "./types";
import { faceToFaceDoc } from "./docs/face-to-face";

// Source: PURE guideline final structure v3 (2026-10-19) §8 Pattern — situations.
// Slugs = editor situation ids (data/patterns.ts). The last four are proposed.

const SRC = "PURE guideline final structure v3 (2026-10-19) §8";

interface Pat {
  slug: string;
  title: string;
  summary: string;
  principle: string;
  uses: string;
  note?: string;
  proposed?: true;
  related?: string[];
}

const pat = (p: Pat): GuidelineEntry => ({
  slug: p.slug,
  ref: `pat.${p.slug.replace(/-/g, "_")}`,
  title: p.title,
  summary: p.summary,
  body: [
    {
      kind: "table",
      title: "Spec",
      head: ["Field", "Value"],
      rows: [
        ["definition", p.summary],
        ["principle", p.principle],
        ["sequence", p.uses],
        ["priority", "Safety > call · touch > conversation > waiting"],
        ...(p.note ? [["note", p.note]] : []),
      ],
    },
    { kind: "p", title: "Structure", text: "A pattern is a state machine: trigger → behavior sequence → exit, plus transitions to other situations. Its sequence uses Component IDs only." },
  ],
  related: p.related,
  source: SRC,
  ...(p.proposed ? { proposed: true as const } : {}),
});

export const situation: GuidelineSection = {
  id: "situation",
  title: "Patterns",
  summary:
    "Situations as state machines: trigger → behavior sequence → exit, with transitions and a shared priority. Seven existing patterns and four proposed ones.",
  entries: [
    {
      ...pat({ slug: "face-to-face", title: "Face to Face", summary: "Facing each other and focused on the interaction.", principle: "Keep the gaze, but keep it alive.", uses: "nod · curious · joy …", related: ["conversation", "calling"] }),
      doc: faceToFaceDoc,
    },
    pat({ slug: "touching", title: "Touching", summary: "The person touches the body or a joint directly.", principle: "React softly to every touch.", uses: "rub · joy", related: ["rub", "face-to-face"] }),
    pat({ slug: "calling", title: "Calling", summary: "A voice or signal asks for attention right away.", principle: "Within 1 s, with a lively turn.", uses: "approach · bow", related: ["face-to-face", "behavior/approach"] }),
    pat({ slug: "carried", title: "Carried", summary: "The robot is lifted or moved.", principle: "Curl up and keep the head level.", uses: "— (state override: other behaviors are skipped)", note: "Renamed Moving → Carried.", related: ["common"] }),
    pat({ slug: "pass-by", title: "Pass By", summary: "Someone walks past without intent.", principle: "Notice, but do not stare.", uses: "track (late delay)", note: "Renamed Pass Away → Pass By (avoids the meaning \"to die\").", related: ["by-your-side", "primitive-tokens/track"] }),
    pat({ slug: "leave", title: "Leave", summary: "The person leaves the space and the interaction ends.", principle: "See them off, then let go slowly.", uses: "bow · close", related: ["close", "by-your-side"] }),
    pat({ slug: "by-your-side", title: "By your side", summary: "In the same space without conversation.", principle: "Stay close without drawing attention.", uses: "doze · stretch (drift while waiting)", note: "Idle intensity is a hypothesis (test variable).", related: ["doze", "stretch"] }),
    pat({ slug: "conversation", title: "Conversation", summary: "Yes / no or unclear moments during a conversation.", principle: "Answer with the agreed signals.", uses: "nod · shake · curious", proposed: true, related: ["nod", "shake", "curious"] }),
    pat({ slug: "feedback", title: "Feedback", summary: "Reacting to the result after finishing a task.", principle: "Show how it went.", uses: "joy · sad · laugh", proposed: true, related: ["joy", "sad"] }),
    pat({ slug: "guiding", title: "Guiding", summary: "Showing a direction or a location.", principle: "Gaze first, then a clear stop at the target.", uses: "point", proposed: true, related: ["point"] }),
    pat({ slug: "sudden", title: "Sudden", summary: "An unexpected sound or movement.", principle: "Once, short, then back.", uses: "surprise", proposed: true, related: ["surprise", "fear"] }),
    {
      slug: "pattern-spec",
      title: "Pattern spec and transitions",
      summary: "The fields every pattern has, and how situations hand over to each other.",
      body: [
        {
          kind: "table",
          title: "Fields",
          head: ["Field", "Content"],
          rows: [
            ["id · name · definition", ""],
            ["trigger", "Entry condition (sensor · voice · state)"],
            ["sequence", "Component IDs only (no tokens or operators written directly)"],
            ["exit", "Exit condition"],
            ["transitions", "Hand-over to the next situation (e.g. Calling → Face to Face → Leave)"],
            ["priority", "Common priority (safety > call · touch > conversation > waiting)"],
            ["state_overrides", "Carried · battery · quiet hours · error"],
            ["edge_cases", "Exceptions (e.g. reacting to a similar word on TV, then returning awkwardly / a delay for someone who pretends to leave and comes back)"],
          ],
        },
        {
          kind: "code",
          title: "Transitions",
          lang: "text",
          text: [
            "              ┌──────────── Safety (interrupts every situation) ───────────┐",
            "              ▼                                                            │",
            "By your side ──call──▶ Calling ──face──▶ Face to Face ──end──▶ Leave ──▶ By your side",
            "     │                    ▲                 │   ├─ Conversation",
            "     ├─passes─▶ Pass By ──┘                 │   ├─ Feedback / Guiding",
            "     └─touch──▶ Touching ───────────────────┘   └─ Sudden",
            "   lifted (anywhere) ──▶ Carried ──put down──▶ previous situation",
          ].join("\n"),
        },
        { kind: "p", text: "The old line \"the seven most common situations that never overlap\" had no evidence and was removed; the transition diagram and priority replace it." },
      ],
      related: ["face-to-face", "common"],
      source: `${SRC}-2, §8-3`,
    },
  ],
};
