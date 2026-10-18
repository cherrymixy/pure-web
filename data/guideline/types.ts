// Guideline content shape (W03). Pure data — rendered by the guideline pages.
// Structure: PURE guideline final structure v3 (2026-10-19): Foundation (principles · primitives) → Component → Pattern → Template, then Style and Validation.

export type GuidelineSectionId =
  | "overview"
  | "principles"
  | "primitive-tokens"
  | "behavior"
  | "situation"
  | "templates"
  | "style"
  | "validation";

/** title: starts a new section on the page (doc template); untitled blocks join the section above. */
export type GuidelineBlock = { title?: string } & (
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "code"; lang: string; text: string }
);

export interface GuidelineEntry {
  /** URL segment: /guideline/<section>/<slug> */
  slug: string;
  /** Stable guideline ID with its layer prefix (sp. gr. op. ch. role. tok. cmp. pat. ff. src. robot. style.), when the entry is one item */
  ref?: string;
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
  /** Proposed or awaiting a decision in the source structure (not confirmed yet) */
  proposed?: true;
  /** Pages sharing a group list only each other on the right of the doc page (Face 808:1657…: Common · Motion · Face · Sound) */
  group?: string;
  /** Component-page template (Figma W03-4 550:2490). When set, the entry renders as a component doc instead of body/dos/donts. */
  doc?: ComponentDoc;
}

/** Component-page content (Figma W03-4L 808:1254). Sizes are in 1920 px (Figma 960 frame ×2). */
export interface ComponentDoc {
  breadcrumb: string;
  /** Data ID shown next to the breadcrumb (ch.face, tok.body.tilt …) */
  ref?: string;
  /** Lead paragraph, one string per line */
  lead: string[];
  /** Pills under the lead; omit for none */
  resources?: { label: string; href?: string }[];
  /** Sibling pages listed around "On this page" (Figma 808:1657…1665: Common · Motion · Face › sections · Sound); path relative to the guideline base. [] = none (Approach 808:1277) */
  pages?: { label: string; path: string; current?: true }[];
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
  /** Line(s) under the title; omit for none */
  text?: string;
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
  /** Face principle (Figma W03-2L 808:1649) — illustrations live in components/ui/guideline/face-figures.tsx */
  | { kind: "face-types"; label: string; items: { figure: FaceTypeFigure; title: string; subtitle: string; text: string }[] }
  | {
      kind: "face-change";
      base: string;
      arrow: string;
      variants: { emotion: string; caption: string }[];
      valence: { title: string; bullets: string[]; faces: { name: string; shape: string }[]; orderLabel: string; order: string[] };
    }
  | {
      kind: "face-rhythm";
      /** enter · stay · return */
      phases: { title: string; time: string; note: string }[];
      loops: { title: string; text: string; chips: string[] }[];
    }
  | { kind: "face-transitions"; items: { caption: string; title: string; text: string }[] }
  | { kind: "face-donts"; items: { title: string; text: string }[]; blinkLabels: [string, string] }
  /** Principle pages laid out like Face (808:1649) without a frame of their own — components/ui/guideline/principle-sections.tsx */
  | { kind: "p-cards"; label?: string; columns?: 2 | 3 | 4; items: PrincipleCard[] }
  | { kind: "p-flow"; steps: { label: string; note?: string }[]; caption?: string }
  | { kind: "p-bullets"; heading: string; items: string[]; figure: PrincipleFigure }
  | { kind: "p-phases"; phases: { title: string; time: string; note: string }[]; loops?: { title: string; text: string; chips: string[] }[] }
  | { kind: "p-compare"; items: { figure: PrincipleFigure; caption: string; title: string; text: string }[] }
  | { kind: "p-donts"; items: { title: string; text: string; figure: PrincipleFigure }[] }
  /** Generic entry body (pages without their own Figma frame, laid out like Face) */
  | { kind: "blocks"; blocks: GuidelineBlock[] }
  /** Section landing: one card per page; path relative to the guideline base */
  | { kind: "cards"; items: { title: string; summary: string; path: string; ref?: string; proposed?: boolean }[] }
  /** Pills linking to other pages (Related) */
  | { kind: "links"; items: { title: string; path: string }[] }
);

export type FaceTypeFigure = "none" | "light" | "eyes" | "all";

/** CSS-only figure for principle sections: a large mono label and/or a row of chips (arrows between them when `flow`). */
export interface PrincipleFigure {
  big?: string;
  chips?: string[];
  flow?: true;
}

export interface PrincipleCard {
  title: string;
  subtitle?: string;
  /** mono ID above the title (sp.1, gr.amp_limit …) */
  tag?: string;
  figure?: PrincipleFigure;
  /** info box: label (defaults to the section label) + text */
  infoLabel?: string;
  info?: string;
  proposed?: true;
}

export interface GuidelineSection {
  id: GuidelineSectionId;
  title: string;
  summary: string;
  entries: GuidelineEntry[];
}
