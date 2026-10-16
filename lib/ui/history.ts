/** Change chips + Cmd+Z: a bounded stack of labelled before/after states. */
export interface Change<T> {
  id: number;
  label: string;
  before: T;
  after: T;
}

export interface History<T> {
  changes: Change<T>[];
  nextId: number;
}

export const MAX_CHANGES = 50;

export function emptyHistory<T>(): History<T> {
  return { changes: [], nextId: 1 };
}

export function pushChange<T>(h: History<T>, label: string, before: T, after: T): History<T> {
  const changes = [...h.changes, { id: h.nextId, label, before, after }].slice(-MAX_CHANGES);
  return { changes, nextId: h.nextId + 1 };
}

/** Undo the latest change: returns the state to restore, or null when there is nothing to undo. */
export function undoChange<T>(h: History<T>): { history: History<T>; restore: T; change: Change<T> } | null {
  const change = h.changes.at(-1);
  if (!change) return null;
  return { history: { ...h, changes: h.changes.slice(0, -1) }, restore: change.before, change };
}

/** "Speed 85 → 60" for each field that differs. */
export function describeChange<T extends Record<string, number>>(before: T, after: T, labels: Partial<Record<keyof T, string>>): string {
  return (Object.keys(after) as (keyof T)[])
    .filter((k) => before[k] !== after[k])
    .map((k) => `${labels[k] ?? String(k)} ${Math.round(before[k])} → ${Math.round(after[k])}`)
    .join(", ");
}

const num = (v: number, digits: number) => (Number.isInteger(v) && digits === 0 ? String(v) : v.toFixed(digits));

/** "Brow angle −12 → −6" style labels with per-field precision. */
export function describeFields<T extends Record<string, unknown>>(
  before: T,
  after: T,
  fields: Partial<Record<keyof T, { label: string; digits?: number }>>,
): string[] {
  const out: string[] = [];
  for (const k of Object.keys(fields) as (keyof T)[]) {
    const a = before[k];
    const b = after[k];
    if (a === b) continue;
    const f = fields[k]!;
    if (typeof a === "number" && typeof b === "number") {
      const d = f.digits ?? 0;
      if (num(a, d) !== num(b, d)) out.push(`${f.label} ${num(a, d)} → ${num(b, d)}`);
    } else out.push(`${f.label} ${String(a ?? "—")} → ${String(b ?? "—")}`);
  }
  return out;
}
