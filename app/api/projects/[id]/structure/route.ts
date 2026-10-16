import { body, handle, type Ctx } from "@/lib/api";
import { StructureSchema } from "@/lib/models";
import { getRepo } from "@/lib/repo-server";

export function PUT(req: Request, { params }: Ctx<{ id: string }>) {
  return handle(async () => getRepo().projects.setStructure((await params).id, await body(req, StructureSchema)));
}
