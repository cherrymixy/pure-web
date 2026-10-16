"use client";

import { useState } from "react";
import { COMPONENTS } from "@/data/components";
import { SITUATION_PATTERNS } from "@/data/patterns";
import { referenceSetFor, type ReferenceItem } from "@/data/reference-sets";
import { STRINGS, fmt } from "@/data/strings";
import type { Reference } from "@/lib/models";
import { LOG_VISIBLE, splitLog, type InputEntry } from "@/lib/ui/input-log";
import { timeAgo } from "@/lib/ui/time";
import { fileUrl } from "@/lib/ui/upload";

const E = STRINGS.editor;


export interface EditorContext {
  components: string[];
  pattern: string;
  /** Attachments for the next input (tray above the prompt) */
  references: Reference[];
  /** Newest first */
  inputs: InputEntry[];
  /** Last prompt, reused when a component chip regenerates */
  lastPrompt: string;
}

export type PendingReference = { id: string; name: string };

const fileName = (r: Reference) =>
  r.kind === "userData" ? fmt(STRINGS.userData.referenceLabel, { name: r.path }) : r.path.split("/").pop()?.replace(/^[0-9a-f]{8}-/, "") ?? "";

// W02D Context tab: Current Status (latest input) + input log, Component chips, Situation Pattern,
// Reference = what the AI referenced (face / motion / sound sets per behavior).
export function ContextPanel({
  context,
  behaviors,
  busy,
  reading = [],
  activeReference,
  onChange,
  onToggleComponent,
  onOpenReference,
}: {
  context: EditorContext;
  /** Behaviors of the current expression, in recipe order */
  behaviors: string[];
  busy: boolean;
  reading?: string[];
  activeReference: string | null;
  onChange: (patch: Partial<EditorContext>) => void;
  onToggleComponent: (id: string) => void;
  onOpenReference: (r: Reference) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { latest, shown, hidden } = splitLog(context.inputs, expanded);
  const older = context.inputs.length - 1;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-1.5">
        <span className="text-xs text-neutral-500">{E.currentStatus}</span>
        {latest ? (
          <InputCard entry={latest} strong reading={reading} activeReference={activeReference} onOpen={onOpenReference} />
        ) : (
          <p className="rounded border border-dashed border-neutral-300 p-2 text-xs text-neutral-500">{E.statusEmpty}</p>
        )}
        {older > 0 && (
          <div className="flex flex-col gap-1.5" data-testid="input-log">
            <span className="mt-1 text-xs text-neutral-500">{E.inputLog}</span>
            {shown.map((entry) => (
              <InputCard key={entry.id} entry={entry} reading={reading} activeReference={activeReference} onOpen={onOpenReference} />
            ))}
            {older > LOG_VISIBLE && (
              <button className="self-start text-xs underline" onClick={() => setExpanded(!expanded)}>
                {expanded ? E.showLess : fmt(E.showMore, { n: hidden })}
              </button>
            )}
          </div>
        )}
      </section>

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

      <ReferencedSets behaviors={behaviors} />
    </div>
  );
}

function InputCard({
  entry,
  strong = false,
  reading,
  activeReference,
  onOpen,
}: {
  entry: InputEntry;
  strong?: boolean;
  reading: string[];
  activeReference: string | null;
  onOpen: (r: Reference) => void;
}) {
  return (
    <div className={`flex flex-col gap-1 rounded border p-2 ${strong ? "border-neutral-900" : "border-neutral-200"}`} data-testid={strong ? "current-status" : "input-entry"}>
      <span className={strong ? "font-semibold" : "text-neutral-700"}>{entry.text}</span>
      {entry.attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.attachments.map((r) => (
            <button
              key={r.id}
              title={r.summary ?? fileName(r)}
              onClick={() => onOpen(r)}
              className={`flex items-center gap-1 rounded border px-1 py-0.5 text-xs ${r.status === "failed" ? "border-red-300 text-red-600" : activeReference === r.id ? "border-neutral-900" : "border-neutral-200"}`}
            >
              {r.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(r.thumb)} alt="" className="h-5 w-7 rounded object-cover" />
              ) : (
                <span>{r.kind === "video" ? "▶" : r.kind === "userData" ? "◇" : "▣"}</span>
              )}
              <span className="max-w-28 truncate">{fileName(r)}</span>
              {r.status === "failed" ? <span>· {E.referenceFailed}</span> : reading.includes(r.id) ? <span>· {E.referenceReading}</span> : null}
            </button>
          ))}
        </div>
      )}
      <span className="text-[10px] text-neutral-400">{timeAgo(entry.at)}</span>
    </div>
  );
}

/** What the AI referenced: one set (face / motion / sound) per behavior in the expression. */
function ReferencedSets({ behaviors }: { behaviors: string[] }) {
  const sets = [...new Set(behaviors)].map((b) => referenceSetFor(b)).filter((s) => s !== undefined);
  const [pick, setPick] = useState(0);
  const set = sets[Math.min(pick, sets.length - 1)];
  const label = (id: string) => COMPONENTS.find((c) => c.id === id)?.label ?? id;

  return (
    <section className="flex flex-col gap-2" data-testid="referenced">
      <span className="text-xs text-neutral-500">{E.referencedTitle}</span>
      {!set ? (
        <p className="text-xs text-neutral-400">{E.referencedEmpty}</p>
      ) : (
        <>
          {sets.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {sets.map((s, i) => (
                <button key={s.behavior} aria-pressed={s === set} onClick={() => setPick(i)} className={`rounded-full border px-2 py-0.5 text-xs ${s === set ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}>
                  {label(s.behavior)}
                </button>
              ))}
            </div>
          )}
          {sets.length === 1 && <span className="text-xs text-neutral-500">{fmt(E.referencedFor, { behavior: label(set.behavior) })}</span>}
          {set.items.map((it) => <ReferencedItem key={it.channel} item={it} />)}
        </>
      )}
    </section>
  );
}

function ReferencedItem({ item }: { item: ReferenceItem }) {
  const video = item.file.endsWith(".webm");
  const audio = item.file.endsWith(".ogg");
  return (
    <figure className="flex flex-col gap-1 rounded border border-neutral-200 p-1.5" data-testid={`referenced-${item.channel}`}>
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0 text-[10px] uppercase tracking-wide text-neutral-500">{E.tabs[item.channel]}</span>
        <b className="truncate text-xs">{item.title}</b>
      </div>
      {audio ? (
        <audio src={item.file} controls className="h-7 w-full" />
      ) : video ? (
        <video src={item.file} poster={item.poster ?? undefined} muted loop autoPlay playsInline className="aspect-video w-full rounded object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.file} alt={item.title} className="aspect-video w-full rounded object-cover" />
      )}
      <span className="text-xs text-neutral-600">{item.note}</span>
      <figcaption className="truncate text-[10px] text-neutral-400">
        <a href={item.source.page} target="_blank" rel="noreferrer" className="underline">{fmt(E.referenceSource, { license: item.source.license, author: item.source.author })}</a>
      </figcaption>
    </figure>
  );
}
