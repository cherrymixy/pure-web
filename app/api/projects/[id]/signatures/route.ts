import { body, handle, type Ctx } from "@/lib/api";
import { SignatureSchema } from "@/lib/models";
import { getRepo } from "@/lib/repo-server";

export const dynamic = "force-dynamic";
type P = Ctx<{ id: string }>;

export function GET(_req: Request, { params }: P) {
  return handle(async () => getRepo().signatures.list((await params).id));
}

const DraftSchema = SignatureSchema.omit({ id: true, version: true, createdAt: true });

export function POST(req: Request, { params }: P) {
  return handle(async () => getRepo().signatures.addVersion((await params).id, await body(req, DraftSchema)));
}
