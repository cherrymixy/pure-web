import os from "node:os";
import path from "node:path";

// Server-side storage locations (git-ignored). Uploads never leave this folder (docs/conventions.md rule 15).
// On Vercel the project folder is read-only: the DB and uploads live in the instance's temp folder
// instead (seeded on first use, reset whenever the instance is recycled — fine for a shared demo).
export const DATA_DIR = process.env.VERCEL ? path.join(os.tmpdir(), "pure-data") : path.join(process.cwd(), "data");
export const DB_FILE = path.join(DATA_DIR, "db.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

/** Absolute path of an upload, or null when `rel` would leave `root` (path traversal). */
export function resolveUpload(rel: string, root = UPLOADS_DIR): string | null {
  const base = path.resolve(root);
  const abs = path.resolve(base, rel);
  return abs.startsWith(base + path.sep) ? abs : null;
}
