// Guideline tree in the lab sidebar on template pages (Figma W03-4L 808:1594, W03-8L 886:1706 "Side nav").
// path is relative to the guideline base; items without a path have no page yet and render as plain text.
// A group's children show only while one of them (or the group) is the current page.

export interface GuidelineNavItem {
  label: string;
  path?: string;
  /** small uppercase divider instead of a page */
  tag?: true;
}

export interface GuidelineNavGroup extends GuidelineNavItem {
  children?: GuidelineNavItem[];
}

export const GUIDELINE_NAV: GuidelineNavGroup[] = [
  { label: "Foundations", path: "overview" },
  { label: "Principle", path: "principles" },
  { label: "Primitive", path: "primitive-tokens" },
  {
    label: "Components",
    path: "behavior",
    children: [
      { label: "Overview", path: "behavior" },
      { label: "Approach", path: "primitive-tokens/approach" },
      { label: "Bow" },
      { label: "Close" },
      { label: "Curious" },
      { label: "Doze" },
      { label: "Fear" },
      { label: "Joy" },
      { label: "Keep distance" },
      { label: "Laugh" },
      { label: "Nod", path: "behavior/nod-yes" },
      { label: "Point" },
      { label: "Rub" },
      { label: "Sad" },
      { label: "Shake", path: "behavior/head-shake" },
      { label: "Stretch", path: "behavior/stretch" },
      { label: "Surprise" },
      { label: "REJECTED", tag: true },
      { label: "Emphasis" },
    ],
  },
  {
    label: "Patterns",
    path: "situation",
    children: [
      { label: "Face to Face", path: "situation/face-to-face" },
      { label: "Touching", path: "situation/touching" },
      { label: "Calling", path: "situation/calling" },
      { label: "Moving" },
      { label: "Pass Away", path: "situation/passing-by" },
      { label: "Leave" },
      { label: "By your side", path: "situation/side-by-side" },
    ],
  },
  { label: "Templates", path: "templates" },
  { label: "Style" },
  { label: "Download" },
];
