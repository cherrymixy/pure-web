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
  /** Component-page template (Figma W03-4 550:2490). When set, the entry renders as a component doc instead of body/dos/donts. */
  doc?: ComponentDoc;
}

/** Component-page content (Figma W03-4). Sizes are in 1920 px (Figma 960 frame ×2). */
export interface ComponentDoc {
  /** e.g. ["Components", "S4 Regulatory"] */
  breadcrumb: string[];
  lead: string;
  resources: { label: string; href?: string }[];
  tags: string[];
  sections: ComponentDocSection[];
}

/** Top-level page section: an "On this page" entry and an anchor (#id). */
export interface ComponentDocSection {
  id: string;
  title: string;
  text?: string;
  blocks: ComponentDocBlock[];
}

export type ComponentDocBlock =
  /** Robot anatomy figure with numbered callouts; parts are in callout order (1 body, 2 face display, 3 speaker). */
  | { kind: "anatomy"; parts: { label: string; detail: string }[] }
  /** Sub-heading: a nested "On this page" entry (toc overrides its label there). */
  | { kind: "subhead"; id: string; title: string; text?: string; toc?: string }
  /** Row of equal cards, each with a placeholder preview box. */
  | { kind: "cards"; preview: string; previewHeight: number; cards: { title: string; chips?: string[]; caption?: string }[] }
  /** widths: px per column, null = fill. keyCols: columns styled as keys (medium, primary); default [0]. */
  | { kind: "table"; head: string[]; rows: string[][]; widths: (number | null)[]; keyCols?: number[] }
  | { kind: "states"; items: { state: string; effect: string }[] }
  | { kind: "doDont"; preview: string; previewHeight: number; do: string; dont: string }
  | { kind: "stat"; value: string; text: string }
  /** Pill links; slug resolves to a guideline entry when it exists. */
  | { kind: "chips"; items: { label: string; slug?: string }[] };

export interface GuidelineSection {
  id: GuidelineSectionId;
  title: string;
  summary: string;
  entries: GuidelineEntry[];
}
