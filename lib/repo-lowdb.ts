// lowdb implementation of Repo. Storage, clock and upload cleanup are injected so tests
// run on memory with a fake clock.

import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { Low, type Adapter } from "lowdb";
import type { Channel, Db, Expression, Job, Project, SavedExpression, Signature, UserDataMotion } from "./models";
import {
  RepoError,
  type JobPatch,
  type NewExpression,
  type NewProject,
  type NewShare,
  type Repo,
  type ShareState,
  type SignatureDraft,
  type UserDataQuery,
} from "./repo";

export interface LowRepoOptions {
  now?: () => Date;
  seed: () => Db;
  /** Called after a project is deleted (remove data/uploads/{id}). */
  removeUploads?: (projectId: string) => Promise<void>;
  /** Called on dev reset (empty data/uploads). */
  clearUploads?: () => Promise<void>;
}

const DAY = 86_400_000;
export const SHARE_DEFAULT_DAYS = 7;
export const SHARE_MAX_ATTEMPTS = 5;
export const SHARE_LOCK_MS = 5 * 60_000;
export const INVITE_DAYS = 7;

const shortId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 32).toString("hex")}`;
}

function checkPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function found<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new RepoError("NOT_FOUND", `${what} not found`);
  return value;
}

function channelsOf(e: Expression): Channel[] {
  const out: Channel[] = ["motion"];
  if (e.face.preset) out.push("face");
  if (e.sound.cues.length > 0) out.push("sound");
  return out;
}

export class LowRepo implements Repo {
  private readonly db: Low<Db>;
  private readonly now: () => Date;
  private loaded: Promise<void> | null = null;
  /** Writes run one at a time. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly adapter: Adapter<Db>, private readonly opts: LowRepoOptions) {
    this.db = new Low<Db>(adapter, opts.seed());
    this.now = opts.now ?? (() => new Date());
  }

  private iso(offsetMs = 0): string {
    return new Date(this.now().getTime() + offsetMs).toISOString();
  }

  /** First access: load the file, seed it if missing. */
  private load(): Promise<void> {
    this.loaded ??= (async () => {
      // Low.read() keeps the default when the file is missing, so ask the adapter directly.
      const existing = await this.adapter.read();
      if (existing) this.db.data = existing;
      else await this.db.write();
    })();
    return this.loaded;
  }

  private async read(): Promise<Db> {
    await this.load();
    return this.db.data;
  }

  private write<T>(fn: (data: Db) => T | Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      await this.load();
      const result = await fn(this.db.data);
      await this.db.write();
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  // ---------------------------------------------------------------- projects

  projects: Repo["projects"] = {
    list: async (filter = {}) => {
      const data = await this.read();
      const want = filter.channels ?? [];
      return data.projects
        .filter((p) => want.every((c) => p.channelsUsed.includes(c)))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    get: async (id) => found((await this.read()).projects.find((p) => p.id === id), "Project"),
    create: (input: NewProject) =>
      this.write((data) => {
        const project: Project = {
          id: shortId("p"),
          name: input.name,
          type: input.type,
          status: input.status ?? "analyzing",
          progress: 0,
          signatureHistory: [],
          channelsUsed: [],
          updatedAt: this.iso(),
        };
        data.projects.push(project);
        return project;
      }),
    update: (id, patch) =>
      this.write((data) => {
        const project = found(data.projects.find((p) => p.id === id), "Project");
        Object.assign(project, patch, { updatedAt: this.iso() });
        return project;
      }),
    duplicate: (id) =>
      this.write((data) => {
        const source = found(data.projects.find((p) => p.id === id), "Project");
        const copy: Project = { ...structuredClone(source), id: shortId("p"), name: `${source.name} copy`, updatedAt: this.iso() };
        data.projects.push(copy);
        for (const e of data.expressions.filter((x) => x.projectId === id)) {
          data.expressions.push({ ...structuredClone(e), id: shortId("e"), projectId: copy.id });
        }
        return copy;
      }),
    delete: async (id) => {
      await this.write((data) => {
        found(data.projects.find((p) => p.id === id), "Project");
        data.projects = data.projects.filter((p) => p.id !== id);
        data.expressions = data.expressions.filter((e) => e.projectId !== id);
        data.jobs = data.jobs.filter((j) => j.projectId !== id);
      });
      await this.opts.removeUploads?.(id);
    },
    setStructure: (id, structure) =>
      this.write((data) => {
        const project = found(data.projects.find((p) => p.id === id), "Project");
        const stored = project.structure;
        if (stored) {
          for (const joint of structure.joints) {
            const rig = stored.joints.find((j) => j.id === joint.id);
            if (!rig) throw new RepoError("CONFLICT", `Unknown joint ${joint.id}`);
            if (joint.rigMin !== rig.rigMin || joint.rigMax !== rig.rigMax) {
              throw new RepoError("CONFLICT", `Rig range of ${joint.id} can't change`);
            }
          }
        }
        project.structure = structure;
        project.updatedAt = this.iso();
        return project;
      }),
  };

  // ---------------------------------------------------------------- signatures

  signatures: Repo["signatures"] = {
    list: async (projectId) => (await this.projects.get(projectId)).signatureHistory,
    current: async (projectId) => {
      const p = await this.projects.get(projectId);
      return p.signatureHistory.find((s) => s.id === p.signatureId) ?? null;
    },
    addVersion: (projectId, draft: SignatureDraft) =>
      this.write((data) => this.pushSignature(data, projectId, draft)),
    restore: (projectId, version) =>
      this.write((data) => {
        const project = found(data.projects.find((p) => p.id === projectId), "Project");
        const old = found(project.signatureHistory.find((s) => s.version === version), `Signature v0.${version}`);
        const { id: _id, version: _v, createdAt: _c, ...draft } = structuredClone(old);
        return this.pushSignature(data, projectId, { ...draft, note: `Restored from v0.${version}` });
      }),
  };

  private pushSignature(data: Db, projectId: string, draft: SignatureDraft): Signature {
    const project = found(data.projects.find((p) => p.id === projectId), "Project");
    const version = project.signatureHistory.reduce((max, s) => Math.max(max, s.version), 0) + 1;
    const signature: Signature = { ...draft, id: `sig-${projectId}-${version}`, version, createdAt: this.iso() };
    project.signatureHistory.push(signature);
    project.signatureId = signature.id;
    project.updatedAt = this.iso();
    return signature;
  }

  // ---------------------------------------------------------------- expressions

  expressions: Repo["expressions"] = {
    listByProject: async (projectId) =>
      (await this.read()).expressions
        .filter((e) => e.projectId === projectId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    get: async (id) => found((await this.read()).expressions.find((e) => e.id === id), "Expression"),
    create: (projectId, input: NewExpression) =>
      this.write((data) => {
        const project = found(data.projects.find((p) => p.id === projectId), "Project");
        const expression: Expression = { ...input, id: shortId("e"), projectId, version: 1, history: [], createdAt: this.iso() };
        data.expressions.push(expression);
        project.updatedAt = this.iso();
        return expression;
      }),
    update: (id, patch) =>
      this.write((data) => {
        const e = found(data.expressions.find((x) => x.id === id), "Expression");
        const { history, ...snapshot } = structuredClone(e);
        Object.assign(e, patch, { version: e.version + 1, history: [...history, { ...snapshot, history: [] }] });
        const project = data.projects.find((p) => p.id === e.projectId);
        if (project) project.updatedAt = this.iso();
        return e;
      }),
    delete: (id) =>
      this.write((data) => {
        found(data.expressions.find((e) => e.id === id), "Expression");
        data.expressions = data.expressions.filter((e) => e.id !== id);
      }),
  };

  // ---------------------------------------------------------------- library

  library: Repo["library"] = {
    list: async () => [...(await this.read()).library].sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    save: (expressionId, name) =>
      this.write((data) => {
        const e = found(data.expressions.find((x) => x.id === expressionId), "Expression");
        const saved: SavedExpression = {
          ...structuredClone(e),
          id: shortId("lib"),
          name: name ?? e.name,
          history: [],
          savedAt: this.iso(),
          channels: channelsOf(e),
        };
        data.library.push(saved);
        return saved;
      }),
    delete: (id) =>
      this.write((data) => {
        found(data.library.find((e) => e.id === id), "Library item");
        data.library = data.library.filter((e) => e.id !== id);
      }),
  };

  // ---------------------------------------------------------------- shares

  shares: Repo["shares"] = {
    create: (input: NewShare) =>
      this.write((data) => {
        const items = input.expressionIds.map((id) =>
          found(data.library.find((e) => e.id === id) ?? data.expressions.find((e) => e.id === id), `Expression ${id}`),
        );
        const first = items[0];
        const project = first ? data.projects.find((p) => p.id === first.projectId) : undefined;
        const share = {
          id: randomBytes(6).toString("base64url"),
          expressionIds: input.expressionIds,
          signatureVersion: first?.signatureSnapshot.version ?? 1,
          type: project?.type ?? "joint-fixed",
          expiresAt: this.iso((input.days ?? SHARE_DEFAULT_DAYS) * DAY),
          passwordHash: input.password ? hashPassword(input.password) : undefined,
          allowDownload: input.allowDownload,
          attempts: 0,
          createdAt: this.iso(),
        };
        data.shares.push(share);
        return share;
      }),
    get: async (id) => found((await this.read()).shares.find((s) => s.id === id), "Share link"),
    state: async (id): Promise<ShareState> => {
      const s = await this.shares.get(id);
      const now = this.now().toISOString();
      if (s.expiresAt <= now) return "expired";
      if (s.lockedUntil && s.lockedUntil > now) return "locked";
      return s.passwordHash ? "password" : "ok";
    },
    unlock: (id, password) =>
      this.write((data) => {
        const s = found(data.shares.find((x) => x.id === id), "Share link");
        const now = this.now().toISOString();
        if (s.expiresAt <= now) throw new RepoError("EXPIRED", "This link has expired");
        if (s.lockedUntil && s.lockedUntil > now) throw new RepoError("LOCKED", "Too many attempts");
        if (!s.passwordHash || checkPassword(password, s.passwordHash)) {
          s.attempts = 0;
          s.lockedUntil = undefined;
          return s;
        }
        s.attempts += 1;
        if (s.attempts >= SHARE_MAX_ATTEMPTS) {
          s.attempts = 0;
          s.lockedUntil = this.iso(SHARE_LOCK_MS);
          // Persist the lock even though we throw.
          return { locked: true as const };
        }
        return { wrong: true as const };
      }).then((r) => {
        if ("locked" in r) throw new RepoError("LOCKED", "Too many attempts");
        if ("wrong" in r) throw new RepoError("WRONG_PASSWORD", "Wrong password");
        return r;
      }),
    contents: async (id) => {
      const data = await this.read();
      const s = found(data.shares.find((x) => x.id === id), "Share link");
      return s.expressionIds
        .map((eid) => data.library.find((e) => e.id === eid) ?? data.expressions.find((e) => e.id === eid))
        .filter((e): e is Expression => e !== undefined);
    },
  };

  // ---------------------------------------------------------------- user data

  userData: Repo["userData"] = {
    list: async (query: UserDataQuery = {}) => {
      const data = await this.read();
      const q = query.q?.trim().toLowerCase();
      let list: UserDataMotion[] = data.userData.filter(
        (u) => (!query.category || u.category === query.category) && (!q || u.name.toLowerCase().includes(q)),
      );
      if (query.tab === "popular") list = [...list].sort((a, b) => b.uses - a.uses);
      if (query.tab === "recent") list = [...list].reverse();
      if (query.tab === "uploaded") list = list.filter((u) => u.source === "user");
      return list;
    },
    get: async (id) => found((await this.read()).userData.find((u) => u.id === id), "Motion"),
    markUsed: (id) =>
      this.write((data) => {
        const u = found(data.userData.find((x) => x.id === id), "Motion");
        u.uses += 1;
        return u;
      }),
  };

  // ---------------------------------------------------------------- profile

  profile: Repo["profile"] = {
    get: async () => (await this.read()).profile,
    update: (patch) =>
      this.write((data) => {
        if (patch.name !== undefined && (patch.name.length < 1 || patch.name.length > 20)) {
          throw new RepoError("VALIDATION", "Name must be 1–20 characters");
        }
        const owner = data.profile.team.find((m) => m.email === data.profile.email);
        Object.assign(data.profile, patch);
        if (owner && patch.name) owner.name = patch.name;
        return data.profile;
      }),
    invite: (emails, role) =>
      this.write((data) => {
        for (const email of emails) {
          if (data.profile.team.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
            throw new RepoError("CONFLICT", `${email} is already on the team`);
          }
        }
        for (const email of emails) {
          data.profile.team.push({ name: email.split("@")[0], email, role, pending: true, expiresAt: this.iso(INVITE_DAYS * DAY) });
        }
        return data.profile;
      }),
    setRole: (email, role) =>
      this.write((data) => {
        const member = found(data.profile.team.find((m) => m.email === email), "Team member");
        if (member.role === "Owner") throw new RepoError("CONFLICT", "The owner's role can't change");
        member.role = role;
        return data.profile;
      }),
    remove: (email) =>
      this.write((data) => {
        const member = found(data.profile.team.find((m) => m.email === email), "Team member");
        if (member.role === "Owner") throw new RepoError("CONFLICT", "The owner can't be removed");
        data.profile.team = data.profile.team.filter((m) => m.email !== email);
        return data.profile;
      }),
  };

  robots: Repo["robots"] = { list: async () => (await this.read()).robots };

  settings: Repo["settings"] = {
    get: async () => (await this.read()).settings,
    update: (patch) =>
      this.write((data) => {
        Object.assign(data.settings, patch);
        return data.settings;
      }),
  };

  // ---------------------------------------------------------------- jobs

  jobs: Repo["jobs"] = {
    create: (kind, projectId, input) =>
      this.write((data) => {
        const job: Job = {
          id: shortId("job"), kind, projectId, status: "queued", progress: 0, step: 0, input,
          createdAt: this.iso(), updatedAt: this.iso(),
        };
        data.jobs.push(job);
        return job;
      }),
    get: async (id) => found((await this.read()).jobs.find((j) => j.id === id), "Job"),
    update: (id, patch: JobPatch) =>
      this.write((data) => {
        const job = found(data.jobs.find((j) => j.id === id), "Job");
        Object.assign(job, patch, { updatedAt: this.iso() });
        return job;
      }),
    list: async (filter = {}) =>
      (await this.read()).jobs.filter(
        (j) =>
          (!filter.projectId || j.projectId === filter.projectId) &&
          (!filter.active || j.status === "queued" || j.status === "running"),
      ),
  };

  // ---------------------------------------------------------------- dev

  dev: Repo["dev"] = {
    dump: () => this.read(),
    reset: async () => {
      await this.write((data) => {
        Object.assign(data, this.opts.seed());
      });
      await this.opts.clearUploads?.();
    },
  };
}
