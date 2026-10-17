"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { STRINGS } from "@/data/strings";
import type { Project } from "@/lib/models";
import { estimateType, type ModelReading } from "@/lib/robot/analyze";
import { api } from "@/lib/ui/api";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons/icon";
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
  const percent = phase.kind === "uploading" ? Math.round((phase.loaded / Math.max(phase.total, 1)) * 100) : 0;

  // No Figma frame: same language as W02B-1 type select (back pill at 48/40, 1714 column at x 103, title 52 semibold)
  // and the W02B-3 analysis card (white radius 2xl card, border 2, 6px bar on neutral-150 with bg/inverse fill).
  return (
    <div className="flex min-h-[var(--app-vh)] flex-col pl-[48px] pt-[var(--space-40)]">
      <Link
        href="/lab"
        className="flex h-[48px] w-fit items-center gap-[var(--space-12)] rounded-[var(--radius-full)] border-2 border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-16)] text-[16px] font-medium leading-[20px] text-[var(--text-link)] hover:bg-[var(--neutral-50)]"
      >
        <span aria-hidden>←</span>
        <span>{STRINGS.sidebar.lab}</span>
      </Link>

      <div className="ml-[55px] flex w-[1714px] flex-col pb-[65px]">
        <header className="mt-[21px] flex flex-col gap-[12px]">
          <h1 className="text-[52px] font-semibold leading-[66px] text-[var(--sage-800)]">{replaceId ? S.replaceTitle : S.title}</h1>
        </header>

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
          className={`mt-[72px] flex h-[480px] flex-col items-center justify-center rounded-[var(--radius-2xl)] border-2 border-dashed px-[var(--space-48)] text-center transition-colors ${
            dragging
              ? "border-[var(--border-strong)] bg-[var(--sage-50)]"
              : phase.kind === "error"
                ? "border-[var(--border-error)] bg-[var(--bg-surface)]"
                : "border-[var(--border-default)] bg-[var(--bg-surface)]"
          }`}
        >
          {phase.kind === "idle" && (
            <div className="flex flex-col items-center gap-[var(--space-24)]">
              <span className={`flex size-[96px] items-center justify-center rounded-[var(--radius-full)] ${dragging ? "anim-float bg-[var(--bg-surface)]" : "bg-[var(--bg-canvas)]"} text-[var(--icon-primary)]`}>
                <Icon name="folder_open" size={40} />
              </span>
              <p className="text-[22px] font-medium leading-[28px] text-[var(--text-primary)]">{dragging ? S.dropHere : S.drop}</p>
              <Button variant="primary" onClick={() => input.current?.click()}>{S.browse}</Button>
            </div>
          )}
          {phase.kind === "reading" && (
            <div className="flex items-center gap-[var(--space-12)] text-[18px] leading-[22px] text-[var(--text-secondary)]">
              <span className="flex animate-spin text-[var(--icon-secondary)]"><Icon name="spinner" size={22} /></span>
              <span>{S.reading}</span>
              <span className="max-w-[600px] truncate font-medium text-[var(--text-primary)]">{phase.name}</span>
            </div>
          )}
          {phase.kind === "uploading" && (
            <div className="flex w-[600px] flex-col gap-[var(--space-24)] text-left">
              <div className="flex flex-col gap-[var(--space-8)]">
                <p className="truncate text-[22px] font-semibold leading-[28px] text-[var(--text-primary)]">{phase.name}</p>
                <p className="text-[16px] leading-[20px] text-[var(--text-secondary)]">{S.uploading}</p>
              </div>
              <div className="flex flex-col gap-[var(--space-12)]">
                <span className="text-[18px] font-semibold leading-[22px] text-[var(--text-primary)]">{percent}%</span>
                <div className="relative h-[6px] w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--neutral-150)]">
                  <div className="absolute inset-y-0 left-0 rounded-[var(--radius-full)] bg-[var(--bg-inverse)] transition-[width]" style={{ width: `${percent}%` }} />
                </div>
              </div>
              <Button className="self-start" onClick={() => setConfirmCancel(true)}>{S.cancel}</Button>
            </div>
          )}
          {phase.kind === "error" && (
            <div role="alert" className="flex flex-col items-center gap-[var(--space-12)]">
              <span className="mb-[var(--space-12)] flex size-[96px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--bg-error-subtle)] text-[var(--status-error)]">
                <Icon name="error_outline" size={40} />
              </span>
              <p className="text-[22px] font-semibold leading-[28px] text-[var(--text-error)]">{phase.title}</p>
              <p className="text-[16px] leading-[20px] text-[var(--text-secondary)]">{phase.body}</p>
              <Button className="mt-[var(--space-12)]" onClick={() => { setPhase({ kind: "idle" }); input.current?.click(); }}>{S.tryAnother}</Button>
            </div>
          )}
          <input ref={input} type="file" className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
        </div>

        <div className="mt-[var(--space-24)] grid grid-cols-3 gap-[20.4px]">
          {S.formats.map((f) => (
            <div key={f.ext} className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] bg-[var(--bg-surface)] px-[28.5px] py-[var(--space-24)]">
              <span className="text-[28px] font-semibold leading-[36px] text-[var(--sage-800)]">{f.ext}</span>
              <span className="text-[16px] leading-[20px] text-[var(--sage-500)]">{f.note}</span>
            </div>
          ))}
        </div>
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
