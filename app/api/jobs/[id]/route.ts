import { handle, type Ctx } from "@/lib/api";
import { resumeJobs } from "@/lib/jobs";
import { getRepo } from "@/lib/repo-server";

export const dynamic = "force-dynamic";

/** Poll a job: status, progress, step, result. */
export function GET(_req: Request, { params }: Ctx<{ id: string }>) {
  return handle(async () => {
    await resumeJobs();
    return getRepo().jobs.get((await params).id);
  });
}
