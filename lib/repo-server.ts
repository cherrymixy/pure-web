import "server-only";
import { mkdirSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { JSONFile } from "lowdb/node";
import { addMissingSeedMotions, addMissingSeedProjects, seedDb } from "@/data/seed";
import type { Db } from "./models";
import { DATA_DIR, UPLOADS_DIR, DB_FILE } from "./paths";
import type { Repo } from "./repo";
import { LowRepo } from "./repo-lowdb";
import { fitDbToRig } from "./robot/rig";
import { migrateDbFaces } from "./expression/face";
import { migrateDbSounds } from "./expression/sound";

// One repo per server process. Route bundles can load this module more than once in dev,
// so the instance lives on globalThis.
const g = globalThis as typeof globalThis & { __pureRepo?: Repo };

export function getRepo(): Repo {
  if (!g.__pureRepo) mkdirSync(DATA_DIR, { recursive: true });
  g.__pureRepo ??= new LowRepo(new JSONFile<Db>(DB_FILE), {
    seed: seedDb,
    migrate: (db) => {
      fitDbToRig(db);
      migrateDbFaces(db);
      migrateDbSounds(db);
      addMissingSeedMotions(db);
      addMissingSeedProjects(db);
    },
    removeUploads: (projectId) => fs.rm(path.join(UPLOADS_DIR, projectId), { recursive: true, force: true }),
    clearUploads: async () => {
      await fs.rm(UPLOADS_DIR, { recursive: true, force: true });
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
    },
  });
  return g.__pureRepo;
}
