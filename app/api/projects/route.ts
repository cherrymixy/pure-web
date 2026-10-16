import { z } from "zod";
import { body, handle } from "@/lib/api";
import { ChannelSchema, RobotTypeSchema } from "@/lib/models";
import { getRepo } from "@/lib/repo-server";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(async () => {
    const raw = new URL(req.url).searchParams.get("channels");
    const channels = raw ? z.array(ChannelSchema).parse(raw.split(",").filter(Boolean)) : undefined;
    return getRepo().projects.list({ channels });
  });
}

const NewProjectSchema = z.object({
  name: z.string().min(1).max(60),
  type: RobotTypeSchema,
  source: z.enum(["pure-desk", "import"]),
  status: z.enum(["analyzing", "draft", "ready"]).optional(),
});

export function POST(req: Request) {
  return handle(async () => getRepo().projects.create(await body(req, NewProjectSchema)));
}
