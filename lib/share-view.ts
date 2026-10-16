import "server-only";
import { RepoError, type Repo } from "./repo";

/** Public viewer data. Password-protected links return meta only until /unlock. */
export async function shareView(repo: Repo, id: string, unlocked: boolean) {
  const { passwordHash, attempts: _a, ...share } = await repo.shares.get(id);
  const state = await repo.shares.state(id);
  const profile = await repo.profile.get();
  const meta = { ...share, team: profile.company, hasPassword: Boolean(passwordHash), state };
  if (state === "expired") throw new RepoError("EXPIRED", "This link has expired");
  if (state === "locked") throw new RepoError("LOCKED", "Too many attempts. Try again in 5 minutes.");
  if (state === "password" && !unlocked) return { ...meta, expressions: null };
  return { ...meta, expressions: await repo.shares.contents(id) };
}
