import { OPENAI_API_KEY, OPENAI_MODEL } from "../env";
import { LlmError, type ChatJsonRequest, type ChatJsonResponse, type LlmClient } from "./client";
import { DELAY_MS, TIMEOUT_MS } from "./ollama";

const URL = "https://api.openai.com/v1/chat/completions";

/** base64 without a data: prefix → data URL, guessing the type from the magic bytes. */
export function toDataUrl(img: string): string {
  if (img.startsWith("data:")) return img;
  const type = img.startsWith("/9j/") ? "jpeg" : img.startsWith("UklGR") ? "webp" : img.startsWith("R0lGOD") ? "gif" : "png";
  return `data:image/${type};base64,${img}`;
}

/**
 * OpenAI Chat Completions with response_format = JSON schema. Same contract as OllamaClient;
 * `req.model` (an Ollama name like qwen3:8b) is ignored — one OpenAI model handles text and images.
 */
export class OpenAiClient implements LlmClient {
  constructor(
    private readonly apiKey = OPENAI_API_KEY,
    private readonly model = OPENAI_MODEL,
  ) {}

  async available(): Promise<boolean> {
    return Boolean(this.apiKey);
  }

  async chatJson(req: ChatJsonRequest): Promise<ChatJsonResponse> {
    if (req.signal?.aborted) throw new LlmError("canceled", "Canceled");
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, req.timeoutMs ?? TIMEOUT_MS);
    const delay = req.onDelay ? setTimeout(req.onDelay, req.delayMs ?? DELAY_MS) : null;
    const onAbort = () => controller.abort();
    req.signal?.addEventListener("abort", onAbort);
    const started = Date.now();

    try {
      const images = req.images ?? [];
      const user = images.length
        ? [{ type: "text", text: req.user }, ...images.map((img) => ({ type: "image_url", image_url: { url: toDataUrl(img) } }))]
        : req.user;
      let res: Response;
      try {
        res = await fetch(URL, {
          method: "POST",
          signal: controller.signal,
          headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
          body: JSON.stringify({
            model: this.model,
            temperature: req.temperature ?? 0.7,
            // strict:false — our schemas use features strict mode rejects; lib/llm/retry.ts validates anyway.
            response_format: { type: "json_schema", json_schema: { name: "output", schema: req.schema, strict: false } },
            messages: [
              { role: "system", content: req.system },
              { role: "user", content: user },
            ],
          }),
        });
      } catch (err) {
        if (req.signal?.aborted) throw new LlmError("canceled", "Canceled");
        if (timedOut) throw new LlmError("timeout", `No answer within ${(req.timeoutMs ?? TIMEOUT_MS) / 1000}s`);
        throw new LlmError("network", `OpenAI unreachable: ${err instanceof Error ? err.message : String(err)}`);
      }
      if (!res.ok) throw new LlmError("invalid", `OpenAI HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const envelope = (await res.json()) as { choices?: { message?: { content?: string | null; refusal?: string | null } }[] };
      const msg = envelope.choices?.[0]?.message;
      const raw = msg?.content ?? "";
      if (!raw.trim()) throw new LlmError("invalid", msg?.refusal ?? "Empty response");
      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch {
        throw Object.assign(new LlmError("invalid", "Response is not JSON"), { raw });
      }
      return { raw, json, ms: Date.now() - started, model: this.model };
    } finally {
      clearTimeout(timer);
      if (delay) clearTimeout(delay);
      req.signal?.removeEventListener("abort", onAbort);
    }
  }
}
