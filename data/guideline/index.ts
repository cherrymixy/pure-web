import type { GuidelineEntry, GuidelineSection } from "./types";
import { overview } from "./overview";
import { principles } from "./principles";
import { primitiveTokens } from "./primitive-tokens";
import { behavior } from "./behavior";
import { situation } from "./situation";
import { robotClasses } from "./robot-classes";
import { templates } from "./templates";

export const GUIDELINE: GuidelineSection[] = [
  overview,
  principles,
  primitiveTokens,
  behavior,
  situation,
  robotClasses,
  templates,
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
