import "server-only";
import { z } from "zod";
import { RepoError } from "./repo";

// Route helpers: every error is { error: { code, message } }.

export function errorResponse(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status });
}

export async function handle(fn: () => Promise<unknown>): Promise<Response> {
  try {
    const result = await fn();
    return result instanceof Response ? result : Response.json(result ?? { ok: true });
  } catch (err) {
    if (err instanceof RepoError) return errorResponse(err.status, err.code, err.message);
    if (err instanceof z.ZodError) return errorResponse(400, "VALIDATION", z.prettifyError(err));
    console.error(err);
    return errorResponse(500, "INTERNAL", err instanceof Error ? err.message : String(err));
  }
}

export async function body<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new RepoError("VALIDATION", "Body must be JSON");
  }
  return schema.parse(json);
}

/** Next 15 route params are a Promise. */
export type Ctx<P> = { params: Promise<P> };
