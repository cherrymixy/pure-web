import type {
  ComponentDocSection,
  PrincipleFigure,
} from "@/data/guideline/types";
import { STRINGS } from "@/data/strings";

// Principle sections (no Figma frame), drawn in the Foundation language (block-views.tsx):
// white cards on the canvas, no border or stroke, type 17 / 15 / 14 / 13 / 12, ink + ink-2 text, fills instead of outlines.
// p-cards = type cards · p-flow = step flow · p-bullets = heading + points + figure
// p-phases = rhythm track + loop cards · p-compare = how-to-change cards · p-donts = don't cards.

type Of<K extends string> = Extract<ComponentDocSection, { kind: K }>;

const COL = "w-full max-w-[981.31px]";
const GRID = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" } as const;
const CARD = "rounded-[var(--radius-lg)] bg-[var(--neutral-0)]";
const PANEL = "rounded-[14px] bg-[var(--home-canvas)]";
const TITLE = "text-[15px] font-semibold leading-[1.45] text-[var(--home-ink)]";
const BODY = "text-[14px] leading-[1.55] text-[var(--home-ink-2)]";
const LABEL = "text-[12px] font-medium text-[var(--home-ink-3)]";
const PILL = "w-fit rounded-[var(--radius-xs)] bg-[var(--home-pill)] px-[var(--space-8)] py-[3px] font-mono text-[13px] text-[var(--home-ink)]";

/** Chips with arrows when `flow`, under an optional big label. small: inside cards so a three-step flow stays on one line. */
function Figure({ f, small = false }: { f: PrincipleFigure; small?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-[var(--space-12)] px-[var(--space-16)] text-center">
      {f.big && <span className="font-mono text-[26px] font-semibold leading-[32px] text-[var(--home-ink)]">{f.big}</span>}
      {f.chips?.length ? (
        <div className={`flex flex-wrap items-center justify-center ${small ? "gap-[var(--space-4)]" : "gap-[var(--space-8)]"}`}>
          {f.chips.map((c, i) => (
            <span key={i} className="flex items-center gap-[var(--space-4)]">
              <Chip first={i === 0} label={c} small={small} />
              {f.flow && i < f.chips!.length - 1 && <Arrow />}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Chip({ label, first, small = false }: { label: string; first: boolean; small?: boolean }) {
  return (
    <span
      className={`flex items-center whitespace-nowrap rounded-[var(--radius-full)] font-medium ${small ? "h-[28px] px-[var(--space-12)] text-[12px]" : "h-[34px] px-[var(--space-16)] text-[14px]"} ${
        first ? "bg-[var(--home-ink)] text-[var(--neutral-0)]" : "bg-[var(--neutral-0)] text-[var(--home-ink)]"
      }`}
    >
      {label}
    </span>
  );
}

function Arrow() {
  return <span aria-hidden className="shrink-0 text-[15px] text-[var(--home-ink-3)]">→</span>;
}

function Proposed() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-[var(--radius-full)] bg-[var(--home-pill)] px-[var(--space-8)] py-[2px] text-[12px] font-medium leading-[16px] text-[var(--home-ink-2)]">
      {STRINGS.guideline.proposed}
    </span>
  );
}

export function PrincipleCards({ s }: { s: Of<"p-cards"> }) {
  return (
    <div className={`${COL} grid gap-[var(--space-16)] ${GRID[s.columns ?? 4]}`}>
      {s.items.map((it) => (
        <div key={it.title} className={`${CARD} flex min-w-0 flex-col gap-[var(--space-12)] p-[var(--space-16)]`}>
          {it.figure && (
            <div aria-hidden className={`${PANEL} flex h-[120px] items-center justify-center overflow-hidden`}>
              <Figure f={it.figure} small />
            </div>
          )}
          <div className="flex flex-col gap-[6px] px-[4px]">
            {it.tag && <code className={PILL}>{it.tag}</code>}
            <span className={`flex flex-wrap items-center gap-[var(--space-8)] ${TITLE}`}>
              {it.title}
              {it.proposed && <Proposed />}
            </span>
            {it.subtitle && <span className={BODY}>{it.subtitle}</span>}
          </div>
          {it.info && (
            <div className={`${PANEL} mt-auto flex flex-col gap-[4px] px-[var(--space-12)] py-[10px]`}>
              <span className={LABEL}>{it.infoLabel ?? s.label}</span>
              <span className={BODY}>{it.info}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function PrincipleFlow({ s }: { s: Of<"p-flow"> }) {
  return (
    <div className={`${COL} ${CARD} flex flex-col items-center justify-center gap-[var(--space-24)] px-[var(--space-32)] py-[var(--space-40)]`}>
      <div className="flex flex-wrap items-start justify-center gap-y-[var(--space-16)]">
        {s.steps.map((st, i) => (
          <div key={i} className="flex items-start">
            <div className="flex max-w-[180px] flex-col items-center gap-[var(--space-8)] text-center">
              <span className={`flex h-[34px] items-center whitespace-nowrap rounded-[var(--radius-full)] px-[var(--space-16)] text-[14px] font-medium ${i === 0 ? "bg-[var(--home-ink)] text-[var(--neutral-0)]" : "bg-[var(--home-pill)] text-[var(--home-ink)]"}`}>
                {st.label}
              </span>
              {st.note && <span className="text-[13px] leading-[1.45] text-[var(--home-ink-2)]">{st.note}</span>}
            </div>
            {i < s.steps.length - 1 && (
              <span className="flex h-[34px] items-center px-[var(--space-12)]">
                <Arrow />
              </span>
            )}
          </div>
        ))}
      </div>
      {s.caption && <span className={`text-center ${TITLE}`}>{s.caption}</span>}
    </div>
  );
}

export function PrincipleBullets({ s }: { s: Of<"p-bullets"> }) {
  return (
    <div className={`${COL} grid grid-cols-2 gap-[var(--space-16)]`}>
      <div className={`${CARD} flex flex-col gap-[var(--space-16)] p-[var(--space-24)]`}>
        <span className="text-[17px] font-semibold text-[var(--home-ink)]">{s.heading}</span>
        <ul className="flex flex-col gap-[var(--space-12)]">
          {s.items.map((b, i) => (
            <li key={i} className={`flex items-start gap-[var(--space-12)] ${BODY}`}>
              <span aria-hidden className="mt-[8px] size-[6px] shrink-0 rounded-[var(--radius-full)] bg-[var(--home-ink-3)]" />
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div aria-hidden className={`${CARD} flex min-h-[200px] items-center justify-center py-[var(--space-24)]`}>
        <div className={`${PANEL} flex h-full w-[calc(100%-32px)] items-center justify-center py-[var(--space-24)]`}>
          <Figure f={s.figure} />
        </div>
      </div>
    </div>
  );
}

/** Rhythm track split into phases (short · long · short), labels under it, loop cards below. */
export function PrinciplePhases({ s }: { s: Of<"p-phases"> }) {
  const grow = (i: number) => (s.phases.length === 3 && i === 1 ? 3 : 1);
  return (
    <div className={`${COL} flex flex-col gap-[var(--space-16)]`}>
      <div className={`${CARD} flex flex-col gap-[var(--space-20)] p-[var(--space-24)]`}>
        <div aria-hidden className="flex h-[10px] gap-[4px]">
          {s.phases.map((p, i) => (
            <span
              key={p.title}
              style={{ flexGrow: grow(i) }}
              className={`basis-0 rounded-[var(--radius-full)] ${grow(i) > 1 ? "bg-[var(--home-ink)]" : "bg-[var(--home-pill)]"}`}
            />
          ))}
        </div>
        <div className="flex gap-[var(--space-16)]">
          {s.phases.map((p, i) => (
            <div
              key={p.title}
              style={{ flexGrow: grow(i) }}
              className={`flex basis-0 flex-col gap-[6px] ${i === 0 ? "items-start" : i === s.phases.length - 1 ? "items-end text-right" : "items-center text-center"}`}
            >
              <span className="flex items-center gap-[var(--space-8)]">
                <span className={TITLE}>{p.title}</span>
                <code className={PILL}>{p.time}</code>
              </span>
              <span className={`max-w-[300px] ${BODY}`}>{p.note}</span>
            </div>
          ))}
        </div>
      </div>
      {s.loops?.length ? (
        <div className="flex gap-[var(--space-16)]">
          {s.loops.map((l) => (
            <div key={l.title} className={`${CARD} flex min-w-0 flex-1 flex-col gap-[var(--space-8)] p-[var(--space-20)]`}>
              <span className={TITLE}>{l.title}</span>
              <span className={`whitespace-pre-line ${BODY}`}>{l.text}</span>
              <span className="mt-auto flex flex-wrap gap-[6px] pt-[var(--space-4)]">
                {l.chips.map((c) => (
                  <code key={c} className={PILL}>{c}</code>
                ))}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PrincipleCompare({ s }: { s: Of<"p-compare"> }) {
  return (
    <div className={`${COL} flex gap-[var(--space-16)]`}>
      {s.items.map((it) => (
        <div key={it.title} className={`${CARD} flex min-w-0 flex-1 flex-col gap-[var(--space-12)] p-[var(--space-16)]`}>
          <div className={`${PANEL} flex h-[120px] flex-col items-center justify-center gap-[var(--space-8)] overflow-hidden`}>
            <Figure f={it.figure} small />
            <span className="text-center text-[13px] font-medium text-[var(--home-ink-2)]">{it.caption}</span>
          </div>
          <div className="flex flex-col gap-[4px] px-[4px]">
            <span className={TITLE}>{it.title}</span>
            <span className={BODY}>{it.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PrincipleDonts({ s }: { s: Of<"p-donts"> }) {
  return (
    <div className={`${COL} grid grid-cols-3 gap-[var(--space-16)]`}>
      {s.items.map((it) => (
        <div key={it.title} className={`${CARD} flex min-w-0 flex-col gap-[var(--space-12)] p-[var(--space-16)]`}>
          <div aria-hidden className="flex h-[120px] items-center justify-center overflow-hidden rounded-[14px] bg-[var(--red-50)]">
            <Figure f={it.figure} small />
          </div>
          <div className="flex flex-col gap-[4px] px-[4px]">
            <span className="flex items-start gap-[var(--space-8)] text-[15px] font-semibold leading-[1.45] text-[var(--home-ink)]">
              <span aria-hidden className="mt-[1px] flex size-[20px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--red-50)] text-[12px] text-[var(--red-500)]">✕</span>
              {it.title}
            </span>
            <span className={BODY}>{it.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
