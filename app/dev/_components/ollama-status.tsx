"use client";

import { useCallback, useEffect, useState } from "react";

type Status = {
  ok: boolean;
  url: string;
  pingMs: number;
  model: string;
  visionModel: string;
  hasModel: boolean;
  hasVisionModel: boolean;
  models: { name: string; size: number }[];
  error?: string;
  lastCall: { at: string; ms: number; model?: string; source: string; kind: string } | null;
};

export function OllamaStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [checkedAt, setCheckedAt] = useState<string>("");

  const check = useCallback(async () => {
    const res = await fetch("/api/dev/ollama", { cache: "no-store" });
    setStatus(await res.json());
    setCheckedAt(new Date().toLocaleTimeString("en-US"));
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const ready = status?.ok && status.hasModel && status.hasVisionModel;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span
          data-testid="ollama-dot"
          className={`h-3 w-3 rounded-full ${!status ? "bg-neutral-300" : ready ? "bg-green-500" : status.ok ? "bg-amber-400" : "bg-red-500"}`}
        />
        <span className="font-medium">
          {!status ? "Checking…" : status.ok ? (ready ? "Connected" : "Connected — model missing") : "Unreachable"}
        </span>
        {status && <span className="text-sm text-neutral-500">{status.pingMs} ms · {status.url}</span>}
        <button onClick={check} className="ml-auto rounded border border-neutral-300 px-2 py-1 text-sm">
          Refresh
        </button>
      </div>
      {status && (
        <dl className="grid grid-cols-[140px_1fr] gap-1 text-sm">
          <dt className="text-neutral-500">OLLAMA_MODEL</dt>
          <dd>{status.model} {status.hasModel ? "✓" : "✗ not pulled"}</dd>
          <dt className="text-neutral-500">VISION_MODEL</dt>
          <dd>{status.visionModel} {status.hasVisionModel ? "✓" : "✗ not pulled"}</dd>
          <dt className="text-neutral-500">Installed</dt>
          <dd>{status.models.map((m) => m.name).join(", ") || "—"}</dd>
          {status.error && (
            <>
              <dt className="text-neutral-500">Error</dt>
              <dd className="text-red-600">{status.error}</dd>
            </>
          )}
          <dt className="text-neutral-500">Last response</dt>
          <dd>
            {status.lastCall
              ? `${(status.lastCall.ms / 1000).toFixed(1)}s · ${status.lastCall.kind} · ${status.lastCall.source}${status.lastCall.model ? ` · ${status.lastCall.model}` : ""} · ${new Date(status.lastCall.at).toLocaleTimeString("en-US")}`
              : "—"}
          </dd>
          <dt className="text-neutral-500">Checked</dt>
          <dd>{checkedAt}</dd>
        </dl>
      )}
    </div>
  );
}
