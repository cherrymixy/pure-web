// Guideline content shape (W03). Pure data — rendered by the guideline pages in STEP 10.

export type GuidelineSectionId =
  | "overview"
  | "principles"
  | "primitive-tokens"
  | "behavior"
  | "situation"
  | "robot-classes"
  | "templates";

export type GuidelineBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "code"; lang: string; text: string };

export interface GuidelineEntry {
  /** URL segment: /guideline/<section>/<slug> */
  slug: string;
  title: string;
  summary: string;
  body: GuidelineBlock[];
  dos?: string[];
  donts?: string[];
  /** slugs of related entries (any section) */
  related?: string[];
  /** Behavior entries: the simulator behavior that demonstrates it (one of the 15 in lib/sim/behaviors.ts) */
  simBehavior?: string;
  /** Where the content came from, e.g. "guideline-content.ts:nod" or "PURE_Knowledge/05_Behavior_Patterns/Greeting.md" */
  source?: string;
  /** true = no source content yet; body holds a short stub to be written (PRD appendix D 🟡) */
  placeholder?: true;
}

export interface GuidelineSection {
  id: GuidelineSectionId;
  title: string;
  summary: string;
  entries: GuidelineEntry[];
}
