import os from "node:os";
import path from "node:path";

// Server-side storage locations (git-ignored). Uploads never leave this folder (CLAUDE.md rule 15).
// On Vercel the project folder is read-only: the DB and uploads live in the instance's temp folder
// instead (seeded on first use, reset whenever the instance is recycled — fine for a shared demo).
export const DATA_DIR = process.env.VERCEL ? path.join(os.tmpdir(), "pure-data") : path.join(process.cwd(), "data");
export const DB_FILE = path.join(DATA_DIR, "db.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
