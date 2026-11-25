import Link from "next/link";
import { GUIDELINE } from "@/data/guideline";
import type { GuidelineBlock } from "@/data/guideline/types";
import { Icon } from "../icons/icon";
import { Figure } from "./figures";
import { BlendDemo } from "./blend-demo";
import { LayerMap } from "./layer-map";
import { parseSize } from "./parse-size";
import { TokenDemo, hasTokenDemo } from "./token-demo";

// Lab-style presentations of guideline body blocks (block.view). Same content as the plain table / code / list —
// only the shape changes. Type scale shared with Lab: 22 / 17 / 15 / 14 / 13 / 12. White cards on the canvas, no border or shadow.

const CARD = "rounded-[var(--radius-lg)] bg-[var(--neutral-0)]";
const LABEL = "text-[12px] font-medium text-[var(--home-ink-3)]";

export function BlockView({ b }: { b: GuidelineBlock }) {
  if (b.kind === "code" && b.view === "tree") return <LayerMap text={b.text} />;
  if (b.kind === "code" && b.view === "formula") return <Formula text={b.text} />;
  if (b.kind === "table" && b.view === "cards") return <TableCards head={b.head} rows={b.rows} figures={b.figures} />;
  if (b.kind === "table" && b.view === "levels") return <Levels head={b.head} rows={b.rows} />;
  if (b.kind === "table" && b.view === "steps") return <Steps head={b.head} rows={b.rows} figures={b.figures} />;
  if (b.kind === "table" && b.view === "blend") return <BlendDemo head={b.head} rows={b.rows} />;
  if (b.kind === "table" && b.view === "chips") return <Chips head={b.head} rows={b.rows} />;
  if (b.kind === "list" && b.view === "checklist") return <Checklist items={b.items} />;
  if (b.kind === "p" && b.view === "note") return <Note text={b.text} />;
  if (b.kind === "table" && b.view === "scale") return <Scale head={b.head} rows={b.rows} demo={b.figures?.[0]} />;
  if (b.kind === "table" && b.view === "matrix") return <Matrix head={b.head} rows={b.rows} />;
  if (b.kind === "list" && b.view === "rules") return <Rules items={b.items} />;
  if (b.kind === "p" && b.view === "evidence") return <Evidence text={b.text} />;
  if (b.kind === "table" && b.view === "pattern") return <Pattern rows={b.rows} />;
  if (b.kind === "p" && b.view === "machine") return <Machine text={b.text} />;
  if (b.kind === "table" && b.view === "roles") return <Roles rows={b.rows} />;
  if (b.kind === "table" && b.view === "role-grid") return <RoleGrid head={b.head} rows={b.rows} />;
  if (b.kind === "list" && b.view === "tiles") return <Tiles items={b.items} />;
  if (b.kind === "code" && b.view === "radar") return <Radar text={b.text} />;
  if (b.kind === "table" && b.view === "measures") return <Measures head={b.head} rows={b.rows} />;
  if (b.kind === "table" && b.view === "evidence-bars") return <EvidenceBars head={b.head} rows={b.rows} />;
  if (b.kind === "table" && b.view === "pairs") return <Pairs head={b.head} rows={b.rows} />;
  if (b.kind === "table" && b.view === "transitions") return <Transitions head={b.head} rows={b.rows} />;
  return null;
}

/* ── formula: the expression, then a legend of its terms ─────────────────────────────── */

function Formula({ text }: { text: string }) {
  const [expr, ...rest] = text.split("\n").filter((l) => l.trim());
  const terms = rest.map((l) => l.trim().match(/^(\S+)\s{2,}(.+)$/)).filter((m): m is RegExpMatchArray => !!m);
  return (
    <div className={`${CARD} flex flex-col gap-[var(--space-20)] p-[var(--space-24)]`}>
      <code className="rounded-[14px] bg-[var(--home-ink)] px-[var(--space-20)] py-[var(--space-16)] font-mono text-[17px] font-medium text-[var(--neutral-0)]">{expr.trim()}</code>
      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-[var(--space-16)] gap-y-[10px]">
        {terms.map(([, term, desc]) => (
          <div key={term} className="contents">
            <dt className="w-fit rounded-[var(--radius-xs)] bg-[var(--home-pill)] px-[var(--space-8)] py-[3px] font-mono text-[13px] font-medium text-[var(--home-ink)]">{term}</dt>
            <dd className="text-[14px] leading-[1.5] text-[var(--home-ink-2)]">{desc}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ── cards: one card per table row ───────────────────────────────────────────────────── */

function TableCards({ head, rows, figures }: { head: string[]; rows: string[][]; figures?: string[] }) {
  const numbered = head[0] === "#";
  const t = numbered ? 1 : 0;
  const cols = rows.length === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={`grid ${cols} gap-[var(--space-16)]`}>
      {rows.map((r, i) => (
        <div key={r.join()} className={`${CARD} flex flex-col gap-[var(--space-12)] p-[var(--space-16)]`}>
          <Figure name={figures?.[i]} />
          {numbered && <span className={`${LABEL} px-[4px]`}>{r[0].padStart(2, "0")}</span>}
          <span className="text-[15px] font-semibold leading-[1.45] text-[var(--home-ink)]">{r[t]}</span>
          {r.slice(t + 1).map((c, j) => {
            const h = head[t + 1 + j];
            const example = /example/i.test(h);
            return (
              <div key={j} className="flex flex-col gap-[4px] border-t border-dashed border-[var(--home-line)] pt-[var(--space-12)]">
                <span className={LABEL}>{h}</span>
                {example ? (
                  <code className="w-fit rounded-[var(--radius-xs)] bg-[var(--home-pill)] px-[var(--space-8)] py-[3px] font-mono text-[13px] text-[var(--home-ink)]">{c}</code>
                ) : (
                  <span className="text-[14px] leading-[1.5] text-[var(--home-ink-2)]">{c}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ── levels: MUST / SHOULD / MAY with their tone ─────────────────────────────────────── */

const TONE: Record<string, { ink: string; bg: string }> = {
  MUST: { ink: "var(--red-500)", bg: "var(--red-50)" },
  SHOULD: { ink: "var(--web-ae7d24)", bg: "var(--home-mod-sound)" },
  MAY: { ink: "var(--green-500)", bg: "color-mix(in srgb, var(--green-400) 14%, transparent)" },
};

function Levels({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="grid grid-cols-3 gap-[var(--space-16)]">
      {rows.map(([level, meaning, ...rest]) => {
        const tone = TONE[level] ?? { ink: "var(--home-ink)", bg: "var(--home-pill)" };
        return (
          <div key={level} className={`${CARD} flex flex-col gap-[var(--space-12)] p-[var(--space-16)]`}>
            <div aria-hidden className="flex h-[96px] flex-col justify-center gap-[10px] rounded-[14px] px-[var(--space-20)]" style={{ background: tone.bg }}>
              <span className="w-fit font-mono text-[13px] font-semibold" style={{ color: tone.ink }}>{level}</span>
              <RangeBar level={level} ink={tone.ink} />
            </div>
            <span className="text-[15px] font-medium leading-[1.45] text-[var(--home-ink)]">{meaning}</span>
            {rest.map((c, j) => (
              <div key={j} className="flex flex-col gap-[4px] border-t border-dashed border-[var(--home-line)] pt-[var(--space-12)]">
                <span className={LABEL}>{head[2 + j]}</span>
                <span className="text-[14px] leading-[1.5] text-[var(--home-ink-2)]">{c}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** Allowed range on one track: MUST = a fixed point, SHOULD = a band with room either side, MAY = the whole track. */
const RANGE: Record<string, [number, number]> = { MUST: [48, 52], SHOULD: [28, 72], MAY: [0, 100] };

function RangeBar({ level, ink }: { level: string; ink: string }) {
  const [from, to] = RANGE[level] ?? [0, 100];
  return (
    <span className="relative h-[8px] rounded-[var(--radius-full)] bg-[var(--neutral-0)]">
      <span className="absolute inset-y-0 rounded-[var(--radius-full)]" style={{ left: `${from}%`, width: `${to - from}%`, background: ink }} />
    </span>
  );
}

/* ── steps: a left-to-right flow ("1 Title" in the first column) ─────────────────────── */

function Steps({ head, rows, figures }: { head: string[]; rows: string[][]; figures?: string[] }) {
  return (
    <ol className="grid gap-[var(--space-8)]" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
      {rows.map(([step, question, reads], i) => {
        const m = step.match(/^(\d+)\s+(.+)$/);
        const [n, title] = m ? [m[1], m[2]] : [String(i + 1), step];
        return (
          <li key={step} className={`${CARD} relative flex flex-col gap-[var(--space-12)] p-[var(--space-16)]`}>
            <Figure name={figures?.[i]} fit />
            <span className="flex items-center gap-[var(--space-8)]">
              <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[var(--radius-full)] border border-[var(--home-line)] text-[13px] font-semibold text-[var(--home-ink)]">{n}</span>
              {i < rows.length - 1 && <span aria-hidden className="h-px flex-1 bg-[var(--home-line)]" />}
            </span>
            <span className="text-[15px] font-semibold leading-[1.35] text-[var(--home-ink)]">{title}</span>
            <span className="text-[14px] leading-[1.5] text-[var(--home-ink-2)]">{question}</span>
            <span className="flex-1" />
            <span className="flex flex-col gap-[4px]">
              <span className={LABEL}>{head[2]}</span>
              <code className="w-fit rounded-[var(--radius-xs)] bg-[var(--home-pill)] px-[var(--space-8)] py-[3px] font-mono text-[12px] leading-[1.4] text-[var(--home-ink)]">{reads}</code>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ── chips: prefix tiles (Layer · Prefix · Example) ──────────────────────────────────── */

function Chips({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="grid grid-cols-4 gap-[var(--space-12)]" role="table" aria-label={head.join(", ")}>
      {rows.map(([layer, prefix, example]) => (
        <div key={layer} role="row" className={`${CARD} flex flex-col gap-[6px] p-[var(--space-16)]`}>
          <code role="cell" className="font-mono text-[17px] font-semibold text-[var(--home-ink)]">{prefix}</code>
          <span role="cell" className="text-[13px] text-[var(--home-ink-2)]">{layer}</span>
          <code role="cell" className="mt-[2px] w-fit rounded-[6px] bg-[var(--home-pill)] px-[6px] py-[2px] font-mono text-[12px] text-[var(--home-ink-3)]">{example}</code>
        </div>
      ))}
    </div>
  );
}

/* ── checklist ───────────────────────────────────────────────────────────────────────── */

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className={`${CARD} flex flex-col divide-y divide-[var(--home-line)] px-[var(--space-20)]`}>
      {items.map((it) => (
        <li key={it} className="flex items-center gap-[var(--space-12)] py-[14px] text-[15px] text-[var(--home-ink)]">
          <span className="flex size-[22px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--sage-50)] text-[var(--sage-500)]">
            <Icon name="check" size={14} />
          </span>
          {it}
        </li>
      ))}
    </ul>
  );
}

/* ── note: an aside under a table ────────────────────────────────────────────────────── */

function Note({ text }: { text: string }) {
  return (
    <p className="rounded-[14px] bg-[color-mix(in_srgb,var(--neutral-0)_50%,transparent)] px-[var(--space-16)] py-[14px] text-[14px] leading-[1.6] text-[var(--home-ink-2)]">
      {text}
    </p>
  );
}

/* ── scale: token sizes placed on one value axis, then a card per size ───────────────── */

/** demo: token slug → one example picture per size (token-demo.tsx) instead of the value axis. */
function Scale({ head, rows, demo }: { head: string[]; rows: string[][]; demo?: string }) {
  const pictures = hasTokenDemo(demo);
  const parsed = rows.map((r) => parseSize(r[1]));
  // Only sizes in the most common unit share the axis (e.g. rotate's "35% vmax" speed stays off the degree axis).
  const units = parsed.flatMap((p) => (p ? [p[2]] : []));
  const unit = units.sort((x, y) => units.filter((u) => u === y).length - units.filter((u) => u === x).length)[0];
  const onAxis = rows.flatMap((r, i) => (parsed[i] && parsed[i]![2] === unit ? [{ size: r[0], from: parsed[i]![0], to: parsed[i]![1] }] : []));
  const lo = Math.min(0, ...onAxis.map((p) => p.from));
  const hi = Math.max(...onAxis.map((p) => p.to));
  const x = (v: number) => (hi === lo ? 50 : ((v - lo) / (hi - lo)) * 100);
  return (
    <div className={`${CARD} flex flex-col gap-[var(--space-24)] p-[var(--space-24)]`}>
      {!pictures && onAxis.length >= 2 && (
        <div aria-hidden className="relative mx-[var(--space-24)] mb-[var(--space-8)] mt-[30px] h-[8px] rounded-[var(--radius-full)] bg-[var(--home-pill)]">
          {lo < 0 && <span className="absolute -top-[6px] h-[20px] w-px bg-[var(--home-line)]" style={{ left: `${x(0)}%` }} />}
          {onAxis.map((p) => {
            const max = p.size === "max";
            const tone = max ? "var(--red-500)" : "var(--sage-400)";
            return (
              <span key={p.size} className="contents">
                {p.to > p.from ? (
                  <span className="absolute inset-y-0 rounded-[var(--radius-full)] opacity-60" style={{ left: `${x(p.from)}%`, width: `${x(p.to) - x(p.from)}%`, background: tone }} />
                ) : (
                  <span className="absolute top-1/2 size-[14px] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-full)] border-[3px] border-[var(--neutral-0)]" style={{ left: `${x(p.to)}%`, background: tone }} />
                )}
                <span className="absolute -top-[28px] -translate-x-1/2 font-mono text-[12px] font-semibold" style={{ left: `${x((p.from + p.to) / 2)}%`, color: max ? tone : "var(--home-ink)" }}>
                  {p.size}
                </span>
              </span>
            );
          })}
          <span className="absolute left-0 top-[14px] font-mono text-[11px] text-[var(--home-ink-3)]">{lo}{unit}</span>
          <span className="absolute right-0 top-[14px] font-mono text-[11px] text-[var(--home-ink-3)]">{hi}{unit}</span>
        </div>
      )}
      <div className="grid gap-[var(--space-12)]" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }} role="table" aria-label={head.join(", ")}>
        {rows.map(([size, value, use], i) => (
          <div key={size} role="row" className={`flex flex-col gap-[6px] rounded-[14px] p-[var(--space-16)] ${size === "max" ? "bg-[var(--red-50)]" : "bg-[var(--home-canvas)]"}`}>
            {pictures && (
              <div className="-mx-[var(--space-8)] -mt-[var(--space-8)] mb-[var(--space-8)] rounded-[10px] bg-[var(--neutral-0)] py-[var(--space-8)]">
                <TokenDemo slug={demo!} value={value} i={i} max={size === "max"} />
              </div>
            )}
            <code role="cell" className={`w-fit font-mono text-[12px] font-semibold ${size === "max" ? "text-[var(--red-500)]" : "text-[var(--home-ink-3)]"}`}>{size}</code>
            <span role="cell" className="text-[17px] font-semibold leading-[1.3] text-[var(--home-ink)]">{value}</span>
            <span role="cell" className="text-[13px] leading-[1.45] text-[var(--home-ink-2)]">{use}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── rules: do (check) / don't (cross), read from the wording ────────────────────────── */

const DONT = /^(no|never|don't|do not|avoid)\b/i;

function Rules({ items }: { items: string[] }) {
  return (
    <ul className="grid grid-cols-2 gap-[var(--space-12)]">
      {items.map((it) => {
        const dont = DONT.test(it);
        return (
          <li key={it} className={`${CARD} flex items-start gap-[var(--space-12)] p-[var(--space-16)] text-[15px] leading-[1.5] text-[var(--home-ink)]`}>
            <span
              className={`mt-[1px] flex size-[22px] shrink-0 items-center justify-center rounded-[var(--radius-full)] ${dont ? "bg-[var(--red-50)] text-[var(--red-500)]" : "bg-[var(--sage-50)] text-[var(--sage-500)]"}`}
            >
              <Icon name={dont ? "close" : "check"} size={14} />
            </span>
            {it}
          </li>
        );
      })}
    </ul>
  );
}

/* ── evidence: the kind of evidence as a badge, the detail beside it ─────────────────── */

const EVIDENCE: Record<string, { ink: string; bg: string }> = {
  empirical: { ink: "var(--sage-500)", bg: "var(--sage-50)" },
  heuristic: { ink: "var(--web-ae7d24)", bg: "var(--home-mod-sound)" },
  hypothesis: { ink: "var(--home-ink-2)", bg: "var(--home-pill)" },
  literature: { ink: "var(--web-3f77a1)", bg: "color-mix(in srgb, var(--web-75add7) 18%, transparent)" },
};

function Evidence({ text }: { text: string }) {
  const m = text.match(/^(empirical|heuristic|hypothesis|literature)[\s;.]*(?:\((.*)\)\.?|(.*))$/i);
  const kind = m?.[1].toLowerCase();
  const tone = kind ? EVIDENCE[kind] : undefined;
  const detail = (m ? (m[2] ?? m[3]) : text)?.trim();
  return (
    <div className={`${CARD} flex items-center gap-[var(--space-16)] p-[var(--space-16)]`}>
      {tone && (
        <span className="shrink-0 rounded-[var(--radius-full)] px-[var(--space-12)] py-[5px] text-[13px] font-semibold capitalize" style={{ color: tone.ink, background: tone.bg }}>
          {kind}
        </span>
      )}
      {detail && <span className="text-[15px] leading-[1.5] text-[var(--home-ink-2)]">{detail}</span>}
    </div>
  );
}

/* ── matrix: ● main / ○ stand-in dots on a token × role grid ─────────────────────────── */

function Matrix({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className={`${CARD} p-[var(--space-20)]`} role="table" aria-label={head.join(", ")}>
      <div role="row" className="grid items-center gap-[var(--space-8)] border-b border-[var(--home-line)] pb-[var(--space-12)]" style={{ gridTemplateColumns: `1.4fr repeat(${head.length - 1}, 1fr)` }}>
        {head.map((h, i) => (
          <span key={h} role="columnheader" className={`${LABEL} ${i ? "text-center" : ""}`}>{h}</span>
        ))}
      </div>
      {rows.map(([name, ...cells]) => (
        <div key={name} role="row" className="grid items-center gap-[var(--space-8)] border-b border-[var(--home-line)] py-[var(--space-12)] last:border-b-0" style={{ gridTemplateColumns: `1.4fr repeat(${head.length - 1}, 1fr)` }}>
          <code role="rowheader" className="font-mono text-[14px] font-medium text-[var(--home-ink)]">{name}</code>
          {cells.map((c, i) => (
            <span key={i} role="cell" aria-label={c === "●" ? "main" : c === "○" ? "stand-in" : "—"} className="flex justify-center">
              {c === "●" ? (
                <span className="size-[18px] rounded-[var(--radius-full)] bg-[var(--sage-400)]" />
              ) : c === "○" ? (
                <span className="size-[18px] rounded-[var(--radius-full)] border-[2px] border-dashed border-[var(--sage-400)]" />
              ) : (
                <span className="size-[6px] rounded-[var(--radius-full)] bg-[var(--home-line)]" />
              )}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── pattern: when → do (behavior chips), the principle, the shared priority ─────────── */

const GUIDE = "/lab/guideline";
/** Behavior or token page for a chip word ("rub", "track"), if there is one. */
function pageOf(word: string): string | undefined {
  for (const id of ["behavior", "primitive-tokens"] as const) {
    const e = GUIDELINE.find((s) => s.id === id)?.entries.find((x) => x.slug === word.replace(/\s+/g, "-"));
    if (e) return `${GUIDE}/${id}/${e.slug}`;
  }
}

const ARROW = <span aria-hidden className="shrink-0 text-[18px] text-[var(--home-ink-3)]">→</span>;

function Pattern({ rows }: { rows: string[][] }) {
  const f = Object.fromEntries(rows.map(([k, v]) => [k, v]));
  // "doze, stretch (drift while waiting)" → chips + a caption; "— (state override …)" → no chips.
  const [, list = "", caption] = f.sequence?.match(/^([^(]*)(?:\((.*)\))?/) ?? [];
  const chips = list.split(",").map((c) => c.replace("…", "").trim()).filter((c) => c && c !== "—");
  const priority = (f.priority ?? "").split(">").map((p) => p.trim());
  return (
    <div className="flex flex-col gap-[var(--space-16)]">
      <div className="flex items-stretch gap-[var(--space-12)]">
        <div className={`${CARD} flex flex-1 flex-col gap-[6px] p-[var(--space-20)]`}>
          <span className={LABEL}>When</span>
          <span className="text-[17px] font-medium leading-[1.4] text-[var(--home-ink)]">{f.definition}</span>
        </div>
        <span className="flex items-center">{ARROW}</span>
        <div className={`${CARD} flex flex-1 flex-col gap-[10px] p-[var(--space-20)]`}>
          <span className={LABEL}>Do</span>
          <span className="flex flex-wrap items-center gap-[var(--space-8)]">
            {chips.length ? (
              chips.map((c, i) => {
                const href = pageOf(c);
                const cls = "rounded-[var(--radius-full)] bg-[var(--sage-50)] px-[var(--space-12)] py-[5px] font-mono text-[14px] font-medium text-[var(--sage-500)]";
                return (
                  <span key={c} className="flex items-center gap-[var(--space-8)]">
                    {href ? <Link href={href} className={`${cls} hover:bg-[var(--sage-100)]`}>{c}</Link> : <span className={cls}>{c}</span>}
                  </span>
                );
              })
            ) : (
              <span className="text-[15px] text-[var(--home-ink-3)]">—</span>
            )}
          </span>
          {caption && <span className="text-[13px] leading-[1.45] text-[var(--home-ink-2)]">{caption}</span>}
        </div>
      </div>
      {f.principle && (
        <blockquote className="rounded-[var(--radius-lg)] bg-[var(--home-ink)] px-[var(--space-24)] py-[var(--space-20)]">
          <span className="block text-[12px] font-medium text-[var(--home-ink-3)]">Principle</span>
          <span className="mt-[6px] block text-[22px] font-semibold leading-[1.35] text-[var(--neutral-0)]">{f.principle}</span>
        </blockquote>
      )}
      {priority.length > 1 && (
        <div className={`${CARD} flex flex-col gap-[10px] p-[var(--space-20)]`}>
          <span className={LABEL}>Priority (shared by every pattern)</span>
          <ol className="flex items-center gap-[var(--space-8)]">
            {priority.map((p, i) => (
              <li key={p} className="flex flex-1 items-center gap-[var(--space-8)]">
                <span
                  className={`flex-1 rounded-[10px] px-[var(--space-12)] py-[var(--space-8)] text-center text-[14px] font-medium capitalize ${i === 0 ? "bg-[var(--red-50)] text-[var(--red-500)]" : "bg-[var(--home-canvas)] text-[var(--home-ink)]"}`}
                  style={i ? { opacity: 1 - i * 0.15 } : undefined}
                >
                  {p}
                </span>
                {i < priority.length - 1 && <span aria-hidden className="text-[14px] text-[var(--home-ink-3)]">&gt;</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
      {f.note && <Note text={f.note} />}
    </div>
  );
}

/* ── machine: the "a → b → c" chain in the text as nodes, the text as the caption ────── */

function Machine({ text }: { text: string }) {
  const m = text.match(/([a-z][a-z ]*?)\s*→\s*([a-z][a-z ]*?)\s*→\s*([a-z]+)/i);
  if (!m) return <Note text={text} />;
  const nodes = m.slice(1, 4);
  return (
    <div className={`${CARD} flex flex-col gap-[var(--space-16)] p-[var(--space-24)]`}>
      <div aria-hidden className="flex items-center gap-[var(--space-12)]">
        {nodes.map((n, i) => (
          <span key={n} className="contents">
            <span className={`flex-1 rounded-[14px] px-[var(--space-16)] py-[var(--space-12)] text-center text-[15px] font-semibold capitalize ${i === 1 ? "bg-[var(--sage-50)] text-[var(--sage-500)]" : "bg-[var(--home-canvas)] text-[var(--home-ink)]"}`}>
              {n}
            </span>
            {i < nodes.length - 1 && ARROW}
          </span>
        ))}
        <span className="text-[18px] text-[var(--home-ink-3)]">⇢</span>
        <span className="rounded-[14px] border border-dashed border-[var(--home-line)] px-[var(--space-16)] py-[var(--space-12)] text-[15px] text-[var(--home-ink-2)]">next situation</span>
      </div>
      <p className="text-[14px] leading-[1.6] text-[var(--home-ink-2)]">{text}</p>
    </div>
  );
}

/* ── transitions: edges grouped by the situation they leave ──────────────────────────── */

function Node({ name }: { name: string }) {
  const safety = name === "Safety";
  const meta = /^(anywhere|every situation|previous situation)$/i.test(name);
  return (
    <span
      className={`whitespace-nowrap rounded-[10px] px-[var(--space-12)] py-[6px] text-[14px] font-medium ${
        safety ? "bg-[var(--red-50)] text-[var(--red-500)]" : meta ? "border border-dashed border-[var(--home-line)] text-[var(--home-ink-2)]" : "bg-[var(--home-canvas)] text-[var(--home-ink)]"
      }`}
    >
      {name}
    </span>
  );
}

function Transitions({ head, rows }: { head: string[]; rows: string[][] }) {
  const groups = rows.reduce<Map<string, string[][]>>((m, r) => m.set(r[0], [...(m.get(r[0]) ?? []), r]), new Map());
  return (
    <div className={`${CARD} flex flex-col divide-y divide-[var(--home-line)] px-[var(--space-20)]`} role="table" aria-label={head.join(", ")}>
      {[...groups].map(([from, edges]) => (
        <div key={from} role="row" className="flex items-start gap-[var(--space-16)] py-[14px]">
          <span role="rowheader" className="w-[150px] shrink-0">
            <Node name={from} />
          </span>
          <span role="cell" className="flex flex-wrap items-center gap-x-[var(--space-20)] gap-y-[var(--space-8)]">
            {edges.map(([, on, to]) => (
              <span key={to} className="flex items-center gap-[var(--space-8)]">
                <span aria-hidden className="flex items-center gap-[4px] text-[var(--home-ink-3)]">
                  {on && <span className="font-mono text-[12px]">{on}</span>}→
                </span>
                <Node name={to} />
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── roles: what each role runs on — present, stood in for "(attend)", or missing "—" ─── */

const ROLE_WHAT: Record<string, string> = { attend: "Gaze", posture: "Height, tilt", locomote: "Distance", gesture: "Pointing" };

/** "—" / "" = missing, "(attend)" = stood in by another role or part, else present. */
const roleState = (part: string) => (!part.trim() || part.trim() === "—" ? "missing" : /^\(.*\)$/.test(part.trim()) ? "standin" : "present");

function RoleCell({ part, compact }: { part: string; compact?: boolean }) {
  const state = roleState(part);
  const box =
    state === "present"
      ? "bg-[var(--sage-50)] text-[var(--sage-500)]"
      : state === "standin"
        ? "border-[1.5px] border-dashed border-[var(--sage-400)] text-[var(--sage-500)]"
        : "border-[1.5px] border-dashed border-[var(--home-line)] text-[var(--home-ink-3)]";
  const text = state === "missing" ? "None" : state === "standin" ? `via ${part.trim().slice(1, -1)}` : part;
  return <span className={`flex items-center justify-center rounded-[10px] text-center font-medium ${compact ? "min-h-[44px] px-[var(--space-8)] py-[6px] text-[13px]" : "min-h-[56px] px-[var(--space-12)] py-[var(--space-8)] text-[15px]"} ${box}`}>{text}</span>;
}

function Roles({ rows }: { rows: string[][] }) {
  const roles = rows.filter(([k]) => k.startsWith("role."));
  const substitute = rows.find(([k]) => k === "substitute")?.[1];
  return (
    <div className={`${CARD} flex flex-col gap-[var(--space-20)] p-[var(--space-24)]`}>
      <div className="grid grid-cols-4 gap-[var(--space-12)]" role="table" aria-label="Roles">
        {roles.map(([role, part]) => {
          const name = role.replace("role.", "");
          return (
            <div key={role} role="row" className="flex flex-col gap-[var(--space-8)]">
              <span role="rowheader" className="flex items-baseline justify-between gap-[var(--space-8)] px-[2px]">
                <code className="font-mono text-[13px] font-semibold text-[var(--home-ink)]">{name}</code>
                <span className="text-[12px] text-[var(--home-ink-3)]">{ROLE_WHAT[name]}</span>
              </span>
              <span role="cell">
                <RoleCell part={part} />
              </span>
            </div>
          );
        })}
      </div>
      {substitute && (
        <div className="flex items-center gap-[var(--space-12)] rounded-[14px] bg-[var(--home-canvas)] px-[var(--space-16)] py-[var(--space-12)]">
          <span className={LABEL}>Substitute</span>
          <span className="text-[15px] font-medium text-[var(--home-ink)]">{substitute}</span>
        </div>
      )}
      <RoleLegend />
    </div>
  );
}

function RoleLegend() {
  const item = (cls: string, label: string) => (
    <span className="flex items-center gap-[6px]">
      <span className={`size-[12px] rounded-[4px] ${cls}`} />
      {label}
    </span>
  );
  return (
    <div aria-hidden className="flex gap-[var(--space-20)] text-[12px] text-[var(--home-ink-3)]">
      {item("bg-[var(--sage-50)] border border-[var(--sage-100)]", "Has the part")}
      {item("border-[1.5px] border-dashed border-[var(--sage-400)]", "Stood in by another role")}
      {item("border-[1.5px] border-dashed border-[var(--home-line)]", "Missing")}
    </div>
  );
}

/* ── role-grid: the five form factors side by side, one row per profile ──────────────── */

function RoleGrid({ head, rows }: { head: string[]; rows: string[][] }) {
  // head: ID · Form · Also called · Attend · Posture · Locomote · Gesture · Substitute
  const cols = "grid-cols-[1.3fr_repeat(4,1fr)_1.1fr]";
  return (
    <div className={`${CARD} flex flex-col gap-[var(--space-8)] p-[var(--space-20)]`} role="table" aria-label={head.join(", ")}>
      <div role="row" className={`grid ${cols} items-end gap-[var(--space-8)] px-[2px] pb-[var(--space-4)]`}>
        <span role="columnheader" className={LABEL}>{head[1]}</span>
        {head.slice(3, 7).map((h) => (
          <span key={h} role="columnheader" className={`${LABEL} text-center`}>{h}</span>
        ))}
        <span role="columnheader" className={LABEL}>{head[7]}</span>
      </div>
      {rows.map(([id, form, alias, ...rest]) => (
        <div key={id} role="row" className={`grid ${cols} items-center gap-[var(--space-8)] border-t border-[var(--home-line)] pt-[var(--space-8)]`}>
          <span role="rowheader" className="flex flex-col gap-[2px]">
            <span className="text-[15px] font-semibold text-[var(--home-ink)]">{form}</span>
            <span className="text-[12px] text-[var(--home-ink-3)]">{alias}</span>
          </span>
          {rest.slice(0, 4).map((part, i) => (
            <span key={i} role="cell">
              <RoleCell part={part} compact />
            </span>
          ))}
          <span role="cell" className="text-[13px] leading-[1.4] text-[var(--home-ink-2)]">{rest[4] || "—"}</span>
        </div>
      ))}
      <div className="pt-[var(--space-8)]">
        <RoleLegend />
      </div>
    </div>
  );
}

/* ── tiles: a short list as a row of tiles ───────────────────────────────────────────── */

function Tiles({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-[var(--space-12)]" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it) => (
        <li key={it} className={`${CARD} flex h-[96px] items-end p-[var(--space-16)] text-[17px] font-semibold text-[var(--home-ink)]`}>
          {it}
        </li>
      ))}
    </ul>
  );
}

/* ── radar: the P1–P6 signature of a style example as a hexagon, the JSON beside it ──── */

function Radar({ text }: { text: string }) {
  let axes: Record<string, number> = {};
  let id = "";
  try {
    const j = JSON.parse(text) as { id?: string; axes?: Record<string, number> };
    axes = j.axes ?? {};
    id = j.id ?? "";
  } catch {
    // not valid JSON: show the text only
  }
  const keys = Object.keys(axes);
  const C = 110;
  const R = 84;
  const pt = (i: number, r: number) => {
    const a = (Math.PI * 2 * i) / keys.length - Math.PI / 2;
    return [C + Math.cos(a) * r, C + Math.sin(a) * r] as const;
  };
  const ring = (f: number) => keys.map((_, i) => pt(i, R * f).join(",")).join(" ");
  return (
    <div className={`${CARD} grid grid-cols-[240px_1fr] items-center gap-[var(--space-24)] p-[var(--space-24)]`}>
      {keys.length >= 3 ? (
        <svg viewBox="0 0 220 220" className="w-[240px]" role="img" aria-label={`${id} ${keys.map((k) => `${k} ${axes[k]}`).join(", ")}`}>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <polygon key={f} points={ring(f)} fill="none" stroke="var(--home-line)" />
          ))}
          {keys.map((k, i) => {
            const [x, y] = pt(i, R);
            const [lx, ly] = pt(i, R + 16);
            return (
              <g key={k}>
                <line x1={C} y1={C} x2={x} y2={y} stroke="var(--home-line)" />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="600" fill="var(--home-ink-2)">{k}</text>
              </g>
            );
          })}
          <polygon points={keys.map((k, i) => pt(i, R * axes[k]).join(",")).join(" ")} fill="color-mix(in srgb, var(--sage-400) 30%, transparent)" stroke="var(--sage-500)" strokeWidth="2" />
          {keys.map((k, i) => {
            const [x, y] = pt(i, R * axes[k]);
            return <circle key={k} cx={x} cy={y} r="3.5" fill="var(--sage-500)" />;
          })}
        </svg>
      ) : (
        <span />
      )}
      <pre className="overflow-x-auto rounded-[14px] bg-[var(--home-ink)] px-[var(--space-20)] py-[var(--space-16)] font-mono text-[13px] leading-[1.6] text-[var(--neutral-0)]">{text}</pre>
    </div>
  );
}

/* ── measures: each measure as a 0–100 gauge with its good direction ─────────────────── */

function Measures({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="grid grid-cols-2 gap-[var(--space-16)]">
      {rows.map(([name, meaning, criterion]) => {
        const lower = /lower is better/i.test(criterion);
        return (
          <div key={name} className={`${CARD} flex flex-col gap-[var(--space-16)] p-[var(--space-20)]`}>
            <span className="flex items-center justify-between gap-[var(--space-12)]">
              <span className="text-[17px] font-semibold text-[var(--home-ink)]">{name}</span>
              <span className={`rounded-[var(--radius-full)] px-[10px] py-[4px] text-[12px] font-semibold ${lower ? "bg-[var(--red-50)] text-[var(--red-500)]" : "bg-[var(--sage-50)] text-[var(--sage-500)]"}`}>
                {lower ? "↓ Lower is better" : "↑ Higher is better"}
              </span>
            </span>
            <span aria-hidden className="flex flex-col gap-[4px]">
              <span
                className="h-[10px] rounded-[var(--radius-full)]"
                style={{ background: `linear-gradient(to right, ${lower ? "var(--sage-400), var(--red-500)" : "var(--red-500), var(--sage-400)"})`, opacity: 0.7 }}
              />
              <span className="flex justify-between font-mono text-[11px] text-[var(--home-ink-3)]">
                <span>0</span>
                <span>100</span>
              </span>
            </span>
            <span className="text-[14px] leading-[1.5] text-[var(--home-ink-2)]">{meaning}</span>
            <span className="flex flex-col gap-[4px] border-t border-dashed border-[var(--home-line)] pt-[var(--space-12)]">
              <span className={LABEL}>{head[2]}</span>
              <span className="text-[14px] text-[var(--home-ink-2)]">{criterion}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── evidence-bars: recognition (%) and perceived malfunction (pt) as bars per stimulus ── */

const firstNumber = (s: string) => {
  const m = s.match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};

function Bar({ value, label, tone }: { value: number | null; label: string; tone: string }) {
  if (value === null) return <span className="text-[13px] text-[var(--home-line)]">—</span>;
  return (
    <span className="flex items-center gap-[var(--space-8)]" title={label}>
      <span className="relative h-[10px] flex-1 rounded-[var(--radius-full)] bg-[var(--home-pill)]">
        <span className="absolute inset-y-0 left-0 rounded-[var(--radius-full)]" style={{ width: `${Math.min(100, value)}%`, background: tone }} />
      </span>
      <span className="w-[120px] shrink-0 truncate text-[13px] font-medium text-[var(--home-ink)]">{label}</span>
    </span>
  );
}

function EvidenceBars({ head, rows }: { head: string[]; rows: string[][] }) {
  // head: Stimulus · Recognition · Main misread · Perceived malfunction · Other
  const cols = "grid-cols-[150px_1fr_1fr_1fr]";
  return (
    <div className={`${CARD} flex flex-col p-[var(--space-20)]`} role="table" aria-label={head.join(", ")}>
      <div role="row" className={`grid ${cols} gap-[var(--space-16)] border-b border-[var(--home-line)] pb-[var(--space-12)]`}>
        <span role="columnheader" className={LABEL}>{head[0]}</span>
        <span role="columnheader" className={`${LABEL} flex items-center gap-[6px]`}><span className="size-[8px] rounded-[var(--radius-full)] bg-[var(--sage-400)]" />{head[1]} (%, higher is better)</span>
        <span role="columnheader" className={`${LABEL} flex items-center gap-[6px]`}><span className="size-[8px] rounded-[var(--radius-full)] bg-[var(--red-500)]" />{head[3]} (pt, lower is better)</span>
        <span role="columnheader" className={LABEL}>{head[2]}, {head[4]}</span>
      </div>
      {rows.map(([stim, rec, misread, mal, other]) => (
        <div key={stim} role="row" className={`grid ${cols} items-center gap-[var(--space-16)] border-b border-[var(--home-line)] py-[10px] last:border-b-0`}>
          <span role="rowheader" className="text-[14px] font-semibold text-[var(--home-ink)]">{stim}</span>
          <span role="cell"><Bar value={firstNumber(rec)} label={rec} tone="var(--sage-400)" /></span>
          <span role="cell"><Bar value={firstNumber(mal)} label={mal} tone="var(--red-500)" /></span>
          <span role="cell" className="text-[13px] leading-[1.45] text-[var(--home-ink-2)]">{[misread, other].filter(Boolean).join(", ") || "—"}</span>
        </div>
      ))}
    </div>
  );
}

/* ── pairs: "A ↔ B" with the cues that tell them apart ───────────────────────────────── */

function Pairs({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="grid grid-cols-2 gap-[var(--space-12)]" role="table" aria-label={head.join(", ")}>
      {rows.map(([pair, cues]) => {
        const [a, b] = pair.split("↔").map((x) => x.trim());
        return (
          <div key={pair} role="row" className={`${CARD} flex flex-col gap-[var(--space-12)] p-[var(--space-16)]`}>
            <span role="rowheader" className="flex items-center gap-[var(--space-8)]">
              <span className="rounded-[10px] bg-[var(--home-canvas)] px-[var(--space-12)] py-[6px] text-[15px] font-semibold text-[var(--home-ink)]">{a}</span>
              <span aria-label="versus" className="text-[16px] text-[var(--home-ink-3)]">↔</span>
              <span className="rounded-[10px] bg-[var(--home-canvas)] px-[var(--space-12)] py-[6px] text-[15px] font-semibold text-[var(--home-ink)]">{b}</span>
            </span>
            <span role="cell" className="flex flex-col gap-[6px]">
              <span className={LABEL}>{head[1]}</span>
              <span className="flex flex-wrap gap-[6px]">
                {cues.split(", ").map((c) => (
                  <span key={c} className="rounded-[var(--radius-full)] bg-[var(--sage-50)] px-[10px] py-[4px] text-[13px] text-[var(--sage-500)]">{c}</span>
                ))}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
