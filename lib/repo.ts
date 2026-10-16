// Data access interface (PRD §7: every read/write goes through here).
// Implementation: lib/repo-lowdb.ts. Server code gets the singleton from lib/repo-server.ts.

import type {
  Channel, Db, Expression, Job, JobKind, Profile, Project, RobotDevice, RobotType, SavedExpression, Settings, Share,
  Signature, Structure, TeamMember, UserDataMotion,
} from "./models";

export type ErrorCode =
  | "VALIDATION" | "NOT_FOUND" | "CONFLICT" | "EXPIRED" | "LOCKED" | "PASSWORD_REQUIRED" | "WRONG_PASSWORD"
  | "TOO_LARGE" | "UNSUPPORTED";

export const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400, NOT_FOUND: 404, CONFLICT: 409, EXPIRED: 410, LOCKED: 423, PASSWORD_REQUIRED: 401,
  WRONG_PASSWORD: 401, TOO_LARGE: 413, UNSUPPORTED: 415,
};

export class RepoError extends Error {
  constructor(readonly code: ErrorCode, message: string) {
    super(message);
  }
  get status(): number {
    return ERROR_STATUS[this.code];
  }
}

export type NewProject = { name: string; type: RobotType; source: Structure["source"]; status?: Project["status"] };
export type SignatureDraft = Omit<Signature, "id" | "version" | "createdAt">;
export type NewExpression = Omit<Expression, "id" | "projectId" | "version" | "history" | "createdAt">;
export type NewShare = { expressionIds: string[]; days?: number; password?: string; allowDownload: boolean };
export type ShareState = "ok" | "password" | "expired" | "locked";
export type UserDataQuery = { tab?: "all" | "popular" | "recent" | "uploaded"; category?: string; q?: string };
export type JobPatch = Partial<Pick<Job, "status" | "progress" | "step" | "stepLabel" | "result" | "error" | "errorCode">>;

export interface Repo {
  projects: {
    list(filter?: { channels?: Channel[] }): Promise<Project[]>;
    get(id: string): Promise<Project>;
    create(input: NewProject): Promise<Project>;
    update(id: string, patch: Partial<Pick<Project, "name" | "status" | "progress" | "channelsUsed">>): Promise<Project>;
    duplicate(id: string): Promise<Project>;
    delete(id: string): Promise<void>;
    /** Edit limits can only narrow: the rig ranges must stay as stored. */
    setStructure(id: string, structure: Structure): Promise<Project>;
  };
  signatures: {
    list(projectId: string): Promise<Signature[]>;
    current(projectId: string): Promise<Signature | null>;
    addVersion(projectId: string, draft: SignatureDraft): Promise<Signature>;
    /** Restoring copies an old version into a new one (history is never rewritten). */
    restore(projectId: string, version: number): Promise<Signature>;
  };
  expressions: {
    listByProject(projectId: string): Promise<Expression[]>;
    get(id: string): Promise<Expression>;
    create(projectId: string, input: NewExpression): Promise<Expression>;
    update(id: string, patch: Partial<NewExpression>): Promise<Expression>;
    delete(id: string): Promise<void>;
  };
  library: {
    list(): Promise<SavedExpression[]>;
    save(expressionId: string, name?: string): Promise<SavedExpression>;
    delete(id: string): Promise<void>;
  };
  shares: {
    create(input: NewShare): Promise<Share>;
    get(id: string): Promise<Share>;
    state(id: string): Promise<ShareState>;
    unlock(id: string, password: string): Promise<Share>;
    /** Expressions in a share (library or project expressions). */
    contents(id: string): Promise<Expression[]>;
  };
  userData: {
    list(query?: UserDataQuery): Promise<UserDataMotion[]>;
    get(id: string): Promise<UserDataMotion>;
    markUsed(id: string): Promise<UserDataMotion>;
  };
  profile: {
    get(): Promise<Profile>;
    update(patch: Partial<Pick<Profile, "name" | "company">>): Promise<Profile>;
    invite(emails: string[], role: TeamMember["role"]): Promise<Profile>;
    setRole(email: string, role: TeamMember["role"]): Promise<Profile>;
    remove(email: string): Promise<Profile>;
  };
  robots: { list(): Promise<RobotDevice[]> };
  settings: {
    get(): Promise<Settings>;
    update(patch: Partial<Settings>): Promise<Settings>;
  };
  jobs: {
    create(kind: JobKind, projectId: string | null, input: unknown): Promise<Job>;
    get(id: string): Promise<Job>;
    update(id: string, patch: JobPatch): Promise<Job>;
    list(filter?: { projectId?: string; active?: boolean }): Promise<Job[]>;
  };
  dev: {
    dump(): Promise<Db>;
    reset(): Promise<void>;
  };
}
