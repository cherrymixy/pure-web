import { z } from "zod";
import { LlmError, type ChatJsonRequest, type LlmClient } from "./client";

export interface JsonCallResult<T> {
  value: T;
  raw: string;
  ms: number;
  model: string;
  retried: boolean;
}

/**
 * One call with the shared failure policy:
 *  invalid JSON / schema mismatch → one retry that quotes the error → throw.
 *  Callers turn a throw into the demo fallback (cancel is re-thrown untouched).
 */
export async function chatValidated<T>(
  client: LlmClient,
  schema: z.ZodType<T>,
  req: Omit<ChatJsonRequest, "schema">,
): Promise<JsonCallResult<T>> {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  let user = req.user;
  let totalMs = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    let problem: string;
    try {
      const res = await client.chatJson({ ...req, user, schema: jsonSchema });
      totalMs += res.ms;
      const parsed = schema.safeParse(res.json);
      if (parsed.success) return { value: parsed.data, raw: res.raw, ms: totalMs, model: res.model, retried: attempt > 0 };
      problem = z.prettifyError(parsed.error);
    } catch (err) {
      if (!(err instanceof LlmError) || err.kind !== "invalid") throw err;
      problem = err.message;
    }
    if (attempt === 1) throw new LlmError("invalid", `Schema mismatch after retry: ${problem}`);
    user = `${req.user}\n\nYour previous answer broke the JSON schema:\n${problem}\nAnswer again with valid JSON only.`;
  }
  throw new LlmError("invalid", "unreachable");
}
