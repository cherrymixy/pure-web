// Reference sets (concept): what the AI "referenced" for each behavior — a face, a motion and a sound
// from Wikimedia Commons (CC0 / PD / CC BY / CC BY-SA), stored under public/reference-sets/.
// Shown with generated expressions so people can see where the expression came from.

export type ReferenceChannel = "face" | "motion" | "sound";

export interface ReferenceItem {
  channel: ReferenceChannel;
  title: string;
  /** What the AI took from it */
  note: string;
  /** Public path: image (.jpg/.png), video (.webm) or audio (.ogg) */
  file: string;
  poster: string | null;
  source: { title: string; page: string; author: string; license: string; excerpt: string };
}

export interface ReferenceSet {
  behavior: string;
  items: ReferenceItem[];
}

export const REFERENCE_SETS: ReferenceSet[] = [];

export function referenceSetFor(behavior: string): ReferenceSet | undefined {
  return REFERENCE_SETS.find((s) => s.behavior === behavior);
}
