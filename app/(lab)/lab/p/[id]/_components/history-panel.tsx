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

const avg = (xs: number[]) => xs.reduce((a, x) => a + x, 0) / Math.max(1, xs.length);

/** Section label, same as the Library tab's "Community" / "3D Asset" headers. */
function Section({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex h-[16px] items-center gap-[6px] text-[16px] font-medium leading-none text-[var(--library-section)]">
      {children}
      {count != null && <span className="text-[13px] font-normal text-[var(--home-ink-3)]">{count}</span>}
    </div>
  );
}

function Stat({ label, value, span }: { label: string; value: React.ReactNode; span: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-[2px] rounded-[12px] bg-[var(--home-canvas)] px-[12px] py-[10px]" style={{ gridColumn: `span ${span}` }}>
      <span className="text-[12px] leading-[15px] text-[var(--home-ink-3)]">{label}</span>
      <span className="truncate text-[14px] font-medium leading-[18px] text-[var(--home-ink)]">{value}</span>
    </div>
  );
}

/** What the chosen motion does: title, request, then steps / size / face / sound / length as small tiles. */
export function MotionSummary({ entry, duration }: { entry: HistoryEntry; duration?: number }) {
  const v = entry.version_;
  const steps = v.motion.recipe.steps;
  return (
    <div className="flex flex-col gap-[var(--space-12)]">
      <div className="flex flex-col gap-[6px]">
        <div className="flex items-center gap-[var(--space-8)]">
          <span className="min-w-0 truncate text-[20px] font-semibold leading-[25px] text-[var(--home-ink)]">{entry.title}</span>
          <span className="shrink-0 rounded-[var(--radius-full)] bg-[var(--home-pill)] px-[8px] py-[2px] text-[12px] font-medium leading-[16px] text-[var(--home-ink-2)]">@{mentionOf(entry.title)}</span>
        </div>
        <p className="text-[14px] leading-[1.45] text-[var(--home-ink-2)]">“{entry.request}”</p>
      </div>
      <div className="grid grid-cols-6 gap-[6px]">
        <Stat
          span={6}
          label={H.motion}
          value={steps.map((s, i) => (
            <span key={i}>
              {i > 0 && <span className="text-[var(--home-ink-3)]"> → </span>}
              {simBehaviorLabel(s.behavior)}
              {s.repeat > 1 ? ` ×${s.repeat}` : ""}
            </span>
          ))}
        />
        <Stat span={duration ? 2 : 3} label={H.size} value={`${Math.round(avg(steps.map((s) => s.amplitude)) * 100)}%`} />
        <Stat span={duration ? 2 : 3} label={H.speed} value={`${avg(steps.map((s) => s.speed)).toFixed(1)}×`} />
        {duration ? <Stat span={2} label={H.length} value={`${duration.toFixed(1)} s`} /> : null}
        <Stat span={3} label={H.face} value={v.face.preset || H.none} />
        <Stat span={3} label={H.sound} value={v.sound.cues.length ? v.sound.cues.map((c) => c.sound).join(", ") : H.none} />
      </div>
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
    <div className="flex flex-col gap-[var(--space-24)]">
      <div className="flex flex-col gap-[var(--space-16)]">
        <Section>{H.selected}</Section>
        <MotionSummary entry={sel} duration={sel.current ? duration : undefined} />
      </div>
      <div className="flex flex-col gap-[var(--space-12)]">
        <Section count={entries.length}>{H.versions}</Section>
        <ol className="-mx-[var(--space-12)] flex flex-col gap-[2px]" aria-label={H.title}>
          {entries.map((e) => {
            const on = e.version === sel.version;
            return (
              <li key={e.version}>
                <button
                  type="button"
                  disabled={busy}
                  aria-current={on ? "true" : undefined}
                  onClick={() => onPick(e)}
                  className={`flex w-full flex-col items-start gap-[2px] rounded-[12px] px-[var(--space-12)] py-[10px] text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${on ? "bg-[var(--home-nav-on)]" : "hover:bg-[var(--home-canvas)]"}`}
                >
                  <span className="flex w-full items-center gap-[var(--space-8)]">
                    <span className={`truncate text-[15px] leading-[20px] text-[var(--home-ink)] ${on ? "font-semibold" : "font-medium"}`}>{e.title}</span>
                    {e.current && (
                      <span className="flex shrink-0 items-center gap-[4px] text-[12px] font-medium text-[var(--sage-600)]">
                        <span className="size-[6px] rounded-full bg-[var(--sage-500)]" />
                        {H.now}
                      </span>
                    )}
                    <span className="flex-1" />
                    <span className="shrink-0 text-[12px] text-[var(--home-ink-3)]">{timeAgo(e.at)}</span>
                  </span>
                  <span className="line-clamp-1 text-[13px] leading-[18px] text-[var(--home-ink-3)]">{e.request}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
