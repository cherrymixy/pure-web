"use client";

import { useState } from "react";
import { COMPONENTS } from "@/data/components";
import { SITUATION_PATTERNS } from "@/data/patterns";
import { STRINGS, fmt } from "@/data/strings";
import type { Reference } from "@/lib/models";
import { LOG_VISIBLE, splitLog, type InputEntry } from "@/lib/ui/input-log";
import { timeAgo } from "@/lib/ui/time";
import { fileUrl } from "@/lib/ui/upload";
import { ReferencedSets } from "@/components/ui/referenced-sets";
import { Icon } from "@/components/ui/icons/icon";

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
  r.kind === "userData" ? fmt(STRINGS.community.referenceLabel, { name: r.path }) : r.path.split("/").pop()?.replace(/^[0-9a-f]{8}-/, "") ?? "";

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

  const title = "flex items-center gap-[var(--space-8)] text-[18px] leading-[23px] text-[var(--text-primary)]";
  const box = "flex w-full flex-col gap-[var(--space-12)] rounded-[var(--radius-lg)] bg-[var(--bg-canvas)] px-[var(--space-20)] py-[var(--space-16)]";
  const row = "flex w-full items-center justify-between text-left text-[16px] leading-[20px] text-[var(--text-primary)] disabled:opacity-40";

  // Figma W02D-1 (901:9915 ×2): sections at x 19 / width 301 — Current Status, Reference, Component, Situation Pattern.
  return (
    <div className="flex w-[301px] flex-col gap-[56px]">
      <section className="flex flex-col gap-[var(--space-16)]">
        <h3 className="text-[18px] leading-[23px] text-[var(--text-primary)]">{E.currentStatus}</h3>
        {latest ? (
          <InputCard entry={latest} strong reading={reading} activeReference={activeReference} onOpen={onOpenReference} />
        ) : (
          <p className="rounded-[var(--radius-lg)] bg-[var(--bg-canvas)] py-[var(--space-16)] pl-[var(--space-12)] pr-[var(--space-20)] text-[16px] leading-[20px] text-[var(--text-tertiary)]">{E.statusEmpty}</p>
        )}
        {older > 0 && (
          <div className="flex flex-col gap-[var(--space-8)]" data-testid="input-log">
            <span className="mt-[var(--space-4)] text-[14px] leading-[18px] text-[var(--text-secondary)]">{E.inputLog}</span>
            {shown.map((entry) => (
              <InputCard key={entry.id} entry={entry} reading={reading} activeReference={activeReference} onOpen={onOpenReference} />
            ))}
            {older > LOG_VISIBLE && (
              <button className="self-start text-[14px] leading-[18px] text-[var(--text-link)] underline" onClick={() => setExpanded(!expanded)}>
                {expanded ? E.showLess : fmt(E.showMore, { n: hidden })}
              </button>
            )}
          </div>
        )}
      </section>

      <ReferencedSets behaviors={behaviors} variant="strip" />

      <section className="flex flex-col gap-[var(--space-16)]">
        <h3 className={title}>
          <Icon name="widget" size={24} className="shrink-0 text-[var(--neutral-800)]" />
          {E.component}
        </h3>
        <div className={box} role="group" aria-label={E.component} title={E.componentHint}>
          {COMPONENTS.map((c) => {
            const on = context.components.includes(c.id);
            return (
              <button
                key={c.id}
                title={c.description}
                disabled={busy}
                aria-pressed={on}
                onClick={() => onToggleComponent(c.id)}
                className={`${row} ${on ? "font-semibold" : ""}`}
              >
                {c.label}
                <Icon name={on ? "check" : "chevron-right-thin"} size={24} className={on ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-[var(--space-16)]">
        <h3 className={title}>
          <Icon name="round-graph" size={24} className="shrink-0 text-[var(--neutral-800)]" />
          {E.pattern}
        </h3>
        <div className={box} role="radiogroup" aria-label={E.pattern}>
          {SITUATION_PATTERNS.map((p) => {
            const on = context.pattern === p.id;
            return (
              <button
                key={p.id}
                role="radio"
                aria-checked={on}
                title={p.hint}
                onClick={() => onChange({ pattern: on ? "" : p.id })}
                className={`${row} ${on ? "font-semibold" : ""}`}
              >
                {p.label}
                <Icon name={on ? "check" : "chevron-right-thin"} size={24} className={on ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"} />
              </button>
            );
          })}
        </div>
      </section>
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
    <div
      className={`flex flex-col gap-[var(--space-12)] rounded-[var(--radius-lg)] py-[var(--space-16)] pl-[var(--space-12)] pr-[var(--space-20)] ${strong ? "bg-[var(--bg-canvas)]" : "border border-[var(--bg-canvas)]"}`}
      data-testid={strong ? "current-status" : "input-entry"}
    >
      <span className={`text-[16px] leading-[20px] ${strong ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{entry.text}</span>
      {entry.attachments.length > 0 && (
        <div className="flex flex-wrap gap-[var(--space-8)]">
          {entry.attachments.map((r) => (
            <button
              key={r.id}
              title={r.summary ?? fileName(r)}
              onClick={() => onOpen(r)}
              className={`flex items-center gap-[var(--space-8)] rounded-[var(--radius-sm)] border bg-[var(--bg-surface)] px-[var(--space-8)] py-[var(--space-4)] text-[14px] leading-[18px] ${r.status === "failed" ? "border-[var(--border-error)] text-[var(--text-error)]" : activeReference === r.id ? "border-[var(--border-strong)] text-[var(--text-primary)]" : "border-[var(--border-default)] text-[var(--text-primary)]"}`}
            >
              {r.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(r.thumb)} alt="" className="h-[20px] w-[28px] rounded-[var(--radius-2xs)] object-cover" />
              ) : (
                <span>{r.kind === "video" ? "▶" : r.kind === "userData" ? "◇" : "▣"}</span>
              )}
              <span className="max-w-[112px] truncate">{fileName(r)}</span>
              {r.status === "failed" ? <span>· {E.referenceFailed}</span> : reading.includes(r.id) ? <span>· {E.referenceReading}</span> : null}
            </button>
          ))}
        </div>
      )}
      <span className="text-[12px] leading-[15px] text-[var(--text-tertiary)]">{timeAgo(entry.at)}</span>
    </div>
  );
}
