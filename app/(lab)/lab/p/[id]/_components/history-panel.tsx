"use client";

import { simBehaviorLabel } from "@/data/sim-behaviors";
import { STRINGS, fmt } from "@/data/strings";
import type { Expression } from "@/lib/models";
import { timeAgo } from "@/lib/ui/time";

const H = STRINGS.editor.history;

/** One request (generate or "@motion" edit) in the History tab: its latest version, so slider edits fold into it. */
export interface HistoryEntry {
  version: number;
  title: string;
  /** The designer's request ("I'm tired"); older versions without one show their status line */
  request: string;
  at: string;
  version_: Expression;
  current: boolean;
}

/** "Tired Doze" → "tired-doze" for the @mention */
export const mentionOf = (title: string) => title.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "") || "motion";

/** Newest first, one entry per request: consecutive versions with the same request collapse into the newest. */
export function historyEntries(e: Expression | null): HistoryEntry[] {
  if (!e) return [];
  const all = [e, ...[...e.history].reverse()];
  const key = (v: Expression) => v.prompt ?? `${v.name}|${v.currentStatus}`;
  const out: HistoryEntry[] = [];
  for (const v of all) {
    if (out.length && key(out[out.length - 1].version_) === key(v)) continue;
    out.push({ version: v.version, title: v.name, request: v.prompt ?? v.currentStatus, at: v.createdAt, version_: v, current: v === e });
  }
  return out;
}

/** What the chosen motion does, in one card: steps in order, face, sound. */
export function MotionSummary({ entry, duration }: { entry: HistoryEntry; duration?: number }) {
  const v = entry.version_;
  const steps = v.motion.recipe.steps;
  return (
    <div className="flex flex-col gap-[var(--space-12)] rounded-[14px] bg-[var(--home-canvas)] p-[var(--space-16)]">
      <div className="flex items-baseline gap-[var(--space-8)]">
        <span className="text-[18px] font-semibold text-[var(--home-ink)]">{entry.title}</span>
        <code className="font-mono text-[12px] text-[var(--home-ink-3)]">@{mentionOf(entry.title)}</code>
      </div>
      <p className="text-[14px] leading-[1.45] text-[var(--home-ink-2)]">“{entry.request}”</p>
      <dl className="grid grid-cols-[64px_1fr] gap-x-[var(--space-8)] gap-y-[6px] text-[13px] leading-[1.45]">
        <dt className="text-[var(--home-ink-3)]">{H.motion}</dt>
        <dd className="text-[var(--home-ink)]">
          {steps.map((s, i) => (
            <span key={i}>
              {i > 0 && <span className="text-[var(--home-ink-3)]"> → </span>}
              {simBehaviorLabel(s.behavior)}
              {s.repeat > 1 ? ` ×${s.repeat}` : ""}
            </span>
          ))}
        </dd>
        <dt className="text-[var(--home-ink-3)]">{H.size}</dt>
        <dd className="text-[var(--home-ink)]">
          {fmt(H.sizeValue, { amp: Math.round((steps.reduce((a, s) => a + s.amplitude, 0) / Math.max(1, steps.length)) * 100), speed: (steps.reduce((a, s) => a + s.speed, 0) / Math.max(1, steps.length)).toFixed(1) })}
        </dd>
        <dt className="text-[var(--home-ink-3)]">{H.face}</dt>
        <dd className="text-[var(--home-ink)]">{v.face.preset || H.none}</dd>
        <dt className="text-[var(--home-ink-3)]">{H.sound}</dt>
        <dd className="text-[var(--home-ink)]">{v.sound.cues.length ? v.sound.cues.map((c) => c.sound).join(", ") : H.none}</dd>
        {duration ? (
          <>
            <dt className="text-[var(--home-ink-3)]">{H.length}</dt>
            <dd className="text-[var(--home-ink)]">{duration.toFixed(1)} s</dd>
          </>
        ) : null}
      </dl>
      <p className="text-[12px] leading-[1.45] text-[var(--home-ink-3)]">{fmt(H.editHint, { mention: mentionOf(entry.title) })}</p>
    </div>
  );
}

export function HistoryPanel({
  entries,
  selected,
  duration,
  busy,
  onPick,
}: {
  entries: HistoryEntry[];
  /** The entry on the robot (the @mention) */
  selected: number | null;
  duration?: number;
  busy: boolean;
  onPick: (e: HistoryEntry) => void;
}) {
  if (!entries.length) return <p className="text-[14px] leading-[1.5] text-[var(--home-ink-3)]">{H.empty}</p>;
  const sel = entries.find((e) => e.version === selected) ?? entries[0];
  return (
    <div className="flex flex-col gap-[var(--space-16)]">
      <MotionSummary entry={sel} duration={sel.current ? duration : undefined} />
      <ol className="flex flex-col gap-[4px]" aria-label={H.title}>
        {entries.map((e) => {
          const on = e.version === sel.version;
          return (
            <li key={e.version}>
              <button
                type="button"
                disabled={busy}
                aria-current={on ? "true" : undefined}
                onClick={() => onPick(e)}
                className={`flex w-full flex-col items-start gap-[2px] rounded-[12px] px-[var(--space-12)] py-[10px] text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${on ? "bg-[var(--home-ink)] text-[var(--neutral-0)]" : "hover:bg-[var(--home-canvas)]"}`}
              >
                <span className="flex w-full items-center gap-[var(--space-8)]">
                  <span className={`text-[15px] font-semibold ${on ? "" : "text-[var(--home-ink)]"}`}>{e.title}</span>
                  {e.current && <span className={`rounded-[var(--radius-full)] px-[6px] text-[11px] ${on ? "bg-[color-mix(in_srgb,var(--neutral-0)_20%,transparent)]" : "bg-[var(--home-pill)] text-[var(--home-ink-2)]"}`}>{H.now}</span>}
                  <span className="flex-1" />
                  <span className={`text-[12px] ${on ? "opacity-70" : "text-[var(--home-ink-3)]"}`}>{timeAgo(e.at)}</span>
                </span>
                <span className={`line-clamp-1 text-[13px] ${on ? "opacity-80" : "text-[var(--home-ink-2)]"}`}>{e.request}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
