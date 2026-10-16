"use client";

import { useCallback, useEffect, useState } from "react";
import { AXIS_INFO, AXIS_ORDER } from "@/data/signature";
import { STRINGS } from "@/data/strings";
import type { Job, Project, Signature } from "@/lib/models";
import { compareSignatures, signatureToParams } from "@/lib/signature/axes";
import { Radar } from "./radar";

type Source = { kind: "pdf"; path: string; name: string } | { kind: "url"; url: string };
type JobResult = {
  signature: Signature;
  extracted: { name: string; kind: string; colors: string[]; fonts: string[]; pageCount: number };
  evidence: { keyword: string; page: number; quote: string }[];
  source: "ollama" | "demo";
  fallbackReason?: string;
};
const STEPS = ["Reading", "Colors", "Type", "Tone", "Signature"];

function upload(file: Blob, name: string, projectId: string, onProgress: (p: number) => void): Promise<{ path: string; name: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/api/upload?projectId=${projectId}&kind=pdf&name=${encodeURIComponent(name)}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error(JSON.parse(xhr.responseText).error?.message ?? xhr.statusText)));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}

// Gray-box bench for lib/signature (STEP 7).
export function SignatureLab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("p-test-01");
  const [url, setUrl] = useState("https://www.figma.com/design/abc/Brand");
  const [lastSource, setLastSource] = useState<Source | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [versions, setVersions] = useState<Signature[]>([]);
  const [compare, setCompare] = useState<[number, number] | null>(null);

  const loadVersions = useCallback(async (id: string) => {
    const res = await fetch(`/api/projects/${id}/signatures`);
    if (res.ok) setVersions(await res.json());
  }, []);

  useEffect(() => {
    fetch("/api/projects").then(async (r) => setProjects(await r.json()));
  }, []);
  useEffect(() => {
    loadVersions(projectId);
  }, [projectId, loadVersions]);

  async function start(source: Source, regenerate = false) {
    setError(null);
    setJob(null);
    setLastSource(source);
    const res = await fetch("/api/signature/extract", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId, source, regenerate }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    let current: Job = data;
    setJob(current);
    while (current.status === "queued" || current.status === "running") {
      await new Promise((r) => setTimeout(r, 400));
      current = await (await fetch(`/api/jobs/${current.id}`)).json();
      setJob(current);
    }
    if (current.status === "failed") setError({ code: current.errorCode ?? "FAILED", message: current.error ?? "Failed" });
    loadVersions(projectId);
  }

  async function startPdf(file: Blob, name: string) {
    setError(null);
    setUploadPct(0);
    try {
      const up = await upload(file, name, projectId, setUploadPct);
      setUploadPct(null);
      await start({ kind: "pdf", path: up.path, name: up.name });
    } catch (e) {
      setUploadPct(null);
      setError({ code: "UPLOAD", message: e instanceof Error ? e.message : String(e) });
    }
  }

  async function demoPdf(file: string) {
    const blob = await (await fetch(`/demo/${file}`)).blob();
    await startPdf(blob, file);
  }

  async function restore(version: number) {
    await fetch(`/api/projects/${projectId}/signatures/${version}/restore`, { method: "POST" });
    loadVersions(projectId);
  }

  const result = job?.status === "done" ? (job.result as JobResult) : null;
  const shown = result?.signature ?? versions.at(-1);
  const params = shown ? signatureToParams(shown.axes) : null;
  const running = job && (job.status === "queued" || job.status === "running");
  const btn = "rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 disabled:opacity-40";
  const pair = compare ? [versions.find((v) => v.version === compare[0]), versions.find((v) => v.version === compare[1])] : null;
  const errorText = error?.code === "FIGMA_UNSUPPORTED" ? STRINGS.signature.figmaError : error ? STRINGS.signature.failed : null;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-10 text-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">/dev/signature</h1>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="rounded border border-neutral-300 px-2 py-1">
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button className={btn} disabled={!!running} onClick={() => demoPdf("Purebot_Brand_Guide.pdf")}>Use Purebot_Brand_Guide.pdf</button>
          <button className={btn} disabled={!!running} onClick={() => demoPdf("Scanned_Guide.pdf")}>Use Scanned_Guide.pdf (fails)</button>
          <label className={`${btn} cursor-pointer`}>
            Choose PDF…
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && startPdf(e.target.files[0], e.target.files[0].name)} />
          </label>
          {uploadPct !== null && <span className="font-mono">upload {(uploadPct * 100).toFixed(0)}%</span>}
        </div>
        <div className="flex items-center gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-[480px] rounded border border-neutral-300 px-2 py-1" />
          <button className={btn} disabled={!!running} onClick={() => start({ kind: "url", url })}>Extract URL</button>
          <button className={btn} disabled={!!running || !lastSource} onClick={() => lastSource && start(lastSource, true)}>Regenerate</button>
        </div>
      </section>

      {job && (
        <ol className="flex gap-4">
          {STEPS.map((s, i) => {
            const done = job.status === "done" || job.step > i;
            const active = running && job.step === i;
            return (
              <li key={s} className={done ? "text-green-700" : active ? "font-semibold" : "text-neutral-400"}>
                {done ? "✓ " : active ? "• " : ""}{s}
              </li>
            );
          })}
          <li className="font-mono text-neutral-500">{job.progress}%</li>
        </ol>
      )}

      {errorText && (
        <div data-testid="sig-error" className="rounded border border-red-300 bg-red-50 p-3">
          <b>{errorText.title}</b> — {errorText.body} <span className="font-mono text-xs text-neutral-500">({error?.code}: {error?.message})</span>
        </div>
      )}

      {shown && params && (
        <section className="grid grid-cols-[300px_1fr] gap-6">
          <div className="flex flex-col items-center gap-2">
            <Radar axes={shown.axes} compare={pair?.[0] && pair[1] ? pair[0].axes : undefined} />
            <span className="font-mono">{shown.name} · v0.{shown.version}</span>
          </div>
          <div className="flex flex-col gap-3">
            {result && (
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded px-2 py-0.5 font-mono text-xs ${result.source === "ollama" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{result.source}</span>
                {result.evidence.map((t) => (
                  <span key={t.keyword} data-testid="tone-chip" className="rounded-full border border-neutral-300 px-2 py-0.5" title={t.quote}>
                    {t.keyword}{result.extracted.kind === "pdf" ? ` · p.${t.page}` : ""}
                  </span>
                ))}
                {result.extracted.colors.map((c) => <span key={c} title={c} className="inline-block h-5 w-5 rounded border border-neutral-300" style={{ background: c }} />)}
                <span className="text-neutral-600">{result.extracted.fonts.join(", ")}</span>
                <span className="text-neutral-400">{result.extracted.pageCount} {result.extracted.kind === "pdf" ? "pages" : "sections"}</span>
              </div>
            )}
            {result?.fallbackReason && <p className="text-amber-700">Fallback: {result.fallbackReason}</p>}
            <table className="w-full">
              <tbody>
                {AXIS_ORDER.map((ax) => (
                  <tr key={ax} className="border-t border-neutral-100">
                    <td className="w-28 py-1">{AXIS_INFO[ax].label}</td>
                    <td className="w-12 font-mono">{shown.axes[ax]}</td>
                    <td className="text-neutral-600">{shown.mapping.find((m) => m.axis === ax)?.reason ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="font-mono text-xs text-neutral-500">
              speed {params.playback.speed.toFixed(2)} · amplitude {params.playback.amplitude.toFixed(2)} · settle {params.playback.settle.toFixed(2)} · antic {params.playback.antic.toFixed(2)} · rhythm {params.playback.rhythm.toFixed(2)} · eyeSize {params.face.eyeSize.toFixed(2)} · pitch {params.sound.pitchSt.toFixed(1)}st · cues ≤{params.sound.maxCues}
            </p>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Versions ({versions.length})</h2>
        <table className="w-full">
          <tbody>
            {[...versions].reverse().map((v) => (
              <tr key={v.id} className="border-t border-neutral-100">
                <td className="w-16 py-1 font-mono">v0.{v.version}</td>
                <td>{v.name}</td>
                <td className="text-neutral-500">{v.tone.join(", ") || "—"}</td>
                <td className="text-neutral-400">{v.note}</td>
                <td className="w-56 text-right">
                  <button className={btn} onClick={() => restore(v.version)}>Restore</button>{" "}
                  <button className={btn} disabled={versions.length < 2} onClick={() => setCompare([v.version, versions.at(-1)!.version])}>Compare to latest</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pair?.[0] && pair[1] && (
          <div data-testid="compare" className="flex flex-wrap gap-3 font-mono text-xs">
            <span>v0.{pair[0].version} → v0.{pair[1].version}:</span>
            {compareSignatures(pair[0], pair[1]).map((d) => (
              <span key={d.axis} className={d.delta ? "" : "text-neutral-400"}>{AXIS_INFO[d.axis].label} {d.from}→{d.to}</span>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
