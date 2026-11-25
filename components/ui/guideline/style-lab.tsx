"use client";

import { useState, type CSSProperties } from "react";
import { RANGE_EXAMPLE, RHO_EXAMPLES, STYLE_AXES, STYLE_AXIS_LABELS, STYLE_PRESETS } from "@/data/guideline/style";
import { STRINGS } from "@/data/strings";
import { BehaviorDemo } from "./behavior-demo";

// Style pages: hands-on labs. A style moves values only: here Reach (P1) → motion size and Speed contrast (P2) → speed,
// scaled by strength w and damped per behavior by ρ, always clamped to the guardrail range.

const L = STRINGS.guideline.lab;
type Axes = Record<(typeof STYLE_AXES)[number], number>;
const CARD = "rounded-[var(--radius-lg)] bg-[var(--neutral-0)]";
const PANEL = "rounded-[14px] bg-[var(--home-canvas)]";

/** Style → robot motion: amplitude around 1 and loop duration in seconds. */
const motion = (a: Axes, w: number, rho = 1) => ({
  amp: 1 + w * rho * (0.5 + a.P1 - 1),
  dur: 2.6 - w * rho * a.P2 * 1.2,
});

/** A robot that keeps playing one behavior at the given amplitude and speed. */
function Robot({ slug, amp, dur, hoverOnly = false, className = "h-[200px]" }: { slug: string; amp: number; dur: number; hoverOnly?: boolean; className?: string }) {
  return (
    <div data-playing={hoverOnly ? undefined : "true"} style={{ ["--amp" as string]: amp, ["--bhv-dur" as string]: `${dur}s` } as CSSProperties}>
      <div data-bhv-stage>
        <BehaviorDemo slug={slug} className={`block w-full ${className}`} />
      </div>
    </div>
  );
}

function Radar({ axes, size = 220 }: { axes: Axes; size?: number }) {
  const C = 110;
  const R = 78;
  const pt = (i: number, r: number) => {
    const a = (Math.PI * 2 * i) / STYLE_AXES.length - Math.PI / 2;
    return [C + Math.cos(a) * r, C + Math.sin(a) * r] as const;
  };
  const ring = (f: number) => STYLE_AXES.map((_, i) => pt(i, R * f).join(",")).join(" ");
  return (
    <svg viewBox="0 0 220 220" style={{ width: size }} role="img" aria-label={STYLE_AXES.map((k) => `${k} ${axes[k].toFixed(2)}`).join(", ")}>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={ring(f)} fill={f === 1 ? "var(--home-canvas)" : "none"} stroke="var(--home-line)" />)}
      {STYLE_AXES.map((k, i) => {
        const [lx, ly] = pt(i, R + 18);
        return <text key={k} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="600" fill="var(--home-ink-2)">{k}</text>;
      })}
      <polygon points={STYLE_AXES.map((k, i) => pt(i, R * axes[k]).join(",")).join(" ")} fill="color-mix(in srgb, var(--home-ink) 14%, transparent)" stroke="var(--home-ink)" strokeWidth="2" style={{ transition: "all var(--motion-base)" }} />
    </svg>
  );
}

function Slider({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <label className="flex flex-col gap-[4px]">
      <span className="flex items-baseline gap-[var(--space-8)] text-[13px]">
        <span className="font-semibold text-[var(--home-ink)]">{label}</span>
        {hint && <span className="text-[var(--home-ink-3)]">{hint}</span>}
        <span className="flex-1" />
        <code className="font-mono text-[12px] text-[var(--home-ink-2)]">{value.toFixed(2)}</code>
      </span>
      <input type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--home-ink)]" />
    </label>
  );
}

export function SignatureLab() {
  const [axes, setAxes] = useState<Axes>(STYLE_PRESETS[3].axes);
  const [w, setW] = useState(0.7);
  const m = motion(axes, w);
  return (
    <div className={`${CARD} grid grid-cols-[1fr_300px] gap-[var(--space-24)] p-[var(--space-24)]`}>
      <div className="flex flex-col gap-[var(--space-16)]">
        <div className="flex flex-wrap gap-[var(--space-8)]">
          {STYLE_PRESETS.map((p) => (
            <button key={p.id} type="button" onClick={() => setAxes(p.axes)} className="rounded-[var(--radius-full)] bg-[var(--home-pill)] px-[var(--space-16)] py-[6px] text-[14px] font-medium text-[var(--home-ink)] hover:bg-[var(--home-ink)] hover:text-[var(--neutral-0)]">
              {p.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-[var(--space-24)] gap-y-[var(--space-12)]">
          {STYLE_AXES.map((k) => (
            <Slider key={k} label={k} hint={STYLE_AXIS_LABELS[k]} value={axes[k]} onChange={(v) => setAxes({ ...axes, [k]: v })} />
          ))}
        </div>
        <Slider label={L.strength} value={w} onChange={setW} />
      </div>
      <div className="flex flex-col items-center gap-[var(--space-12)]">
        <div className={`${PANEL} flex w-full items-center justify-center py-[var(--space-8)]`}>
          <Radar axes={axes} size={200} />
        </div>
        <div className={`${PANEL} w-full`}>
          <Robot slug="joy" amp={m.amp} dur={m.dur} className="h-[150px]" />
        </div>
      </div>
    </div>
  );
}

export function PresetCards() {
  return (
    <div className="grid grid-cols-4 gap-[var(--space-16)]">
      {STYLE_PRESETS.map((p) => {
        const m = motion(p.axes, 1);
        return (
          <div key={p.id} className={`group ${CARD} flex flex-col gap-[var(--space-12)] p-[var(--space-16)]`}>
            <div className={`${PANEL} flex items-center justify-center`}>
              <Radar axes={p.axes} size={170} />
            </div>
            <div className={PANEL}>
              <Robot slug="joy" amp={m.amp} dur={m.dur} hoverOnly className="h-[110px]" />
            </div>
            <span className="flex items-center gap-[var(--space-8)] px-[4px]">
              <span className="text-[17px] font-semibold text-[var(--home-ink)]">{p.label}</span>
              <span className="flex-1" />
              <code className="font-mono text-[12px] text-[var(--home-ink-3)]">{p.id}</code>
            </span>
            {p.example && <span className="px-[4px] text-[12px] text-[var(--home-ink-3)]">{L.example}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function RhoLab() {
  const [pick, setPick] = useState(0);
  const [w, setW] = useState(1);
  const b = RHO_EXAMPLES[pick];
  const style = STYLE_PRESETS[2].axes; // Drama: a strong style makes the damping easy to see
  const src = motion(style, 0);
  const fin = motion(style, w, b.rho);
  return (
    <div className={`${CARD} flex flex-col gap-[var(--space-16)] p-[var(--space-24)]`}>
      <div className="flex flex-wrap items-center gap-[var(--space-8)]">
        {RHO_EXAMPLES.map((x, i) => (
          <button key={x.slug} type="button" aria-pressed={i === pick} onClick={() => setPick(i)} className={`rounded-[var(--radius-full)] px-[var(--space-16)] py-[6px] text-[14px] font-medium ${i === pick ? "bg-[var(--home-ink)] text-[var(--neutral-0)]" : "bg-[var(--home-pill)] text-[var(--home-ink)]"}`}>
            {x.title} <span className="opacity-60">ρ {x.rho}</span>
          </button>
        ))}
        <span className="flex-1" />
        <div className="w-[260px]"><Slider label={L.strength} value={w} onChange={setW} /></div>
      </div>
      <div className="grid grid-cols-2 gap-[var(--space-12)]">
        {([[L.source, src.amp, src.dur], [L.final, fin.amp, fin.dur]] as const).map(([label, amp, dur]) => (
          <div key={label} className={`${PANEL} flex flex-col gap-[4px] p-[var(--space-12)]`}>
            <span className="flex items-center text-[12px] font-medium text-[var(--home-ink-3)]">
              {label}
              <span className="flex-1" />
              <code className="font-mono">×{amp.toFixed(2)}</code>
            </span>
            <Robot key={`${b.slug}-${label}`} slug={b.slug} amp={amp} dur={dur} className="h-[170px]" />
          </div>
        ))}
      </div>
      <code className="rounded-[14px] bg-[var(--home-ink)] px-[var(--space-20)] py-[var(--space-12)] font-mono text-[14px] text-[var(--neutral-0)]">
        final = 1 + {w.toFixed(2)} × {b.rho} × ({(0.5 + style.P1).toFixed(2)} − 1) = ×{fin.amp.toFixed(2)}
      </code>
    </div>
  );
}

export function RangeLab() {
  const r = RANGE_EXAMPLE;
  const [target, setTarget] = useState(34);
  const final = Math.min(r.should[1], Math.max(r.should[0], target));
  const x = (v: number) => `${(v / r.max) * 100}%`;
  return (
    <div className={`${CARD} grid grid-cols-[1fr_260px] gap-[var(--space-24)] p-[var(--space-24)]`}>
      <div className="flex flex-col justify-center gap-[var(--space-24)]">
        <div className="relative mt-[var(--space-24)] h-[14px] rounded-[var(--radius-full)] bg-[var(--home-pill)]">
          <span className="absolute inset-y-0 rounded-[var(--radius-full)] bg-[color-mix(in_srgb,var(--sage-400)_45%,transparent)]" style={{ left: x(r.should[0]), width: `calc(${x(r.should[1])} - ${x(r.should[0])})` }} />
          <span className="absolute inset-y-0 right-0 rounded-r-[var(--radius-full)] bg-[var(--red-50)]" style={{ left: x(r.must) }} />
          <span className="absolute -top-[22px] -translate-x-1/2 text-[11px] font-semibold text-[var(--sage-500)]" style={{ left: x((r.should[0] + r.should[1]) / 2) }}>{L.should} {r.should[0]}–{r.should[1]}{r.unit}</span>
          <span className="absolute -top-[22px] -translate-x-1/2 text-[11px] font-semibold text-[var(--red-500)]" style={{ left: x(r.must) }}>{L.must} {r.must}{r.unit}</span>
          {([[r.source, "var(--home-ink-3)", L.source], [target, "var(--red-500)", L.style], [final, "var(--home-ink)", L.final]] as const).map(([v, c, label]) => (
            <span key={label} className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-[left] duration-[var(--motion-base)]" style={{ left: x(v) }}>
              <span className="size-[16px] rounded-[var(--radius-full)] border-[3px] border-[var(--neutral-0)]" style={{ background: c }} />
              <span className="absolute top-[22px] whitespace-nowrap text-[11px] font-medium" style={{ color: c }}>{label} {Math.round(v)}{r.unit}</span>
            </span>
          ))}
        </div>
        <label className="mt-[var(--space-24)] flex flex-col gap-[4px]">
          <span className="text-[13px] font-semibold text-[var(--home-ink)]">{L.push} <code className="font-mono font-normal text-[var(--home-ink-2)]">{r.token} {target}{r.unit}</code></span>
          <input type="range" min={0} max={r.max} step={1} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full accent-[var(--home-ink)]" />
        </label>
      </div>
      <div className={`${PANEL} flex items-center justify-center`}>
        <svg aria-hidden viewBox="0 0 200 140" className="block h-[200px] w-full">
          <line x1={100} y1={20} x2={100} y2={100} stroke="var(--home-line)" strokeDasharray="3 4" />
          <rect x={78} y={118} width={44} height={8} rx={4} fill="var(--home-ink)" opacity={0.85} />
          <line x1={100} y1={118} x2={100} y2={100} stroke="var(--home-ink)" strokeWidth={4} strokeLinecap="round" />
          <g style={{ transform: `rotate(${final}deg)`, transformOrigin: "100px 100px", transition: "transform var(--motion-base) var(--ease-standard)" }}>
            <rect x={70} y={60} width={60} height={40} rx={13} fill="var(--home-ink)" />
            <rect x={86} y={72} width={8} height={14} rx={3} fill="var(--neutral-0)" />
            <rect x={106} y={72} width={8} height={14} rx={3} fill="var(--neutral-0)" />
          </g>
        </svg>
      </div>
    </div>
  );
}
