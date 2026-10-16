import path from "node:path";

// Server-side storage locations (git-ignored). Uploads never leave this folder (CLAUDE.md rule 15).
export const DATA_DIR = path.join(process.cwd(), "data");
export const DB_FILE = path.join(DATA_DIR, "db.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
