// Guideline tree (PURE guideline final structure v3 hierarchy) in the lab sidebar on template pages (Figma W03-4L 808:1594, W03-8L 886:1706 "Side nav").
// path is relative to the guideline base; items without a path have no page yet and render as plain text.
// A group's children show only while one of them (or the group) is the current page.

import { overview } from "./overview";
import { primitiveTokens } from "./primitive-tokens";
import { style } from "./style";
import { templates } from "./templates";
import type { GuidelineSection } from "./types";
import { validation } from "./validation";

export interface GuidelineNavItem {
  label: string;
  path?: string;
  /** small uppercase divider instead of a page */
  tag?: true;
}

export interface GuidelineNavGroup extends GuidelineNavItem {
  children?: GuidelineNavItem[];
}

/** Groups without a Figma list show their section's pages in data order */
const pagesOf = (s: GuidelineSection): GuidelineNavItem[] => s.entries.map((e) => ({ label: e.title, path: `${s.id}/${e.slug}` }));

export const GUIDELINE_NAV: GuidelineNavGroup[] = [
  { label: "Foundations", path: "overview", children: pagesOf(overview) },
  {
    // Figma 886:2045…2056 (Principle children in the side nav)
    label: "Principle",
    path: "principles",
    children: [
      { label: "Animation", path: "principles/animation" },
      { label: "Face UI", path: "principles/face" },
      { label: "Sound Effect", path: "principles/sound" },
      { label: "Physical AI", path: "principles/body" },
      { label: "Common", path: "principles/common" },
      // not in the Figma tree, kept reachable
      { label: "Semantic", path: "principles/semantic" },
      { label: "Guardrails", path: "principles/guardrails" },
      { label: "Combination rules", path: "principles/combination-rules" },
    ],
  },
  { label: "Primitive", path: "primitive-tokens", children: pagesOf(primitiveTokens) },
  {
    label: "Components",
    path: "behavior",
    children: [
      { label: "Overview", path: "behavior" },
      { label: "Component spec", path: "behavior/component-spec" },
      { label: "Nod", path: "behavior/nod" },
      { label: "Shake", path: "behavior/shake" },
      { label: "Bow", path: "behavior/bow" },
      { label: "Doze", path: "behavior/doze" },
      { label: "Point", path: "behavior/point" },
      { label: "Joy", path: "behavior/joy" },
      { label: "Laugh", path: "behavior/laugh" },
      { label: "Sad", path: "behavior/sad" },
      { label: "Surprise", path: "behavior/surprise" },
      { label: "Fear", path: "behavior/fear" },
      { label: "Curious", path: "behavior/curious" },
      { label: "Approach", path: "behavior/approach" },
      { label: "Keep distance", path: "behavior/keep-distance" },
      { label: "Close", path: "behavior/close" },
      { label: "Stretch", path: "behavior/stretch" },
      { label: "Rub", path: "behavior/rub" },
      { label: "REJECTED", tag: true },
      { label: "Emphasis", path: "behavior/emphasis" },
    ],
  },
  {
    label: "Patterns",
    path: "situation",
    children: [
      { label: "Overview", path: "situation" },
      { label: "Pattern spec", path: "situation/pattern-spec" },
      { label: "Face to Face", path: "situation/face-to-face" },
      { label: "Touching", path: "situation/touching" },
      { label: "Calling", path: "situation/calling" },
      { label: "Carried", path: "situation/carried" },
      { label: "Pass By", path: "situation/pass-by" },
      { label: "Leave", path: "situation/leave" },
      { label: "By your side", path: "situation/by-your-side" },
      { label: "PROPOSED", tag: true },
      { label: "Conversation", path: "situation/conversation" },
      { label: "Feedback", path: "situation/feedback" },
      { label: "Guiding", path: "situation/guiding" },
      { label: "Sudden", path: "situation/sudden" },
    ],
  },
  { label: "Templates", path: "templates", children: pagesOf(templates) },
  { label: "Style", path: "style", children: pagesOf(style) },
  { label: "Validation", path: "validation", children: pagesOf(validation) },
  { label: "Download" },
];
