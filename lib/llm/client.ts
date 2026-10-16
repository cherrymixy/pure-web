// LLM transport interface. Implementations: OllamaClient (lib/llm/ollama.ts), FakeClient (tests).

export type LlmErrorKind = "network" | "timeout" | "invalid" | "unsupported" | "canceled";

export class LlmError extends Error {
  constructor(readonly kind: LlmErrorKind, message: string) {
    super(message);
  }
}

export interface ChatJsonRequest {
  system: string;
  user: string;
  /** base64 (no data: prefix) or data URLs */
  images?: string[];
  /** JSON schema for Ollama `format` */
  schema: Record<string, unknown>;
  model?: string;
  timeoutMs?: number;
  /** Fired once if the call is still running after `delayMs` (default 20s) */
  onDelay?: () => void;
  delayMs?: number;
  signal?: AbortSignal;
  temperature?: number;
}

export interface ChatJsonResponse {
  /** Raw message content as returned by the model */
  raw: string;
  /** JSON.parse(raw) — schema validation happens in lib/llm/retry.ts */
  json: unknown;
  ms: number;
  model: string;
}

export interface LlmClient {
  chatJson(req: ChatJsonRequest): Promise<ChatJsonResponse>;
  /** Cheap reachability check (cached). */
  available(): Promise<boolean>;
  /** Load a model into memory ahead of use (fire-and-forget). */
  preload?(model: string): Promise<void>;
}
