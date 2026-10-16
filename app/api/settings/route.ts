import { body, handle } from "@/lib/api";
import { SettingsSchema } from "@/lib/models";
import { getRepo } from "@/lib/repo-server";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => getRepo().settings.get());
}

export function PATCH(req: Request) {
  return handle(async () => getRepo().settings.update(await body(req, SettingsSchema.partial())));
}
