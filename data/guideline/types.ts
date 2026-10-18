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

/** Component-page content (Figma W03-4L 808:1254). Sizes are in 1920 px (Figma 960 frame ×2). */
export interface ComponentDoc {
  breadcrumb: string;
  /** Lead paragraph, one string per line */
  lead: string[];
  resources: { label: string; href?: string }[];
  /** "On this page" entry for the page header (anchor #top); omit for none */
  topToc?: string;
  /** Page rows top to bottom; a pair renders side by side (Variant | State). Every section is an "On this page" entry. */
  rows: (ComponentDocSection | [ComponentDocSection, ComponentDocSection])[];
  /** Prev / next cards; path is relative to the guideline base ("behavior", "situation/face-to-face") */
  prev?: { title: string; path: string };
  next?: { title: string; path: string };
}

export type DocChannel = "motion" | "face" | "sound";

export type ComponentDocSection = {
  /** anchor (#id) */
  id: string;
  title: string;
  /** "On this page" label when it differs from the title */
  toc?: string;
  text: string;
  /** px between the heading and the body (default 40) */
  gap?: number;
} & (
  | {
      kind: "robot";
      classes: { label: string; icon: "wheel" | "wheel-arm" | "arm" | "quad" | "human" }[];
      /** index into classes */
      selected: number;
      /** stage callouts: [face bubble, motion bubble] */
      notes: [string, string];
    }
  /** reach: 1 = light … 3 = strong (how far the dot moves toward the bar) */
  | { kind: "intensity"; levels: { title: string; chips: string[]; token: string; reach: 1 | 2 | 3 }[] }
  | {
      kind: "timeline";
      /** seconds */
      duration: number;
      tracks: { channel: DocChannel; label: string; clips: { from: number; to: number; label?: string; align?: "start" }[] }[];
    }
  /** cols: per-column style — key (semibold primary), name (medium primary), label (medium secondary), muted (regular secondary),
   *  body (regular neutral-600), text (regular primary), code (mono primary), track (channel icon + colored name; other values plain).
   *  widths: px, null = fill */
  | { kind: "table"; head: string[]; rows: string[][]; widths: (number | null)[]; cols: ("key" | "name" | "label" | "muted" | "body" | "text" | "code" | "track")[] }
  /** plain: no bullet before the effect (pattern "Common" rules) */
  | { kind: "states"; items: { state: string; effect: string }[]; plain?: true }
);

export interface GuidelineSection {
  id: GuidelineSectionId;
  title: string;
  summary: string;
  entries: GuidelineEntry[];
}
