import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Memory } from "lowdb";
import { JSONFile } from "lowdb/node";
import { beforeEach, describe, expect, it } from "vitest";
import { seedDb } from "@/data/seed";
import { PURE_DESK_STRUCTURE } from "@/data/pure-desk";
import type { Db } from "./models";
import { RepoError } from "./repo";
import { LowRepo, SHARE_LOCK_MS } from "./repo-lowdb";

const DAY = 86_400_000;

function setup() {
  let now = new Date("2026-10-16T12:00:00.000Z");
  const clock = { advance: (ms: number) => (now = new Date(now.getTime() + ms)) };
  const repo = new LowRepo(new Memory<Db>(), { seed: seedDb, now: () => now });
  return { repo, clock };
}

const code = async (p: Promise<unknown>) => {
  try {
    await p;
    return null;
  } catch (e) {
    return e instanceof RepoError ? e.code : String(e);
  }
};

describe("LowRepo", () => {
  let t: ReturnType<typeof setup>;
  beforeEach(() => {
    t = setup();
  });

  it("seeds on first access", async () => {
    expect(await t.repo.projects.list()).toHaveLength(5);
    expect(await t.repo.library.list()).toHaveLength(4);
    expect((await t.repo.profile.get()).name).toBe("SeungA Jeon");
  });

  it("saves to disk and loads back (JSONFile)", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pure-db-"));
    const file = path.join(dir, "db.json");
    const a = new LowRepo(new JSONFile<Db>(file), { seed: seedDb });
    const created = await a.projects.create({ name: "Roundtrip", type: "joint-fixed", source: "pure-desk" });
    const b = new LowRepo(new JSONFile<Db>(file), { seed: seedDb });
    expect((await b.projects.get(created.id)).name).toBe("Roundtrip");
    expect(await b.projects.list()).toHaveLength(6);
    await fs.rm(dir, { recursive: true });
  });

  it("lists projects newest first and filters by channel", async () => {
    const all = await t.repo.projects.list();
    expect(all.map((p) => p.updatedAt)).toEqual([...all.map((p) => p.updatedAt)].sort().reverse());
    const sound = await t.repo.projects.list({ channels: ["sound"] });
    expect(sound.map((p) => p.name).sort()).toEqual(["Test- final", "Test-01"]);
  });

  it("increments signature versions; restore makes a new version", async () => {
    const p = await t.repo.projects.create({ name: "Sig", type: "joint-fixed", source: "pure-desk" });
    const draft = { name: "Brand", axes: seedDb().projects[0].signatureHistory[0].axes, tone: ["warm"], mapping: [], sources: [], note: "" };
    const v1 = await t.repo.signatures.addVersion(p.id, draft);
    const v2 = await t.repo.signatures.addVersion(p.id, { ...draft, tone: ["bold"] });
    expect([v1.version, v2.version]).toEqual([1, 2]);
    const v3 = await t.repo.signatures.restore(p.id, 1);
    expect(v3.version).toBe(3);
    expect(v3.tone).toEqual(["warm"]);
    expect((await t.repo.signatures.current(p.id))?.id).toBe(v3.id);
    expect(await t.repo.signatures.list(p.id)).toHaveLength(3);
  });

  it("structure: limits may narrow, rig ranges may not change", async () => {
    const id = "p-test-01";
    const narrowed = { ...PURE_DESK_STRUCTURE, joints: PURE_DESK_STRUCTURE.joints.map((j) => (j.id === "shoulder_pitch" ? { ...j, min: -20, max: 40 } : j)) };
    await t.repo.projects.setStructure(id, narrowed);
    expect((await t.repo.projects.get(id)).structure!.joints[1]).toMatchObject({ min: -20, max: 40 });
    const widened = { ...PURE_DESK_STRUCTURE, joints: PURE_DESK_STRUCTURE.joints.map((j) => (j.id === "shoulder_pitch" ? { ...j, rigMax: 90, max: 90 } : j)) };
    expect(await code(t.repo.projects.setStructure(id, widened))).toBe("CONFLICT");
  });

  it("structure: replace swaps the rig and the project type (new 3D file)", async () => {
    const id = "p-test-01";
    const imported = { ...PURE_DESK_STRUCTURE, type: "joint-walking" as const, source: "import" as const, joints: [{ id: "hip", label: "hip", min: -90, max: 90, rigMin: -90, rigMax: 90 }] };
    const p = await t.repo.projects.setStructure(id, imported, { replace: true });
    expect(p.type).toBe("joint-walking");
    expect(p.structure!.joints.map((j) => j.id)).toEqual(["hip"]);
  });

  it("share links expire after 7 days by default", async () => {
    const s = await t.repo.shares.create({ expressionIds: ["e-sleepy-nod"], allowDownload: true });
    expect(new Date(s.expiresAt).getTime() - new Date("2026-10-16T12:00:00.000Z").getTime()).toBe(7 * DAY);
    expect(await t.repo.shares.state(s.id)).toBe("ok");
    expect((await t.repo.shares.contents(s.id)).map((e) => e.name)).toEqual(["Sleepy nod"]);
    t.clock.advance(7 * DAY);
    expect(await t.repo.shares.state(s.id)).toBe("expired");
    expect(await code(t.repo.shares.unlock(s.id, "x"))).toBe("EXPIRED");
  });

  it("share password: 5 wrong attempts lock for 5 minutes", async () => {
    const s = await t.repo.shares.create({ expressionIds: ["e-sleepy-nod"], password: "pure", allowDownload: false });
    expect(s.passwordHash).not.toContain("pure");
    expect(await t.repo.shares.state(s.id)).toBe("password");
    for (let i = 0; i < 4; i++) expect(await code(t.repo.shares.unlock(s.id, "nope"))).toBe("WRONG_PASSWORD");
    expect(await code(t.repo.shares.unlock(s.id, "nope"))).toBe("LOCKED");
    expect(await t.repo.shares.state(s.id)).toBe("locked");
    expect(await code(t.repo.shares.unlock(s.id, "pure"))).toBe("LOCKED");
    t.clock.advance(SHARE_LOCK_MS);
    expect(await code(t.repo.shares.unlock(s.id, "pure"))).toBeNull();
  });

  it("expression update bumps version and keeps history", async () => {
    const e = await t.repo.expressions.update("e-sleepy-nod", { name: "Sleepier nod" });
    expect(e.version).toBe(2);
    expect(e.history.map((h) => h.name)).toEqual(["Sleepy nod"]);
  });

  it("library save copies an expression with its channels", async () => {
    const saved = await t.repo.library.save("e-hello-wave", "Wave copy");
    expect(saved.id).not.toBe("e-hello-wave");
    expect(saved.channels).toEqual(["motion", "face", "sound"]);
    expect(await t.repo.library.list()).toHaveLength(5);
  });

  it("delete cascades expressions; duplicate copies them", async () => {
    const copy = await t.repo.projects.duplicate("p-sleepy-robot");
    expect(await t.repo.expressions.listByProject(copy.id)).toHaveLength(1);
    await t.repo.projects.delete("p-sleepy-robot");
    expect(await t.repo.expressions.listByProject("p-sleepy-robot")).toHaveLength(0);
    expect(await code(t.repo.projects.get("p-sleepy-robot"))).toBe("NOT_FOUND");
  });

  it("profile: name 1–20, invite pending 7 days, owner protected", async () => {
    expect(await code(t.repo.profile.update({ name: "x".repeat(21) }))).toBe("VALIDATION");
    const p = await t.repo.profile.invite(["new@purebot.com"], "Editor");
    const invited = p.team.find((m) => m.email === "new@purebot.com")!;
    expect(invited.pending).toBe(true);
    expect(new Date(invited.expiresAt!).getTime() - new Date("2026-10-16T12:00:00.000Z").getTime()).toBe(7 * DAY);
    expect(await code(t.repo.profile.invite(["new@purebot.com"], "Viewer"))).toBe("CONFLICT");
    expect(await code(t.repo.profile.setRole("SeungA@purebot.com", "Viewer"))).toBe("CONFLICT");
  });

  it("user data tabs and search", async () => {
    const popular = await t.repo.userData.list({ tab: "popular" });
    expect(popular[0].uses).toBeGreaterThanOrEqual(popular[1].uses);
    expect((await t.repo.userData.list({ q: "nod" })).map((u) => u.name)).toEqual(["Nod"]);
    expect(await t.repo.userData.list({ tab: "uploaded" })).toHaveLength(0);
  });

  it("jobs persist progress and list active ones", async () => {
    const job = await t.repo.jobs.create("dev-echo", null, { steps: 3 });
    await t.repo.jobs.update(job.id, { status: "running", step: 2, progress: 66 });
    expect(await t.repo.jobs.list({ active: true })).toHaveLength(1);
    expect((await t.repo.jobs.get(job.id)).step).toBe(2);
  });

  it("dev reset restores the seed", async () => {
    await t.repo.projects.delete("p-test-01");
    await t.repo.settings.update({ demoMode: true });
    await t.repo.dev.reset();
    expect(await t.repo.projects.list()).toHaveLength(5);
    expect((await t.repo.settings.get()).demoMode).toBe(false);
  });
});

describe("isRepoError", () => {
  it("accepts any Error carrying a known code (hot-reloaded classes) and rejects others", async () => {
    const { isRepoError } = await import("./repo");
    expect(isRepoError(new RepoError("NOT_FOUND", "x"))).toBe(true);
    expect(isRepoError(Object.assign(new Error("x"), { code: "WRONG_PASSWORD" }))).toBe(true);
    expect(isRepoError(Object.assign(new Error("x"), { code: "NO_RIG" }))).toBe(false);
    expect(isRepoError({ code: "NOT_FOUND" })).toBe(false);
  });
});

describe("library ↔ user data, ownership", () => {
  it("saving to the library exposes it in User Data (uploaded); deleting removes it", async () => {
    const t = setup();
    const saved = await t.repo.library.save("e-sleepy-nod", "My nod");
    const uploaded = await t.repo.userData.list({ tab: "uploaded" });
    expect(uploaded.map((u) => u.name)).toContain("My nod");
    await t.repo.library.delete(saved.id);
    expect((await t.repo.userData.list({ tab: "uploaded" })).map((u) => u.name)).not.toContain("My nod");
  });

  it("transferring ownership demotes the old owner to Admin", async () => {
    const t = setup();
    const p = await t.repo.profile.setRole("minjun@purebot.com", "Owner");
    expect(p.team.find((m) => m.email === "minjun@purebot.com")?.role).toBe("Owner");
    expect(p.team.find((m) => m.email === "SeungA@purebot.com")?.role).toBe("Admin");
  });
});
