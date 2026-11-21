import type { Adapter } from "lowdb";

// lowdb adapter that keeps the whole DB as one JSON value in Upstash Redis (REST API, no SDK).
// Used on Vercel so every server instance and every deploy sees the same data.
export class RedisJson<T> implements Adapter<T> {
  constructor(private readonly url: string, private readonly token: string, private readonly key: string) {}

  private async call(command: unknown[]): Promise<unknown> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}` },
      body: JSON.stringify(command),
      cache: "no-store",
    });
    const body = (await res.json()) as { result?: unknown; error?: string };
    if (!res.ok || body.error) throw new Error(`Redis ${String(command[0])} failed: ${body.error ?? res.status}`);
    return body.result;
  }

  async read(): Promise<T | null> {
    const raw = await this.call(["GET", this.key]);
    return typeof raw === "string" ? (JSON.parse(raw) as T) : null;
  }

  async write(data: T): Promise<void> {
    await this.call(["SET", this.key, JSON.stringify(data)]);
  }
}

/** Upstash REST credentials from the Vercel integration, or null when none is connected. */
export function redisEnv(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}
