import { z } from "zod";
import { body, handle } from "@/lib/api";
import { resumeJobs, startJob } from "@/lib/jobs";
import { getRepo } from "@/lib/repo-server";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(async () => {
    await resumeJobs();
    const q = new URL(req.url).searchParams;
    return getRepo().jobs.list({ projectId: q.get("projectId") ?? undefined, active: q.get("active") === "1" });
  });
}

/** Dev only: start the test job. Real jobs start from their own routes. */
export function POST(req: Request) {
  return handle(async () => {
    const input = await body(req, z.object({ steps: z.number().int().min(1).max(20).optional(), ms: z.number().int().min(10).max(10000).optional() }));
    return startJob("dev-echo", null, input);
  });
}
