"use client";

import { STRINGS, fmt } from "@/data/strings";
import type { MotionProps, Structure } from "@/lib/models";
import type { PropWarning } from "@/lib/expression/props";
import type { JointState } from "@/components/sim/sim-controller";

const P = STRINGS.editor.props;
export const PROP_KEYS: (keyof MotionProps)[] = ["amplitude", "duration", "smoothness", "speed", "frequency"];
export const PROP_LABELS = P;

// W02D right panel: Motion Properties (0–100) with signature-range warnings.
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
    <div className="flex flex-col gap-3">
      {PROP_KEYS.map((key) => {
        const warn = warnings.find((w) => w.prop === key);
        return (
          <label key={key} className="flex flex-col gap-1 text-sm">
            <span className="flex justify-between">
              <span>{P[key]}</span>
              <span className={`font-mono ${warn ? "text-amber-700" : ""}`}>{Math.round(props[key])}</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={props[key]}
              aria-label={P[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
              onPointerUp={onCommit}
              onKeyUp={onCommit}
            />
            {warn && (
              <span className="text-xs text-amber-700">
                {fmt(STRINGS.editor.warnOutside, { lo: warn.range[0].toFixed(2), hi: warn.range[1].toFixed(2) })}
              </span>
            )}
          </label>
        );
      })}
    </div>
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
