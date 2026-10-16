"use client";

import { STRINGS, fmt } from "@/data/strings";
import type { MotionProps, Structure } from "@/lib/models";
import type { PropWarning } from "@/lib/expression/props";
import type { JointState } from "@/components/sim/sim-controller";

const P = STRINGS.editor.props;
export const PROP_KEYS: (keyof MotionProps)[] = ["amplitude", "duration", "smoothness", "speed", "frequency"];
export const PROP_LABELS = P;

/** Section title row of the right panel (Figma Frame 2147240497 › title: 18px primary · 16px tertiary meta, gap 16 to the box). */
export function PanelSection({ title, meta, children, className = "" }: { title: string; meta?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex w-[332px] flex-col gap-[var(--space-16)] ${className}`}>
      <div className="flex items-end justify-between whitespace-nowrap">
        <h3 className="text-[18px] leading-[23px] text-[var(--text-primary)]">{title}</h3>
        {meta !== undefined && <span className="text-[16px] leading-[20px] text-[var(--text-tertiary)]">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

/** Canvas box the rows sit in (bg/canvas, radius lg, pl 12 · pr 20 · py 20, rows 24 apart). */
export const PANEL_BOX = "flex flex-col gap-[var(--space-24)] rounded-[var(--radius-lg)] bg-[var(--bg-canvas)] py-[var(--space-20)] pl-[var(--space-12)] pr-[var(--space-20)]";

/**
 * One property row (W02E-1 901:11688): dot + label · 143×16 bar (sage/100 track, neutral/600 fill) · value.
 * The bar is a real native range input (keyboard, aria-valuenow) laid transparently over the drawn bar;
 * edits apply live and release (pointer / key) commits one change.
 */
export function BarSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  digits = 0,
  warn,
  note,
  onChange,
  onCommit,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  digits?: number;
  warn?: boolean;
  note?: string;
  onChange: (v: number) => void;
  onCommit: () => void;
}) {
  const frac = max > min ? Math.min(Math.max((value - min) / (max - min), 0), 1) : 0;
  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <div className="flex items-center justify-between">
        <span className="flex items-start gap-[var(--space-4)]">
          <span className="mt-[2px] size-[5px] shrink-0 rounded-[var(--radius-full)] bg-[var(--neutral-300)]" aria-hidden />
          <span className="whitespace-nowrap text-[16px] leading-[20px] text-[var(--text-primary)]">{label}</span>
        </span>
        <span className="flex w-[175px] shrink-0 items-center gap-[var(--space-12)]">
          <span className="relative h-[16px] w-[143px] shrink-0 overflow-hidden rounded-[var(--radius-2xs)] bg-[var(--sage-100)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--sage-400)]">
            <span className="absolute inset-y-0 left-0 rounded-r-[var(--radius-2xs)] bg-[var(--neutral-600)]" style={{ width: `${frac * 100}%` }} aria-hidden />
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              aria-label={label}
              onChange={(e) => onChange(Number(e.target.value))}
              onPointerUp={onCommit}
              onKeyUp={onCommit}
              className="absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 [&::-moz-range-thumb]:h-[16px] [&::-moz-range-thumb]:w-px [&::-webkit-slider-thumb]:h-[16px] [&::-webkit-slider-thumb]:w-px [&::-webkit-slider-thumb]:appearance-none"
            />
          </span>
          <span className={`min-w-0 flex-1 text-right text-[12px] leading-[15px] tabular-nums ${warn ? "text-[var(--web-ae7d24)]" : "text-[var(--text-primary)]"}`}>{value.toFixed(digits)}</span>
        </span>
      </div>
      {note && <span className="pl-[9px] text-[12px] leading-[15px] text-[var(--web-ae7d24)]">{note}</span>}
    </div>
  );
}

// W02E-1 right panel › Motion Properties 0-100 (901:11681 ×2): five bar sliders; out-of-signature values warn.
export function MotionPanel({
  props,
  warnings,
  onChange,
  onCommit,
}: {
  props: MotionProps;
  warnings: PropWarning[];
  onChange: (key: keyof MotionProps, value: number) => void;
  onCommit: () => void;
}) {
  return (
    <PanelSection title={STRINGS.editor.propsTitle} meta={STRINGS.editor.propsScale}>
      <div className={PANEL_BOX}>
        {PROP_KEYS.map((key) => {
          const warn = warnings.find((w) => w.prop === key);
          return (
            <BarSlider
              key={key}
              label={P[key]}
              value={props[key]}
              warn={!!warn}
              note={warn ? fmt(STRINGS.editor.warnOutside, { lo: warn.range[0].toFixed(2), hi: warn.range[1].toFixed(2) }) : undefined}
              onChange={(v) => onChange(key, v)}
              onCommit={onCommit}
            />
          );
        })}
      </div>
    </PanelSection>
  );
}

// Joint Command / Actual, live from the sim; out-of-range rows in the error color.
// Figma W02D-1 Frame 29 › Joint (901:9861 ×2): title row, then a canvas box of rows (label · cmd / act, range bar + knob at the command).
export function JointTable({ joints, structure, flagged }: { joints: JointState[]; structure: Structure; flagged?: string | null }) {
  const J = STRINGS.editor.joint;
  return (
    <section className="flex w-[332px] flex-col gap-[var(--space-16)]">
      <div className="flex items-start justify-between text-[var(--text-primary)]">
        <h3 className="text-[18px] leading-[23px]">{J.title}</h3>
        <span className="text-[16px] leading-[20px] opacity-50">{`${J.command} / ${J.actual}`}</span>
      </div>
      <div className="flex flex-col gap-[var(--space-32)] rounded-[var(--radius-lg)] bg-[var(--bg-canvas)] px-[var(--space-20)] py-[var(--space-16)]">
        {structure.joints.map((j, i) => {
          const s = joints.find((x) => x.id === j.id);
          const out = (s && (s.command < j.min || s.command > j.max)) || flagged === j.id;
          const span = j.max - j.min;
          const pos = s && span > 0 ? Math.min(Math.max((s.command - j.min) / span, 0), 1) : 0.5;
          return (
            <div key={j.id} data-testid={`joint-${j.id}`} className={`flex flex-col gap-[var(--space-12)] ${out ? "text-[var(--text-error)]" : "text-[var(--text-primary)]"}`}>
              <div className="flex items-center justify-between text-[16px] leading-[20px]">
                <span className="flex items-center gap-[var(--space-4)]">
                  <span className="opacity-40">{i + 1}</span>
                  <span>{j.label}</span>
                </span>
                <span className="text-right tabular-nums">{s ? `${s.command.toFixed(1)} / ${s.actual.toFixed(1)}` : "—"}</span>
              </div>
              <div className="relative h-[9px] w-full">
                <div className="absolute inset-x-0 top-[2px] h-[5px] rounded-[var(--radius-full)] bg-[var(--sage-100)]" />
                <div
                  className={`absolute top-[-2px] size-[13px] -translate-x-1/2 rounded-[var(--radius-full)] ${out ? "bg-[var(--status-error)]" : "bg-[var(--sage-400)]"}`}
                  style={{ left: `${pos * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
