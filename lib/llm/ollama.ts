import { OLLAMA_MODEL, OLLAMA_URL } from "../env";
import { LlmError, type ChatJsonRequest, type ChatJsonResponse, type LlmClient } from "./client";

export const TIMEOUT_MS = 60_000;
export const DELAY_MS = 20_000;
const AVAILABILITY_TTL = 10_000;

/**
 * Ollama native /api/chat with `format` = JSON schema (Ollama 0.5+).
 * Learned in pure-app: `think: false` for qwen3 (thinking only adds latency, the
 * answer is JSON anyway).
 */
export class OllamaClient implements LlmClient {
  private availability: { at: number; ok: boolean } | null = null;

  constructor(
    private readonly url = OLLAMA_URL,
    private readonly defaultModel = OLLAMA_MODEL,
  ) {}

  /** Ollama loads a model on an empty /api/generate; keeps it for the same 10 minutes as chat calls. */
  async preload(model: string): Promise<void> {
    await fetch(`${this.url}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, keep_alive: "10m" }),
      signal: AbortSignal.timeout(60_000),
    }).catch(() => {});
  }

  async available(): Promise<boolean> {
    const now = Date.now();
    if (this.availability && now - this.availability.at < AVAILABILITY_TTL) return this.availability.ok;
    let ok = false;
    try {
      const res = await fetch(`${this.url}/api/tags`, { signal: AbortSignal.timeout(1500), cache: "no-store" });
      ok = res.ok;
    } catch {
      ok = false;
    }
    this.availability = { at: now, ok };
    return ok;
  }

  async chatJson(req: ChatJsonRequest): Promise<ChatJsonResponse> {
    const model = req.model ?? this.defaultModel;
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
      const images = req.images?.map((img) => img.replace(/^data:[^;]+;base64,/, ""));
      let res: Response;
      try {
        res = await fetch(`${this.url}/api/chat`, {
          method: "POST",
          signal: controller.signal,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model,
            stream: false,
            think: false,
            keep_alive: "10m",
            format: req.schema,
            options: { temperature: req.temperature ?? 0.7 },
            messages: [
              { role: "system", content: req.system },
              { role: "user", content: req.user, ...(images?.length ? { images } : {}) },
            ],
          }),
        });
      } catch (err) {
        if (req.signal?.aborted) throw new LlmError("canceled", "Canceled");
        if (timedOut) throw new LlmError("timeout", `No answer within ${(req.timeoutMs ?? TIMEOUT_MS) / 1000}s`);
        this.availability = { at: Date.now(), ok: false };
        throw new LlmError("network", `Ollama unreachable: ${err instanceof Error ? err.message : String(err)}`);
      }
      if (res.status === 404) throw new LlmError("unsupported", `Model ${model} not found (ollama pull ${model})`);
      if (!res.ok) throw new LlmError("invalid", `Ollama HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const envelope = (await res.json()) as { message?: { content?: string }; error?: string };
      const raw = envelope.message?.content ?? "";
      if (!raw.trim()) throw new LlmError("invalid", envelope.error ?? "Empty response");
      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch {
        throw Object.assign(new LlmError("invalid", "Response is not JSON"), { raw });
      }
      return { raw, json, ms: Date.now() - started, model };
    } finally {
      clearTimeout(timer);
      if (delay) clearTimeout(delay);
      req.signal?.removeEventListener("abort", onAbort);
    }
  }
}
