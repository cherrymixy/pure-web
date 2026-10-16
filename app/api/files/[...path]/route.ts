import { handle, type Ctx } from "@/lib/api";
import { serveUpload } from "@/lib/uploads";

export function GET(req: Request, { params }: Ctx<{ path: string[] }>) {
  return handle(async () => serveUpload((await params).path.map(decodeURIComponent).join("/"), req));
}
