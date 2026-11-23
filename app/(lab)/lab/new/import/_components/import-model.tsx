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
      // The host can answer with a plain-text page (Vercel 413 over 4.5 MB): parse defensively so the promise always settles.
      let json: { error?: { message?: string; code?: string } } | Upload | null = null;
      try {
        json = JSON.parse(xhr.responseText || "null");
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && json) return resolve(json as Upload);
      if (xhr.status === 413) return reject(Object.assign(new Error("Upload body limit"), { code: "BODY_LIMIT" }));
      const err = (json as { error?: { message?: string; code?: string } } | null)?.error;
      reject(Object.assign(new Error(err?.message ?? `Upload failed (${xhr.status})`), { code: err?.code }));
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
      // Analysis only uses the browser reading + file name/size; the stored copy is a keepsake. The deployed host caps request
      // bodies at 4.5 MB (413), so a larger model continues without a server copy instead of failing.
      // shortcut: no server copy of big models on the deploy; switch to direct Blob uploads if anything ever needs the bytes.
      const saved = await upload(file, projectId, (loaded) => setPhase((p) => (p.kind === "uploading" ? { ...p, loaded } : p)), xhr).catch(
        (err: { code?: string }) => {
          if (err.code === "BODY_LIMIT") return { name: file.name, size: file.size, path: "" };
          throw err;
        },
      );
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

  const zoneContent = (
    <>
      {phase.kind === "idle" && (
        <div className="relative flex flex-col items-center gap-[var(--space-8)]">
          <span className="mb-[var(--space-16)] flex size-[96px] items-center justify-center rounded-[28px] bg-[var(--neutral-0)] shadow-[0_8px_24px_var(--effect-shadow)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/figma/import/upload.svg" alt="" width={56} height={56} className={dragging ? "anim-float" : undefined} />
          </span>
          <p className="text-[28px] font-semibold text-[var(--home-ink)]">{dragging ? S.dropHere : S.drop}</p>
          <p className="text-[17px] text-[var(--home-ink-2)]">
            {S.or}
            <button type="button" onClick={() => input.current?.click()} className="font-medium text-[var(--home-ink)] underline underline-offset-4 hover:text-[var(--sage-500)]">
              {S.browse}
            </button>
          </p>
          <p className="mt-[var(--space-16)] text-[13px] text-[var(--home-ink-3)]">{S.supports}</p>
        </div>
      )}
      {phase.kind === "reading" && (
        <div className="relative flex items-center gap-[var(--space-12)] text-[17px] text-[var(--home-ink-2)]">
          <span className="flex animate-spin text-[var(--home-ink-3)]"><Icon name="spinner" size={22} /></span>
          <span>{S.reading}</span>
          <span className="max-w-[500px] truncate font-medium text-[var(--home-ink)]">{phase.name}</span>
        </div>
      )}
      {phase.kind === "uploading" && (
        <div className="relative flex w-[520px] max-w-full flex-col gap-[var(--space-24)] text-left">
          <div className="flex flex-col gap-[4px]">
            <p className="truncate text-[22px] font-semibold text-[var(--home-ink)]">{phase.name}</p>
            <p className="text-[15px] text-[var(--home-ink-2)]">{S.uploading}</p>
          </div>
          <div className="flex flex-col gap-[var(--space-12)]">
            <span className="text-[17px] font-semibold tabular-nums text-[var(--home-ink)]">{percent}%</span>
            <div className="relative h-[6px] w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--neutral-0)]">
              <div className="absolute inset-y-0 left-0 rounded-[var(--radius-full)] bg-[var(--home-ink)] transition-[width]" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <Button className="self-start" onClick={() => setConfirmCancel(true)}>{S.cancel}</Button>
        </div>
      )}
      {phase.kind === "error" && (
        <div role="alert" className="relative flex flex-col items-center gap-[var(--space-8)] py-[var(--space-16)]">
          <span className="mb-[var(--space-8)] flex size-[64px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--bg-error-subtle)] text-[var(--status-error)]">
            <Icon name="error_outline" size={32} />
          </span>
          <p className="text-[22px] font-semibold text-[var(--text-error)]">{phase.title}</p>
          <p className="text-[15px] text-[var(--home-ink-2)]">{phase.body}</p>
          <Button className="mt-[var(--space-8)]" onClick={() => { setPhase({ kind: "idle" }); input.current?.click(); }}>{S.tryAnother}</Button>
        </div>
      )}
    </>
  );

  // Lab UI (user review): the Figma W02B-2 photo background is gone. One white sheet centred on the Lab canvas (picked from
  // four drafts): title, drop zone on canvas grey, format chips, then the rigged-model hint and PURE's Robot shortcut.
  return (
    <>
      <div data-fit-frame className="relative flex h-[var(--app-vh)] min-h-[760px] flex-col items-center justify-center overflow-hidden bg-[var(--home-canvas)] p-[var(--space-40)] leading-normal">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/lab/home/glow.svg" alt="" aria-hidden className="pointer-events-none absolute left-[26px] top-[-360px] h-[680px] w-[1360px] max-w-none" />
        <Link
          href="/lab"
          className="absolute left-[var(--space-40)] top-[42px] flex h-[44px] items-center gap-[var(--space-8)] rounded-[var(--radius-sm)] bg-[var(--home-glass)] px-[var(--space-20)] text-[15px] font-medium text-[var(--home-ink)] hover:bg-[var(--neutral-0)]"
        >
          <span aria-hidden>←</span>
          {STRINGS.sidebar.lab}
        </Link>

        <div className="relative flex w-[1040px] flex-col gap-[var(--space-28)] rounded-[32px] border border-[var(--home-line)] bg-[var(--neutral-0)] p-[var(--space-40)] shadow-[0_24px_48px_var(--effect-shadow)]">
          <header className="mb-[var(--space-16)] flex flex-col items-center gap-[var(--space-8)] text-center">
            <h1 className="text-[44px] font-semibold leading-[1.15] text-[var(--home-ink)]">{replaceId ? S.replaceTitle : S.title}</h1>
            <p className="text-[17px] text-[var(--home-ink-2)]">{S.subtitle}</p>
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
            className={`relative flex h-[340px] flex-col items-center justify-center rounded-[24px] text-center transition-colors ${dragging ? "bg-[var(--sage-50)]" : "bg-[var(--home-canvas)]"}`}
          >
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-[var(--space-12)] rounded-[18px] border-[1.5px] border-dashed ${
                dragging ? "border-[var(--sage-400)]" : phase.kind === "error" ? "border-[var(--border-error)]" : "border-[var(--neutral-300)]"
              }`}
            />
            {zoneContent}
            <input ref={input} type="file" accept={EXTS.join(",")} className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
          </div>

          <div className="flex justify-center gap-[var(--space-8)]">
            {S.formats.map((f) => (
              <button
                key={f.ext}
                type="button"
                disabled={busy}
                onClick={() => input.current?.click()}
                className="flex items-center gap-[var(--space-8)] rounded-[var(--radius-full)] border border-[var(--home-line)] bg-[var(--neutral-0)] py-[6px] pl-[6px] pr-[var(--space-16)] text-left hover:border-[var(--home-ink-3)] disabled:pointer-events-none disabled:opacity-50"
              >
                <span className="flex size-[32px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--home-canvas)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/figma/import/${f.icon}.svg`} alt="" width={18} height={18} />
                </span>
                <span className="text-[15px] font-semibold text-[var(--home-ink)]">{f.ext}</span>
                <span className="text-[13px] text-[var(--home-ink-3)]">{f.note}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-[var(--space-16)] border-t border-[var(--home-line)] pt-[var(--space-24)]">
            <span className="flex size-[36px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--home-canvas)] text-[var(--home-ink-2)]">
              <Icon name="info" size={18} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <p className="text-[15px] font-semibold text-[var(--home-ink)]">{S.hint.title}</p>
              <p className="text-[13px] text-[var(--home-ink-3)]">{S.hint.body}</p>
            </div>
            {!replaceId && (
              <Link
                href="/lab/new/type"
                className="flex h-[44px] shrink-0 items-center whitespace-pre rounded-[var(--radius-sm)] bg-[var(--home-canvas)] px-[22px] text-[15px] font-medium text-[var(--home-ink-2)] hover:bg-[var(--home-pill)] hover:text-[var(--home-ink)]"
              >
                {S.noFile}
              </Link>
            )}
          </div>
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
    </>
  );
}
