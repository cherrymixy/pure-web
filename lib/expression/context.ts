import { componentOf } from "@/data/components";
import type { Db } from "../models";

// Context saved before the guideline v3 ids: component chips were simulator behaviors
// and patterns had the old situation names. Recipe steps keep simulator behavior names.

const OLD_COMPONENTS: Record<string, string | null> = {
  happy: "joy",
  greet: "bow",
  alert: "surprise",
  wake: "stretch",
  sleep: "doze",
  idle: null,
  look_around: null,
  sweep: null,
  focus: null,
  home: null,
};

const OLD_PATTERNS: Record<string, string> = {
  "side-by-side": "by-your-side",
  "at-a-distance": "by-your-side",
  alone: "by-your-side",
  "passing-by": "pass-by",
};

export function migrateComponents(ids: string[]): string[] {
  const out = ids.map((id) => (id in OLD_COMPONENTS ? OLD_COMPONENTS[id] : id)).filter((id): id is string => !!id && !!componentOf(id));
  return [...new Set(out)];
}

export const migratePattern = (id: string): string => OLD_PATTERNS[id] ?? id;

type Holder = { components?: string[]; pattern?: string; history?: Holder[] };
const migrateHolder = (e: Holder): void => {
  if (Array.isArray(e.components)) e.components = migrateComponents(e.components);
  if (typeof e.pattern === "string") e.pattern = migratePattern(e.pattern);
  e.history?.forEach(migrateHolder);
};

/** Repo load migration: expressions, library and generate-job inputs. */
export function migrateDbContext(db: Db): void {
  db.expressions.forEach(migrateHolder);
  db.library.forEach(migrateHolder);
  db.jobs.forEach((j) => {
    if (j.input && typeof j.input === "object") migrateHolder(j.input as Holder);
  });
}
