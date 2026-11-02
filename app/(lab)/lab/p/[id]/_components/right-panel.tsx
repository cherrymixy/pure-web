"use client";

import { useRef } from "react";
import { EDITOR_PANEL as R } from "@/data/editor-panel";
import { STRINGS, fmt } from "@/data/strings";
import { EASINGS, MAX_BEHAVIOR_DELAY, type MotionBehavior, type MotionProps, type Structure } from "@/lib/models";
import { NEUTRAL_BEHAVIOR, type PropWarning } from "@/lib/expression";
import { EASINGS as EASING_FNS } from "@/lib/sim/motion";
import type { JointState } from "@/components/sim/sim-controller";
import { Icon, type IconName } from "@/components/ui/icons/icon";

// Editor right panel (Figma 452:2024, 448 wide): content column 330 at x 24, rail at x 397, divider at x 378.

export type RailTab = "motion" | "face" | "sound";

const RAIL: { tab: RailTab; icon: IconName }[] = [
  { tab: "motion", icon: "running-round" },
  { tab: "face", icon: "smile-square" },
  { tab: "sound", icon: "volume-loud" },
];

// Rail (452:2126): 24 icon + 12 label (gap 6), items 32 apart, the off ones at 30%.
export function PanelRail({ tab, enabled, onTab }: { tab: RailTab; enabled: (t: RailTab) => boolean; onTab: (t: RailTab) => void }) {
  return (
    <div role="tablist" aria-orientation="vertical" className="flex w-[32px] flex-col gap-[32px]">
      {RAIL.map(({ tab: t, icon }) => (
        <button
          key={t}
          role="tab"
          aria-selected={tab === t}
          disabled={!enabled(t)}
          title={enabled(t) ? undefined : fmt(STRINGS.editor.noChannel, { channel: R.rail[t] })}
          onClick={() => onTab(t)}
          className={`flex flex-col items-center gap-[6px] text-[var(--library-section)] disabled:cursor-not-allowed ${tab === t ? "" : "opacity-30 hover:opacity-60"}`}
        >
          <Icon name={icon} size={24} />
          <span className="text-[12px] font-medium leading-none">{R.rail[t]}</span>
        </button>
      ))}
    </div>
  );
}

// Section title (452:2026): running icon 16 · gap 6 · Medium 16 #6f6d6e; 13 above the fields.
function Section({ title, icon = "running-round", children }: { title: React.ReactNode; icon?: IconName | null; children: React.ReactNode }) {
  return (
    <section className="flex w-[330px] flex-col gap-[13px]">
      <h3 className="flex items-center gap-[6px] text-[16px] font-medium leading-none text-[var(--library-section)]">
        {icon && <Icon name={icon} size={16} />}
        {title}
      </h3>
      <div className="flex flex-col gap-[7px]">{children}</div>
    </section>
  );
}

const FIELD =
  "relative h-[46px] w-[330px] overflow-hidden rounded-[10px] border border-[var(--editor-field-border)] bg-[var(--editor-field)] shadow-[inset_0_0_20px_0_var(--neutral-0)]";
const LABEL = "pointer-events-none absolute left-[14px] top-[13px] whitespace-nowrap text-[16px] font-medium leading-none text-[var(--editor-field-label)]";
const VALUE = "pointer-events-none absolute right-[13px] top-[13px] whitespace-nowrap text-right text-[16px] font-medium leading-none tabular-nums";

/**
 * Bar field (Amplitude 452:2030): the fill (#d9d9d9, right corners 10) grows from the left, a 3×17 handle 11 inside its edge.
 * `ticks` = the five ticks at x 143 + 31n (Duration / Delay): the value snaps to 6 stops (left + each tick) and the
 * handle jumps onto the tick. Plain bars keep a transparent native range on top (drag, click, keys).
 */
const TICK_X = [143, 174, 205, 236, 267];
function BarField({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  display,
  ticks,
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
  display: string;
  ticks?: boolean;
  warn?: boolean;
  note?: string;
  onChange: (v: number) => void;
  onCommit: () => void;
}) {
  const frac = max > min ? Math.min(Math.max((value - min) / (max - min), 0), 1) : 0;
  // Tick bars snap: stop 0 = handle at the left, stops 1–5 = handle on each tick (the fill ends 11 past it)
  const stopValue = (i: number) => min + (i * (max - min)) / (TICK_X.length);
  const stop = Math.round(frac * TICK_X.length);
  const handle = ticks ? (stop === 0 ? 4 : TICK_X[stop - 1]) : Math.max(frac * 330 - 11, 4);
  const edge = ticks ? (stop === 0 ? 0 : handle + 11) : frac * 330;
  const dragging = useRef(false);
  const pick = (e: React.PointerEvent<HTMLDivElement>) => {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    // nearest stop by where the handle would sit (CSS zoom: rect and clientX share the same scale)
    const scale = e.currentTarget.getBoundingClientRect().width / 330;
    const positions = [4, ...TICK_X];
    let best = 0;
    positions.forEach((p, i) => {
      if (Math.abs(p * scale - x) < Math.abs(positions[best] * scale - x)) best = i;
    });
    const v = stopValue(best);
    if (v !== value) onChange(v);
  };
  return (
    <div className="flex flex-col gap-[4px]">
      <div
        className={`${FIELD} has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--sage-400)] ${ticks ? "cursor-pointer" : ""}`}
        onPointerDown={
          ticks
            ? (e) => {
                dragging.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                pick(e);
              }
            : undefined
        }
        onPointerMove={ticks ? (e) => dragging.current && pick(e) : undefined}
        onPointerUp={
          ticks
            ? () => {
                dragging.current = false;
                onCommit();
              }
            : undefined
        }
      >
        {ticks && (
          <span className="pointer-events-none absolute left-[143px] top-[13px] flex gap-[28px] opacity-20" aria-hidden>
            {TICK_X.map((x) => (
              <span key={x} className="h-[17px] w-[3px] rounded-[25px] bg-[var(--editor-field-handle)]" />
            ))}
          </span>
        )}
        <span
          className={`pointer-events-none absolute -top-px left-0 h-[46px] rounded-r-[10px] bg-[var(--editor-field-fill)] ${ticks ? "transition-[width] duration-150 ease-out" : ""}`}
          style={{ width: edge }}
          aria-hidden
        />
        <span
          className={`pointer-events-none absolute top-[13px] h-[17px] w-[3px] rounded-[25px] bg-[var(--editor-field-handle)] ${ticks ? "transition-[left] duration-150 ease-out" : ""}`}
          style={{ left: handle }}
          aria-hidden
        />
        <span className={LABEL}>{label}</span>
        <span className={`${VALUE} ${warn ? "text-[var(--web-ae7d24)]" : "text-[var(--editor-field-value)]"}`}>{display}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={ticks ? (max - min) / TICK_X.length : step}
          value={ticks ? stopValue(stop) : value}
          aria-label={label}
          aria-valuetext={display}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerUp={ticks ? undefined : onCommit}
          onKeyUp={onCommit}
          className={`absolute inset-0 m-0 h-full w-full appearance-none bg-transparent opacity-0 ${ticks ? "pointer-events-none" : "cursor-ew-resize"}`}
        />
      </div>
      {note && <span className="pl-[14px] text-[12px] leading-[15px] text-[var(--web-ae7d24)]">{note}</span>}
    </div>
  );
}

/** Select field (Smoothness 452:2046): value right-aligned before the ↕ caret at x 306; a native select covers the field. */
function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const shown = options.find((o) => o.value === value)?.label ?? value;
  return (
    <div className={`${FIELD} has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--sage-400)]`}>
      <span className={LABEL}>{label}</span>
      <span className="pointer-events-none absolute right-[33px] top-[14px] whitespace-nowrap text-[16px] font-medium leading-none text-[var(--editor-field-value)]">{shown}</span>
      <span className="pointer-events-none absolute left-[306px] top-[17px] flex flex-col gap-[4px] text-[var(--editor-caret)]" aria-hidden>
        <Icon name="select-caret" size={9} />
        <Icon name="select-caret" size={9} className="rotate-180" />
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const nearest = <T,>(steps: readonly T[], value: number, of: (s: T) => number) =>
  steps.reduce((best, s) => (Math.abs(of(s) - value) < Math.abs(of(best) - value) ? s : best), steps[0]);

/** Speed prop 0–100 ↔ × rate (PROP_RANGES.speed 0.5–1.5) */
const speedRate = (prop: number) => 0.5 + prop / 100;
const speedProp = (rate: number) => Math.round((rate - 0.5) * 100);

// Motion Dynamics (452:2025): Amplitude · Duration · Smoothness · Speed · Frequency.
export function MotionDynamics({
  props,
  warnings,
  durationS,
  onChange,
  onCommit,
}: {
  props: MotionProps;
  warnings: PropWarning[];
  /** Length of one pass in seconds at the current props (shown on Duration) */
  durationS: number | null;
  onChange: (key: keyof MotionProps, value: number) => void;
  onCommit: (patch?: Partial<MotionProps>) => void;
}) {
  const D = R.dynamics;
  const warnOf = (key: keyof MotionProps) => {
    const w = warnings.find((x) => x.prop === key);
    return w ? { warn: true, note: fmt(STRINGS.editor.warnOutside, { lo: w.range[0].toFixed(2), hi: w.range[1].toFixed(2) }) } : {};
  };
  const smooth = nearest(D.smoothSteps, props.smoothness, (s) => s.value);
  const rate = nearest(D.speedSteps, speedRate(props.speed), (s) => s);
  return (
    <Section title={D.title}>
      <BarField label={D.amplitude} value={props.amplitude} display={props.amplitude.toFixed(0)} {...warnOf("amplitude")} onChange={(v) => onChange("amplitude", v)} onCommit={() => onCommit()} />
      <BarField
        label={D.duration}
        value={props.duration}
        display={durationS !== null && Number.isFinite(durationS) ? durationS.toFixed(1) : props.duration.toFixed(0)}
        ticks
        onChange={(v) => onChange("duration", v)}
        onCommit={() => onCommit()}
      />
      <SelectField
        label={D.smoothness}
        value={smooth.label}
        options={D.smoothSteps.map((s) => ({ value: s.label, label: s.label }))}
        onChange={(label) => {
          const v = D.smoothSteps.find((s) => s.label === label)!.value;
          onChange("smoothness", v);
          onCommit({ smoothness: v });
        }}
      />
      <SelectField
        label={D.speed}
        value={String(rate)}
        options={D.speedSteps.map((s) => ({ value: String(s), label: `${s}x` }))}
        onChange={(r) => {
          const v = speedProp(Number(r));
          onChange("speed", v);
          onCommit({ speed: v });
        }}
      />
      <BarField label={D.frequency} value={props.frequency} display={props.frequency.toFixed(0)} {...warnOf("frequency")} onChange={(v) => onChange("frequency", v)} onCommit={() => onCommit()} />
    </Section>
  );
}

/**
 * Easing curve box (452:2068): 330×107 #ececec (bottom corners 16) under the Easing field, starting 31 up inside it;
 * the curve runs from (1, 96) to (324.5, 39.5) with a 3.5 dot at the end, stroke 2 #c4c4c4. Auto draws ease in-out
 * (what the keys play with by default) — "linear" keys from a sampled recipe still follow the recipe's own shape.
 */
function EasingCurve({ easing }: { easing: MotionBehavior["easing"] }) {
  const fn = EASING_FNS[easing ?? "ease_in_out"];
  const pts = Array.from({ length: 65 }, (_, i) => {
    const p = i / 64;
    return `${(1 + p * 323.5).toFixed(2)} ${(96 - fn(p) * 56.5).toFixed(2)}`;
  });
  return (
    <svg width="330" height="107" viewBox="0 0 330 107" className="absolute left-0 top-[15px] overflow-visible" aria-hidden>
      <path d="M0 0H330V91a16 16 0 0 1-16 16H16a16 16 0 0 1-16-16Z" className="fill-[var(--editor-curve-bg)]" />
      <path d={`M${pts.join(" L")}`} fill="none" strokeWidth="2" className="stroke-[var(--editor-curve)]" />
      <circle cx="324.5" cy="39.5" r="3.5" className="fill-[var(--editor-curve)]" />
    </svg>
  );
}

// Motion Behavior (452:2062): Easing (+ curve) · Direction · Delay 0–5 s.
export function MotionBehaviorPanel({
  behavior,
  onChange,
  onCommit,
}: {
  behavior: MotionBehavior | undefined;
  onChange: (next: MotionBehavior) => void;
  /** Commit one change; `next` when the change is a pick (selects commit at once) */
  onCommit: (next?: MotionBehavior) => void;
}) {
  const B = R.behavior;
  const b = { ...NEUTRAL_BEHAVIOR, ...behavior };
  const pick = (next: MotionBehavior) => {
    onChange(next);
    onCommit(next);
  };
  return (
    <Section title={B.title}>
      <div className="relative h-[122px] w-[330px]">
        <EasingCurve easing={b.easing} />
        <div className="absolute left-0 top-0">
          <SelectField
            label={B.easing}
            value={b.easing ?? "auto"}
            options={(["auto", ...EASINGS] as const).map((e) => ({ value: e, label: B.easings[e] }))}
            onChange={(e) => pick({ ...b, easing: e === "auto" ? undefined : e })}
          />
        </div>
      </div>
      <SelectField
        label={B.direction}
        value={b.direction}
        options={(["left", "right"] as const).map((d) => ({ value: d, label: B.directions[d] }))}
        onChange={(d) => pick({ ...b, direction: d })}
      />
      <BarField
        label={B.delay}
        value={b.delay}
        max={MAX_BEHAVIOR_DELAY}
        step={0.1}
        display={b.delay.toFixed(1)}
        ticks
        onChange={(v) => onChange({ ...b, delay: v })}
        onCommit={() => onCommit()}
      />
    </Section>
  );
}

/**
 * Joint (452:2093): "Auto" chip (the motion drives the joints) + one 36-tall row per joint —
 * label / command value on top, a 7 track at 26 with the 13 knob at the command. Out of range reads in the error color.
 */
export function JointList({ joints, structure, flagged }: { joints: JointState[]; structure: Structure; flagged?: string | null }) {
  return (
    <section className="flex w-[330px] flex-col gap-[13px]">
      <div className="flex items-center gap-[8px]">
        <span className="flex h-[23px] items-center rounded-[var(--radius-full)] bg-[var(--editor-chip)] px-[10px] text-[13px] font-medium leading-none text-[var(--text-on-inverse)] shadow-[inset_0_0_10px_0_var(--neutral-0)]">
          {R.joint.auto}
        </span>
        <h3 className="text-[16px] font-medium leading-none text-[var(--library-section)]">{R.joint.title}</h3>
      </div>
      <div className="flex flex-col gap-[13px]">
        {structure.joints.map((j) => {
          const s = joints.find((x) => x.id === j.id);
          const out = (s && (s.command < j.min || s.command > j.max)) || flagged === j.id;
          const span = j.max - j.min;
          const pos = s && span > 0 ? Math.min(Math.max((s.command - j.min) / span, 0), 1) : 0.5;
          return (
            <div key={j.id} data-testid={`joint-${j.id}`} className="relative h-[36px] w-[330px]" title={s ? `${s.command.toFixed(1)} / ${s.actual.toFixed(1)}` : undefined}>
              <span className={`absolute left-0 top-0 text-[16px] font-medium leading-none ${out ? "text-[var(--text-error)]" : "text-[var(--editor-field-label)]"}`}>{j.label}</span>
              <span className={`absolute right-0 top-0 text-[16px] font-medium leading-none tabular-nums ${out ? "text-[var(--text-error)]" : "text-[var(--editor-field-value)]"}`}>
                {s ? s.command.toFixed(1) : "—"}
              </span>
              <span className="absolute left-0 top-[26px] h-[7px] w-[330px] rounded-[10px] bg-[var(--editor-field)]" />
              <span
                className={`absolute top-[23px] size-[13px] -translate-x-1/2 rounded-full ${out ? "bg-[var(--status-error)]" : "bg-[var(--editor-knob)]"}`}
                style={{ left: `calc(6.5px + ${pos} * (100% - 13px))` }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Edit Detail (452:2124): 328×50 #2c3030, radius 18, Regular 21 white, tracking -0.42. */
export function EditDetailButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={open}
      onClick={onClick}
      className="h-[50px] w-[328px] shrink-0 rounded-[18px] bg-[var(--editor-cta)] text-[21px] leading-none tracking-[-0.42px] text-[var(--text-on-inverse)]"
    >
      {open ? R.closeDetail : R.editDetail}
    </button>
  );
}
