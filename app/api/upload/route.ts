import { handle } from "@/lib/api";
import { RepoError } from "@/lib/repo";
import { saveUpload } from "@/lib/uploads";

/**
 * PUT /api/upload?projectId=&kind=model|pdf|video|image|frame|thumb&name=file.glb
 * Body = raw file bytes (streamed to disk; XHR gives progress and Cancel).
 */
export function PUT(req: Request) {
  return handle(async () => {
    const q = new URL(req.url).searchParams;
    const name = q.get("name");
    const kind = q.get("kind");
    if (!name || !kind) throw new RepoError("VALIDATION", "name and kind are required");
    return saveUpload(req, { scope: q.get("projectId") ?? "_shared", kind, name });
  });
}
