import { OLLAMA_MODEL, OLLAMA_URL, OLLAMA_VISION_MODEL } from "@/lib/env";

export const dynamic = "force-dynamic";

type Tag = { name: string; size: number };

export async function GET() {
  const started = Date.now();
  const base = { url: OLLAMA_URL, model: OLLAMA_MODEL, visionModel: OLLAMA_VISION_MODEL };
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { models } = (await res.json()) as { models: Tag[] };
    const names = models.map((m) => m.name);
    return Response.json({
      ...base,
      ok: true,
      pingMs: Date.now() - started,
      models: models.map(({ name, size }) => ({ name, size })),
      hasModel: names.includes(OLLAMA_MODEL),
      hasVisionModel: names.includes(OLLAMA_VISION_MODEL),
    });
  } catch (err) {
    return Response.json({
      ...base,
      ok: false,
      pingMs: Date.now() - started,
      models: [],
      hasModel: false,
      hasVisionModel: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
