import { REFERENCE_SETS, type ReferenceChannel, type ReferenceSet } from "@/data/reference-sets";

export interface ReferenceCredit {
  behavior: string;
  channel: ReferenceChannel;
  title: string;
  note: string;
  source: { title: string; page: string; author: string; license: string; excerpt: string };
}

/** What the AI referenced for these behaviors (recipe order, each behavior once) — shown in the UI and credited in pure.json. */
export function referenceCredits(behaviors: string[], sets: ReferenceSet[] = REFERENCE_SETS): ReferenceCredit[] {
  return [...new Set(behaviors)].flatMap((behavior) =>
    (sets.find((s) => s.behavior === behavior)?.items ?? []).map(({ channel, title, note, source }) => ({ behavior, channel, title, note, source })),
  );
}
