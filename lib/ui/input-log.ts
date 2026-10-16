import type { Reference } from "@/lib/models";

/** One Generate in the editor Context: what the user typed and attached. */
export interface InputEntry {
  id: string;
  at: string;
  text: string;
  attachments: Reference[];
}

export const MAX_INPUTS = 50;
export const LOG_VISIBLE = 3;

type WithRefs = { references: Reference[]; inputs: InputEntry[] };

/** Newest first, bounded. */
export function logInput<T extends WithRefs>(c: T, entry: InputEntry): T {
  return { ...c, references: [], inputs: [entry, ...c.inputs].slice(0, MAX_INPUTS) };
}

/** Patch an attachment wherever it is: the tray or a logged input. */
export function withRef<T extends WithRefs>(c: T, id: string, patch: Partial<Reference>): T {
  const fix = (rs: Reference[]) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r));
  return { ...c, references: fix(c.references), inputs: c.inputs.map((i) => ({ ...i, attachments: fix(i.attachments) })) };
}

/** Current Status = latest input; the log shows the rest, LOG_VISIBLE until expanded. */
export function splitLog(inputs: InputEntry[], expanded: boolean): { latest: InputEntry | undefined; shown: InputEntry[]; hidden: number } {
  const [latest, ...older] = inputs;
  return { latest, shown: expanded ? older : older.slice(0, LOG_VISIBLE), hidden: expanded ? 0 : Math.max(older.length - LOG_VISIBLE, 0) };
}
