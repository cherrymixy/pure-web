"use client";

import { useState } from "react";
import { SUGGESTED_PROMPTS } from "@/data/prompts";

type Result = {
  mode: "generate" | "describe";
  source?: "ollama" | "demo";
  fallbackReason?: string;
  raw?: string;
  output?: unknown;
  summary?: string;
  ms: number;
  totalMs: number;
  model?: string;
  retried?: boolean;
  referenceSummary?: string;
  describeMs?: number;
  error?: { message: string };
};

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Gray-box bench for lib/llm (STEP 6).
export function LlmLab() {
  const [prompt, setPrompt] = useState<string>(SUGGESTED_PROMPTS[2].text);
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  async function run(mode: "generate" | "describe") {
    setBusy(true);
    setResult(null);
    const t0 = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - t0), 100);
    try {
      const res = await fetch("/api/dev/llm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, prompt, images: images.length ? images : undefined }),
      });
      setResult(await res.json());
    } finally {
      clearInterval(timer);
      setBusy(false);
    }
  }

  const btn = "rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 disabled:opacity-40";

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-10">
      <h1 className="text-2xl font-semibold">/dev/llm</h1>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((p) => (
            <button key={p.id} className={btn} onClick={() => setPrompt(p.text)}>{p.text}</button>
          ))}
        </div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} className="rounded border border-neutral-300 p-2 text-sm" />
        <div className="flex items-center gap-3 text-sm">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={async (e) => setImages(await Promise.all([...(e.target.files ?? [])].slice(0, 8).map(readAsDataUrl)))}
          />
          {images.length > 0 && <span className="text-neutral-500">{images.length} image(s)</span>}
          {images.length > 0 && <button className={btn} onClick={() => setImages([])}>Clear</button>}
        </div>
        <div className="flex items-center gap-3">
          <button className={btn} disabled={busy} onClick={() => run("generate")}>Generate</button>
          <button className={btn} disabled={busy || images.length === 0} onClick={() => run("describe")}>Describe images only</button>
          {busy && <span className="font-mono text-sm text-neutral-500">{(elapsed / 1000).toFixed(1)}s…</span>}
        </div>
      </section>

      {result && (
        <section className="flex flex-col gap-3 text-sm">
          {result.error ? (
            <p className="text-red-600">{result.error.message}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                {result.source && (
                  <span data-testid="llm-source" className={`rounded px-2 py-0.5 font-mono text-xs ${result.source === "ollama" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                    {result.source}
                  </span>
                )}
                <span className="font-mono">{(result.totalMs / 1000).toFixed(1)}s total</span>
                {result.model && <span className="text-neutral-500">{result.model}</span>}
                {result.retried && <span className="text-amber-700">retried once</span>}
                {result.describeMs !== undefined && <span className="text-neutral-500">vision {(result.describeMs / 1000).toFixed(1)}s</span>}
              </div>
              {result.fallbackReason && <p className="text-amber-700">Fallback: {result.fallbackReason}</p>}
              {(result.referenceSummary || result.summary) && (
                <p className="rounded bg-neutral-50 p-2"><b>Reference summary:</b> {result.referenceSummary ?? result.summary}</p>
              )}
              {result.output !== undefined && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h2 className="mb-1 font-semibold">Parsed</h2>
                    <pre className="max-h-[520px] overflow-auto rounded bg-neutral-50 p-3 text-xs">{JSON.stringify(result.output, null, 2)}</pre>
                  </div>
                  <div>
                    <h2 className="mb-1 font-semibold">Raw</h2>
                    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded bg-neutral-50 p-3 text-xs">{result.raw ?? "(demo — no model call)"}</pre>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}
