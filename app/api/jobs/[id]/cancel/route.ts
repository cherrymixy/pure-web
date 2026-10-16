import { handle, type Ctx } from "@/lib/api";
import { cancelJob } from "@/lib/jobs";

export function POST(_req: Request, { params }: Ctx<{ id: string }>) {
  return handle(async () => cancelJob((await params).id));
}
