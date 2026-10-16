"use client";

import { useRef } from "react";
import { COMPONENTS } from "@/data/components";
import { SITUATION_PATTERNS } from "@/data/patterns";
import { STRINGS } from "@/data/strings";
import type { Reference } from "@/lib/models";
import { fileUrl } from "@/lib/ui/upload";
import { Button } from "@/components/ui/button";

const E = STRINGS.editor;

export interface EditorContext {
  currentStatus: string;
  components: string[];
  pattern: string;
  references: Reference[];
  /** Last prompt, reused when a component chip regenerates */
  lastPrompt: string;
}

export type PendingReference = { id: string; name: string };

// W02D Context tab: Current Status, Component chips, Situation Pattern, Reference.
export function ContextPanel({
  context,
  pending,
  busy,
  onChange,
  onToggleComponent,
  onAddFiles,
  onRemoveReference,
  onOpenReference,
  activeReference,
}: {
  context: EditorContext;
  pending: PendingReference[];
  busy: boolean;
  onChange: (patch: Partial<EditorContext>) => void;
  onToggleComponent: (id: string) => void;
  onAddFiles: (files: FileList) => void;
  onRemoveReference: (id: string) => void;
  onOpenReference: (r: Reference) => void;
  activeReference: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const full = context.references.length + pending.length >= 4;

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-500">{E.currentStatus}</span>
        <textarea
          value={context.currentStatus}
          onChange={(e) => onChange({ currentStatus: e.target.value })}
          placeholder={E.statusPlaceholder}
          maxLength={300}
          rows={2}
          className="resize-none rounded border border-neutral-300 px-2 py-1.5"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-neutral-500">{E.component}</span>
        <div className="flex flex-wrap gap-1.5">
          {COMPONENTS.map((c) => {
            const on = context.components.includes(c.id);
            return (
              <button
                key={c.id}
                title={c.description}
                disabled={busy}
                aria-pressed={on}
                onClick={() => onToggleComponent(c.id)}
                className={`rounded-full border px-2.5 py-0.5 text-xs disabled:opacity-40 ${on ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:bg-neutral-100"}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-neutral-400">{E.componentHint}</span>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-500">{E.pattern}</span>
        <select value={context.pattern} onChange={(e) => onChange({ pattern: e.target.value })} className="rounded border border-neutral-300 px-2 py-1.5">
          <option value="">{E.patternNone}</option>
          {SITUATION_PATTERNS.map((p) => <option key={p.id} value={p.id} title={p.hint}>{p.label}</option>)}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-neutral-500">{E.reference}</span>
        {context.references.map((r) => (
          <div key={r.id} data-testid="reference" className={`flex items-center gap-2 rounded border p-1.5 ${r.status === "failed" ? "border-red-300" : activeReference === r.id ? "border-neutral-900" : "border-neutral-200"}`}>
            <button title={E.sync.open} className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onOpenReference(r)}>
            {r.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl(r.thumb)} alt="" className="h-10 w-14 rounded object-cover" />
            ) : (
              <span className="h-10 w-14 rounded bg-neutral-100" />
            )}
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs">{r.path.split("/").pop()?.replace(/^[0-9a-f]{8}-/, "")}</span>
              <span className={`text-xs ${r.status === "failed" ? "text-red-600" : "text-neutral-500"}`}>
                {r.status === "failed" ? E.referenceFailed : r.durationS ? `${r.durationS.toFixed(1)}s · ${r.frames?.length ?? 0} frames` : r.kind}
              </span>
            </span>
            </button>
            <button aria-label={E.removeReference} className="px-1 text-neutral-400 hover:text-neutral-900" onClick={() => onRemoveReference(r.id)}>×</button>
          </div>
        ))}
        {pending.map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded border border-dashed border-neutral-300 p-1.5 text-xs text-neutral-500">
            <span className="h-10 w-14 animate-pulse rounded bg-neutral-100" />
            <span className="truncate">{p.name} · {E.referenceUploading}</span>
          </div>
        ))}
        <Button disabled={full} onClick={() => input.current?.click()}>+ {E.addReference}</Button>
        <span className="text-xs text-neutral-400">{full ? E.referenceLimit : E.referenceRules}</span>
        <input
          ref={input}
          type="file"
          accept="image/*,video/mp4,video/quicktime,video/webm"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onAddFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
