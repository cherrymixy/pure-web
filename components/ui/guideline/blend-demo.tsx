"use client";

import { useState, type ReactNode } from "react";

// Live view of the pipeline formula: final = clamp(source + w × ρ × (style − source), guardrail).
// rows: [behavior, ρ] from data. Curves are illustrative (shortcut: not measured signatures; swap in P1–P6 data if a real clip is ever shown).

const W = 640;
const H = 200;
const MID = H / 2;
const AMP = 80;
const LIMIT = 0.7;
const N = 160;
const xs = Array.from({ length: N + 1 }, (_, i) => i / N);
/** source: a modest swing plus an irregular tremor */
const source = (x: number) => 0.45 * Math.sin(4 * Math.PI * x) + 0.12 * Math.sin(22 * Math.PI * x + 0.6);
/** style: the same swing, exaggerated and smooth */
const style = (x: number) => Math.sin(4 * Math.PI * x);

const px = (x: number) => x * W;
const py = (v: number) => MID - v * AMP;
const path = (f: (x: number) => number) => xs.map((x, i) => `${i ? "L" : "M"}${px(x).toFixed(1)} ${py(f(x)).toFixed(1)}`).join(" ");

export function BlendDemo({ head, rows }: { head: string[]; rows: string[][] }) {
  const [pick, setPick] = useState(0);
  const [w, setW] = useState(1);
  const rho = Number(rows[pick]?.[1] ?? 0);
  const k = w * rho;
  const raw = (x: number) => source(x) + k * (style(x) - source(x));
  const final = (x: number) => Math.max(-LIMIT, Math.min(LIMIT, raw(x)));
  // stretches where the raw blend leaves the band (what the guardrail corrects)
  const hits: [number, number][] = [];
  xs.forEach((x, i) => {
    if (Math.abs(raw(x)) <= LIMIT) return;
    const last = hits[hits.length - 1];
    if (last && last[1] === i - 1) last[1] = i;
    else hits.push([i, i]);
  });

  return (
    <div className="flex flex-col gap-[var(--space-20)] rounded-[var(--radius-lg)] bg-[var(--neutral-0)] p-[var(--space-24)]">
      <div className="flex flex-wrap items-center gap-[var(--space-24)]">
        <div className="flex items-center gap-[var(--space-8)]" role="radiogroup" aria-label={head[0]}>
          {rows.map(([name, r], i) => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={i === pick}
              onClick={() => setPick(i)}
              className={`rounded-[var(--radius-full)] px-[var(--space-12)] py-[6px] text-[13px] font-medium transition-colors ${
                i === pick ? "bg-[var(--home-ink)] text-[var(--neutral-0)]" : "bg-[var(--home-pill)] text-[var(--home-ink-2)] hover:text-[var(--home-ink)]"
              }`}
            >
              {name} <span className="font-mono opacity-70">ρ {r}</span>
            </button>
          ))}
        </div>
        <label className="flex flex-1 items-center gap-[var(--space-12)] text-[13px] font-medium text-[var(--home-ink-2)]">
          <span className="font-mono">w</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={w}
            onChange={(e) => setW(Number(e.target.value))}
            className="max-w-[240px] flex-1 accent-[var(--home-ink)]"
          />
          <span className="w-[36px] font-mono text-[var(--home-ink)]">{w.toFixed(2)}</span>
        </label>
        <code className="rounded-[var(--radius-xs)] bg-[var(--home-pill)] px-[var(--space-8)] py-[3px] font-mono text-[13px] text-[var(--home-ink)]">
          w × ρ = {k.toFixed(2)}
        </code>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible rounded-[14px] bg-[var(--home-sidebar)]" role="img" aria-label={`${rows[pick]?.[0]}: style applied at ${Math.round(k * 100)}%`}>
        <rect x={0} y={py(LIMIT)} width={W} height={py(-LIMIT) - py(LIMIT)} className="fill-[var(--neutral-0)] opacity-60" />
        <path d={`M0 ${py(LIMIT)} H${W} M0 ${py(-LIMIT)} H${W}`} className="stroke-[var(--home-ink-3)]" strokeWidth={1.5} strokeDasharray="2 6" fill="none" />
        <path d={path(source)} className="stroke-[var(--home-ink-3)]" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
        <path d={path(style)} className="stroke-[var(--sage-400)]" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
        {hits.map(([a, b]) => (
          <path key={a} d={`M${px(xs[a])} ${py(Math.sign(raw(xs[a])) * LIMIT)} H${px(xs[b])}`} className="stroke-[var(--red-500)]" strokeWidth={5} strokeLinecap="round" opacity={0.35} />
        ))}
        <path d={path(final)} className="stroke-[var(--home-ink)] transition-[d] duration-200" strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      </svg>

      <ul className="flex flex-wrap gap-x-[var(--space-24)] gap-y-[var(--space-8)] text-[13px] text-[var(--home-ink-2)]">
        <Key line="stroke-[var(--home-ink-3)]" dash>source</Key>
        <Key line="stroke-[var(--sage-400)]" dash>style</Key>
        <Key line="stroke-[var(--home-ink)]" bold>final</Key>
        <Key line="stroke-[var(--home-ink-3)]" dots>clamp</Key>
        {hits.length > 0 && <Key line="stroke-[var(--red-500)]" hit>clamp × {hits.length}</Key>}
      </ul>
    </div>
  );
}

function Key({ line, dash, dots, bold, hit, children }: { line: string; dash?: boolean; dots?: boolean; bold?: boolean; hit?: boolean; children: ReactNode }) {
  return (
    <li className="flex items-center gap-[var(--space-8)] font-mono">
      <svg width={24} height={8} aria-hidden>
        <path
          d="M2 4 H22"
          className={line}
          strokeWidth={hit ? 5 : bold ? 2.5 : 1.5}
          strokeDasharray={dash ? "4 4" : dots ? "2 4" : undefined}
          strokeLinecap="round"
          opacity={hit ? 0.35 : 1}
        />
      </svg>
      {children}
    </li>
  );
}
