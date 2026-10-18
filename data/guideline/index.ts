import type { GuidelineEntry, GuidelineSection } from "./types";
import { overview } from "./overview";
import { principles } from "./principles";
import { primitiveTokens } from "./primitive-tokens";
import { behavior } from "./behavior";
import { situation } from "./situation";
import { templates } from "./templates";
import { style } from "./style";
import { validation } from "./validation";

// Order = PURE guideline final structure v3: Foundation (overview · principles · primitives) → Component → Pattern → Template → Style → Validation.
export const GUIDELINE: GuidelineSection[] = [
  overview,
  principles,
  primitiveTokens,
  behavior,
  situation,
  templates,
  style,
  validation,
];

export function findEntry(section: string, slug: string): GuidelineEntry | undefined {
  return GUIDELINE.find((s) => s.id === section)?.entries.find((e) => e.slug === slug);
}

export function countEntries(): { section: string; entries: number; placeholders: number }[] {
  return GUIDELINE.map((s) => ({
    section: s.id,
    entries: s.entries.length,
    placeholders: s.entries.filter((e) => e.placeholder).length,
  }));
}

/** Guideline routes (all on the doc template — they get the guideline tree in the lab sidebar). */
export function docPaths(base: string): string[] {
  return [base, ...GUIDELINE.flatMap((s) => [`${base}/${s.id}`, ...s.entries.map((e) => `${base}/${s.id}/${e.slug}`)])];
}

export interface GuidelineSearchItem {
  href: string;
  title: string;
  section: string;
  /** lowercased title · ref · summary · doc section titles */
  text: string;
}

/** Guideline-wide search index (doc page search box): every section and entry. */
export function searchIndex(base: string): GuidelineSearchItem[] {
  return GUIDELINE.flatMap((s) => [
    { href: `${base}/${s.id}`, title: s.title, section: "", text: `${s.title} ${s.summary}`.toLowerCase() },
    ...s.entries.map((e) => ({
      href: `${base}/${s.id}/${e.slug}`,
      title: e.title,
      section: s.title,
      text: [e.title, e.ref, e.summary, ...(e.doc?.rows.flat().map((r) => r.title) ?? [])].filter(Boolean).join(" ").toLowerCase(),
    })),
  ]);
}
