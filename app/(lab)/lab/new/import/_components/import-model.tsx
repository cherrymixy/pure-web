"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { STRINGS } from "@/data/strings";
import type { Project } from "@/lib/models";
import { estimateType, type ModelReading } from "@/lib/robot/analyze";
import { api } from "@/lib/ui/api";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

const S = STRINGS.importModel;
const EXTS = [".glb", ".obj", ".stl"];
const MAX = 500 * 1024 * 1024;

type Phase =
  | { kind: "idle" }
  | { kind: "reading"; name: string }
  | { kind: "uploading"; name: string; loaded: number; total: number }
  | { kind: "error"; title: string; body: string };

type Upload = { path: string; size: number; name: string };

/** XHR so the bar shows real progress and Cancel aborts the stream. */
function upload(file: File, projectId: string, onProgress: (loaded: number) => void, xhrRef: { current: XMLHttpRequest | null }) {
  return new Promise<Upload>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("PUT", `/api/upload?projectId=${encodeURIComponent(projectId)}&kind=model&name=${encodeURIComponent(file.name)}`);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      const json = JSON.parse(xhr.responseText || "null");
      if (xhr.status >= 200 && xhr.status < 300) resolve(json as Upload);
      else reject(Object.assign(new Error(json?.error?.message ?? "Upload failed"), { code: json?.error?.code }));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.onabort = () => reject(Object.assign(new Error("canceled"), { code: "CANCELED" }));
    xhr.send(file);
  });
}

// W02B-2: drop zone, format check (E1), browser read of bones, upload with progress/Cancel → analyzing.
export function ImportModel() {
  const router = useRouter();
  const toast = useToast();
  const replaceId = useSearchParams().get("replace");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const xhr = useRef<XMLHttpRequest | null>(null);
  const created = useRef<string | null>(null);

  async function handle(file: File) {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!EXTS.includes(ext)) return setPhase({ kind: "error", ...S.unsupported });
    if (file.size > MAX) return setPhase({ kind: "error", title: S.unsupported.title, body: S.tooLarge });

    setPhase({ kind: "reading", name: file.name });
    let reading: ModelReading;
    try {
      const { readModel } = await import("@/lib/robot/read-model");
      reading = await readModel(file);
    } catch {
      return setPhase({ kind: "error", ...S.unreadable });
    }

    try {
      let projectId = replaceId;
      if (!projectId) {
        const name = file.name.replace(/\.[^.]+$/, "").slice(0, 60) || STRINGS.newType.untitled;
        const project = await api<Project>("/api/projects", {
          method: "POST",
          body: JSON.stringify({ name, type: estimateType(reading.bones), source: "import", status: "analyzing" }),
        });
        projectId = created.current = project.id;
      }
      setPhase({ kind: "uploading", name: file.name, loaded: 0, total: file.size });
      const saved = await upload(file, projectId, (loaded) => setPhase((p) => (p.kind === "uploading" ? { ...p, loaded } : p)), xhr);
      xhr.current = null;
      await api(`/api/projects/${projectId}/analyze`, {
        method: "POST",
        body: JSON.stringify({ source: "import", file: { name: saved.name, size: saved.size, path: saved.path }, reading }),
      });
      router.push(`/lab/p/${projectId}/analyzing`);
    } catch (err) {
      xhr.current = null;
      if (created.current) {
        await fetch(`/api/projects/${created.current}`, { method: "DELETE" }).catch(() => {});
        created.current = null;
      }
      const code = (err as { code?: string }).code;
      if (code === "CANCELED") {
        toast(S.canceled);
        setPhase({ kind: "idle" });
      } else if (code === "UNSUPPORTED" || code === "TOO_LARGE") {
        setPhase({ kind: "error", title: S.unsupported.title, body: (err as Error).message });
      } else {
        setPhase({ kind: "error", title: STRINGS.lab.toast.failed, body: (err as Error).message });
      }
    }
  }

  function pick(files: FileList | null) {
    const file = files?.[0];
    if (file) void handle(file);
  }

  const busy = phase.kind === "reading" || phase.kind === "uploading";

  return (
    <div className="flex flex-col gap-6 p-10">
      <Link href="/lab" className="text-sm text-neutral-500">← {STRINGS.sidebar.lab}</Link>
      <h1 className="text-2xl font-semibold">{replaceId ? S.replaceTitle : S.title}</h1>

      <div
        data-testid="dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) pick(e.dataTransfer.files);
        }}
        className={`flex min-h-72 flex-col items-center justify-center gap-4 rounded border-2 border-dashed p-10 text-center ${
          dragging ? "border-neutral-900 bg-neutral-100" : phase.kind === "error" ? "border-red-400" : "border-neutral-300"
        }`}
      >
        {phase.kind === "idle" && (
          <>
            <p className="text-neutral-600">{dragging ? S.dropHere : S.drop}</p>
            <Button onClick={() => input.current?.click()}>{S.browse}</Button>
          </>
        )}
        {phase.kind === "reading" && <p className="text-neutral-600">{S.reading} · {phase.name}</p>}
        {phase.kind === "uploading" && (
          <div className="flex w-full max-w-md flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="truncate">{S.uploading} · {phase.name}</span>
              <span className="font-mono">{Math.round((phase.loaded / Math.max(phase.total, 1)) * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded bg-neutral-200">
              <div className="h-full bg-neutral-700" style={{ width: `${(phase.loaded / Math.max(phase.total, 1)) * 100}%` }} />
            </div>
            <Button className="self-center" onClick={() => setConfirmCancel(true)}>{S.cancel}</Button>
          </div>
        )}
        {phase.kind === "error" && (
          <div role="alert" className="flex flex-col items-center gap-2">
            <p className="font-semibold text-red-600">{phase.title}</p>
            <p className="text-sm text-neutral-600">{phase.body}</p>
            <Button onClick={() => { setPhase({ kind: "idle" }); input.current?.click(); }}>{S.tryAnother}</Button>
          </div>
        )}
        <input ref={input} type="file" className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {S.formats.map((f) => (
          <div key={f.ext} className="flex flex-col gap-1 rounded border border-neutral-200 p-4">
            <span className="font-semibold">{f.ext}</span>
            <span className="text-xs text-neutral-500">{f.note}</span>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={confirmCancel}
        title={S.cancelConfirm.title}
        body={S.cancelConfirm.body}
        confirmLabel={S.cancel}
        danger
        onConfirm={() => {
          setConfirmCancel(false);
          xhr.current?.abort();
        }}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
