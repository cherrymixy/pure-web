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

  // Figma W02B-2 (936:8422), 960 frame ×2: bg art at 70%, back pill 48/40, title 54 sage-700 + subtitle at 122,
  // drop card 855×296 (13.5 white ring, 1.69 dashed neutral-400) at 332, "No file yet?" at 658, format cards at 744,
  // divider at 889 and the rigged-model hint row at 915 (1105 wide). Everything sits 4px right of center as in Figma.
  return (
    <div className="relative flex min-h-[var(--app-vh)] flex-col items-center overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/import/bg@2x.png" alt="" aria-hidden className="pointer-events-none absolute inset-0 size-full object-cover opacity-70" />

      <Link
        href="/lab"
        className="absolute left-[48px] top-[var(--space-40)] flex h-[48px] w-fit items-center gap-[var(--space-12)] rounded-[var(--radius-full)] border-2 border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-16)] text-[16px] font-medium leading-[20px] text-[var(--text-link)] hover:bg-[var(--neutral-50)]"
      >
        <span aria-hidden>←</span>
        <span>{STRINGS.sidebar.lab}</span>
      </Link>

      <header className="relative left-[4px] mt-[122px] flex w-[796px] flex-col items-center gap-[var(--space-28)] text-center text-[var(--sage-700)]">
        <h1 className="text-[54px] font-semibold leading-normal">{replaceId ? S.replaceTitle : S.title}</h1>
        <p className="whitespace-nowrap text-[18px] font-medium leading-normal opacity-60">{S.subtitle}</p>
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
        className={`relative left-[4.5px] mt-[69px] flex min-h-[296px] w-[855px] flex-col items-center justify-center rounded-[var(--radius-2xl)] border-[13.5px] border-[var(--neutral-0)] text-center transition-colors ${
          dragging ? "bg-[var(--sage-50)]" : "bg-[var(--bg-surface)]"
        }`}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 rounded-[calc(var(--radius-2xl)-13.5px)] border-[1.69px] border-dashed ${
            dragging ? "border-[var(--border-strong)]" : phase.kind === "error" ? "border-[var(--border-error)]" : "border-[var(--neutral-400)]"
          }`}
        />
        {phase.kind === "idle" && (
          <div className="flex w-full flex-col items-center pb-[var(--space-24)] pt-[22.5px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/figma/import/upload.svg" alt="" width={88} height={88} className={dragging ? "anim-float" : undefined} />
            <p className="mt-[var(--space-16)] text-[28px] font-medium leading-normal text-[var(--neutral-800)]">{dragging ? S.dropHere : S.drop}</p>
            <p className="text-[20px] leading-[1.5] text-[var(--neutral-1000)]/50">
              {S.or}
              <button type="button" onClick={() => input.current?.click()} className="text-[var(--sage-200)] hover:text-[var(--sage-300)]">
                {S.browse}
              </button>
            </p>
            <p className="mt-[42px] text-[14px] leading-normal text-[var(--neutral-400)]">{S.supports}</p>
          </div>
        )}
        {phase.kind === "reading" && (
          <div className="flex items-center gap-[var(--space-12)] text-[18px] leading-[22px] text-[var(--text-secondary)]">
            <span className="flex animate-spin text-[var(--icon-secondary)]"><Icon name="spinner" size={22} /></span>
            <span>{S.reading}</span>
            <span className="max-w-[500px] truncate font-medium text-[var(--text-primary)]">{phase.name}</span>
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
          <div role="alert" className="flex flex-col items-center gap-[var(--space-8)] py-[var(--space-16)]">
            <span className="mb-[var(--space-8)] flex size-[64px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--bg-error-subtle)] text-[var(--status-error)]">
              <Icon name="error_outline" size={32} />
            </span>
            <p className="text-[22px] font-semibold leading-[28px] text-[var(--text-error)]">{phase.title}</p>
            <p className="text-[16px] leading-[20px] text-[var(--text-secondary)]">{phase.body}</p>
            <Button className="mt-[var(--space-8)]" onClick={() => { setPhase({ kind: "idle" }); input.current?.click(); }}>{S.tryAnother}</Button>
          </div>
        )}
        <input ref={input} type="file" accept={EXTS.join(",")} className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
      </div>

      {!replaceId && (
        <Link href="/lab/new/type" className="relative mt-[30px] whitespace-pre text-[16px] font-medium leading-normal text-[var(--text-link)] hover:text-[var(--text-primary)]">
          {S.noFile}
        </Link>
      )}

      <div className={`relative left-[0.5px] flex gap-[var(--space-16)] ${replaceId ? "mt-[116px]" : "mt-[66px]"}`}>
        {S.formats.map((f) => (
          <button
            key={f.ext}
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="flex items-center gap-[var(--space-40)] rounded-[var(--radius-xl)] bg-[var(--bg-surface)] px-[var(--space-28)] py-[var(--space-16)] text-left hover:bg-[var(--neutral-50)] disabled:pointer-events-none"
          >
            <span className="flex size-[75px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--sage-50)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/figma/import/${f.icon}.svg`} alt="" width={38} height={38} />
            </span>
            <span className="flex w-[196px] items-center justify-between">
              <span className="flex flex-col gap-[var(--space-4)] whitespace-nowrap font-medium leading-normal">
                <span className="text-[24px] text-[var(--text-primary)]">{f.ext}</span>
                <span className="text-[16px] text-[var(--neutral-500)]">{f.note}</span>
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/figma/import/chevron-right.svg" alt="" width={12} height={24} />
            </span>
          </button>
        ))}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/import/line.svg" alt="" aria-hidden width={1105} height={1} className="relative left-[4.5px] mt-[34px]" />

      <div className="relative left-[4.5px] mt-[26px] flex w-[1105px] items-center justify-between opacity-90">
        <div className="flex items-center gap-[var(--space-20)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/import/info.svg" alt="" width={38} height={38} />
          <div className="flex flex-col gap-[var(--space-4)] whitespace-nowrap leading-normal text-[var(--neutral-600)]">
            <p className="text-[18px] font-semibold">{S.hint.title}</p>
            <p className="text-[16px] opacity-50">{S.hint.body}</p>
          </div>
        </div>
        <Link href="/lab/guideline" target="_blank" className="flex items-center gap-[var(--space-8)] text-[18px] font-semibold leading-normal text-[var(--neutral-600)] hover:text-[var(--text-primary)]">
          {S.guide}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/import/square-top-down.svg" alt="" width={24} height={24} />
        </Link>
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
