import type { GuidelineBlock } from "@/data/guideline/types";
import { Icon } from "../icons/icon";
import { Figure } from "./figures";
import { LayerMap } from "./layer-map";

// Lab-style presentations of guideline body blocks (block.view). Same content as the plain table / code / list —
// only the shape changes. Type scale shared with Lab: 22 / 17 / 15 / 14 / 13 / 12. White cards on the canvas, no border or shadow.

const CARD = "rounded-[var(--radius-lg)] bg-[var(--neutral-0)]";
const LABEL = "text-[12px] font-medium text-[var(--home-ink-3)]";

export function BlockView({ b }: { b: GuidelineBlock }) {
  if (b.kind === "code" && b.view === "tree") return <LayerMap text={b.text} />;
  if (b.kind === "code" && b.view === "formula") return <Formula text={b.text} />;
  if (b.kind === "table" && b.view === "cards") return <TableCards head={b.head} rows={b.rows} figures={b.figures} />;
  if (b.kind === "table" && b.view === "levels") return <Levels head={b.head} rows={b.rows} />;
  if (b.kind === "table" && b.view === "steps") return <Steps head={b.head} rows={b.rows} />;
  if (b.kind === "table" && b.view === "chips") return <Chips head={b.head} rows={b.rows} />;
  if (b.kind === "list" && b.view === "checklist") return <Checklist items={b.items} />;
  if (b.kind === "p" && b.view === "note") return <Note text={b.text} />;
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

function Steps({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <ol className="grid gap-[var(--space-8)]" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
      {rows.map(([step, question, reads], i) => {
        const m = step.match(/^(\d+)\s+(.+)$/);
        const [n, title] = m ? [m[1], m[2]] : [String(i + 1), step];
        return (
          <li key={step} className={`${CARD} relative flex flex-col gap-[var(--space-12)] p-[var(--space-16)]`}>
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
    <div className="grid grid-cols-4 gap-[var(--space-12)]" role="table" aria-label={head.join(" · ")}>
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
