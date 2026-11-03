import "server-only";
import { RepoError, type Repo } from "./repo";

/** Public viewer data. Password-protected links return meta only until /unlock. */
export async function shareView(repo: Repo, id: string, unlocked: boolean) {
  const { passwordHash, attempts: _a, expressionIds, ...share } = await repo.shares.get(id);
  const state = await repo.shares.state(id);
  const profile = await repo.profile.get();
  const meta = { ...share, team: profile.company, hasPassword: Boolean(passwordHash), state };
  if (state === "expired") throw new RepoError("EXPIRED", "This link has expired");
  if (state === "locked") throw new RepoError("LOCKED", "Too many attempts. Try again in 5 minutes.");
  // Locked links hide which expressions they hold (the ids open them through the library API).
  if (state === "password" && !unlocked) return { ...meta, expressionIds: [], expressions: null, robot: null };
  const expressions = await repo.shares.contents(id);
  // Every expression was deleted from the library: say so instead of an empty viewer.
  if (expressions.length === 0) throw new RepoError("NOT_FOUND", "This link no longer has anything to show");
  // The viewer plays on the robot the expressions were made for and builds pure.json from it.
  const project = expressions[0] ? await repo.projects.get(expressions[0].projectId).catch(() => null) : null;
  const robot = project?.structure ? { projectName: project.name, type: project.type, structure: project.structure } : null;
  return { ...meta, expressionIds, expressions, robot };
}
