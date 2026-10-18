// Guideline tree in the lab sidebar on component pages (Figma W03-4L 808:1594 "Side nav").
// path is relative to the guideline base; items without a path have no page yet and render as plain text.

export interface GuidelineNavItem {
  label: string;
  /** 0 = group, 1 = page under a group, "tag" = small uppercase divider */
  level: 0 | 1 | "tag";
  path?: string;
}

export const GUIDELINE_NAV: GuidelineNavItem[] = [
  { label: "Foundations", level: 0, path: "overview" },
  { label: "Principle", level: 0, path: "principles" },
  { label: "Primitive", level: 0, path: "primitive-tokens" },
  { label: "Components", level: 0, path: "behavior" },
  { label: "Overview", level: 1, path: "behavior" },
  { label: "Approach", level: 1, path: "primitive-tokens/approach" },
  { label: "Bow", level: 1 },
  { label: "Close", level: 1 },
  { label: "Curious", level: 1 },
  { label: "Doze", level: 1 },
  { label: "Fear", level: 1 },
  { label: "Joy", level: 1 },
  { label: "Keep distance", level: 1 },
  { label: "Laugh", level: 1 },
  { label: "Nod", level: 1, path: "behavior/nod-yes" },
  { label: "Point", level: 1 },
  { label: "Rub", level: 1 },
  { label: "Sad", level: 1 },
  { label: "Shake", level: 1, path: "behavior/head-shake" },
  { label: "Stretch", level: 1, path: "behavior/stretch" },
  { label: "Surprise", level: 1 },
  { label: "REJECTED", level: "tag" },
  { label: "Emphasis", level: 1 },
  { label: "Patterns", level: 0, path: "situation" },
  { label: "Templates", level: 0, path: "templates" },
  { label: "Style", level: 0 },
  { label: "Download", level: 0 },
];
