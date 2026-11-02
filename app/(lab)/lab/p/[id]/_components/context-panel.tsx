"use client";

import Link from "next/link";
import { useState, useId } from "react";
import { componentForSim, guidelineSlugFor } from "@/data/components";
import { simBehaviorLabel } from "@/data/sim-behaviors";
import type { appliedPatterns } from "@/data/patterns";
import { STRINGS, fmt } from "@/data/strings";
import type { Reference } from "@/lib/models";
import { splitLog, type InputEntry } from "@/lib/ui/input-log";
import { usedChannels, type ChannelTile } from "@/lib/expression";
import { timeAgo } from "@/lib/ui/time";
import { fileUrl } from "@/lib/ui/upload";
import { ReferencedSets } from "@/components/ui/referenced-sets";
import type { ReferenceItem } from "@/data/reference-sets";
import { Icon, type IconName } from "@/components/ui/icons/icon";
import { ConfirmModal } from "@/components/ui/modal";

const E = STRINGS.editor;

/** Reference ids for referenced-set items opened in the player: "set:" + public file path. */
export const SET_REF = "set:";


export interface EditorContext {
  components: string[];
  pattern: string;
  /** Attachments for the next input (tray above the prompt) */
  references: Reference[];
  /** Newest first */
  inputs: InputEntry[];
  /** Last prompt, reused when a component chip regenerates */
  lastPrompt: string;
}

export type PendingReference = { id: string; name: string };

const fileName = (r: Reference) =>
  r.kind === "userData" ? fmt(STRINGS.community.referenceLabel, { name: r.path }) : r.path.split("/").pop()?.replace(/^[0-9a-f]{8}-/, "") ?? "";

// Context tab (Figma 452:2268, content x 19): Current Status (latest input, "show history" opens the log + Clear),
// Reference = what the AI referenced, Component = channels per recipe step, Situation Pattern = the situations it fits.
// Sections 40 apart; headers = icon 16 · 5 · Medium 16 #6f6d6e with a 50% "go to guideline" link on the right.
export function ContextPanel({
  context,
  behaviors,
  steps = [],
  patterns = [],
  busy,
  reading = [],
  activeReference,
  onChange,
  onOpenReference,
  onOpenSetItem,
}: {
  context: EditorContext;
  /** Behaviors of the current expression, in recipe order */
  behaviors: string[];
  /** Channels per recipe step of the current expression (Component card) */
  steps?: ChannelTile[];
  /** Situation patterns the current expression fits (data/patterns appliedPatterns) */
  patterns?: ReturnType<typeof appliedPatterns>;
  busy: boolean;
  reading?: string[];
  activeReference: string | null;
  onChange: (patch: Partial<EditorContext>) => void;
  onOpenReference: (r: Reference) => void;
  /** Face / motion item of the referenced set → reference player */
  onOpenSetItem?: (item: ReferenceItem) => void;
}) {
  const [history, setHistory] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const { latest, shown } = splitLog(context.inputs, true);
  const used = usedChannels(steps);

  return (
    <div className="flex w-[394px] flex-col gap-[40px]">
      {/* Current Status (452:2277): Regular 18 · show history; card #f0f0f0, 1px #ececec, r 10, 12/18 · 14 */}
      <section className="flex w-[388px] flex-col gap-[16px]">
        <div className="flex h-[23px] items-start justify-between whitespace-nowrap">
          <h3 className="text-[18px] leading-[23px] text-[var(--context-title)]">{E.currentStatus}</h3>
          {latest && (
            <button type="button" aria-expanded={history} onClick={() => setHistory(!history)} className={`${LINK} mt-[3px]`}>
              {history ? E.hideHistory : E.showHistory}
            </button>
          )}
        </div>
        {latest ? (
          <InputCard entry={latest} strong reading={reading} activeReference={activeReference} onOpen={onOpenReference} />
        ) : (
          <p className={`${STATUS} text-[var(--text-tertiary)]`}>{E.statusEmpty}</p>
        )}
        {latest && history && (
          <div className="flex flex-col gap-[var(--space-8)]" data-testid="input-log">
            <span className="text-[14px] leading-[18px] text-[var(--text-secondary)]">{E.inputLog}</span>
            {shown.length === 0 && <span className="text-[14px] leading-[18px] text-[var(--text-tertiary)]">{E.noHistory}</span>}
            {shown.map((entry) => (
              <InputCard key={entry.id} entry={entry} reading={reading} activeReference={activeReference} onOpen={onOpenReference} />
            ))}
            {/* Clear lives at the end of the history: empties Current Status and the log */}
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmClear(true)}
              className="self-end text-[14px] leading-[18px] text-[var(--text-link)] underline disabled:opacity-40"
            >
              {E.clearStatus}
            </button>
          </div>
        )}
      </section>

      {/* What the AI referenced only exists once a motion was generated from an input (hidden while generating) */}
      {latest && !busy && (
        <ReferencedSets
          behaviors={behaviors}
          variant="strip"
          keywords={[latest.text, ...latest.attachments.map((r) => r.summary ?? "")].join(" ")}
          onOpen={onOpenSetItem}
          activeFile={activeReference?.startsWith(SET_REF) ? activeReference.slice(SET_REF.length) : null}
        />
      )}

      {/* Component (452:2350): card 394×228 #f2f2f2 r 16 — "N Multimodal", legend, one 122.333 tile per recipe step */}
      <section className="flex flex-col gap-[15px]">
        <SectionHeader icon="widget" label={E.component} href="/lab/guideline/behavior" />
        <div className="relative h-[228px] w-full overflow-hidden rounded-[16px] bg-[var(--context-card)] shadow-[inset_0_0_20px_0_rgb(255_255_255/0.65)]" data-testid="component-card">
          <p className="absolute left-[13px] top-[13px] flex gap-[3px] whitespace-nowrap text-[17.029px] font-medium leading-[23px] text-[var(--context-strong)]">
            <span>{used.length}</span>
            <span className="opacity-80">{E.multimodal}</span>
          </p>
          <div className="absolute left-[13px] top-[52px] flex items-center gap-[36px]">
            {LEGEND.map((c) => (
              <span key={c} className="flex items-center gap-[5px] whitespace-nowrap text-[14.25px] font-medium leading-[19px] text-[var(--context-tile-label)]">
                <span className="size-[13px] rounded-[2px]" style={{ background: BLOCK[c] }} />
                {E.tabs[c]}
              </span>
            ))}
          </div>
          {steps.length === 0 ? (
            <p className="absolute left-[13px] right-[13px] top-[100px] text-[14px] leading-[18px] text-[var(--text-tertiary)]">{E.componentEmpty}</p>
          ) : (
            <div className="absolute left-[13px] right-[13px] top-[94px] flex overflow-x-auto [scrollbar-width:none]">
              {steps.map((s, i) => (
                <StepTile key={`${s.group}-${i}`} tile={s} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Situation Pattern (452:2389): 125×112 cards #f2f2f2 r 10, gap 8 — the situations the current expression fits
          (data/patterns appliedPatterns: the one it was generated for + those sharing its components). Not a picker. */}
      <section className="flex flex-col gap-[15px]">
        <SectionHeader icon="round-graph" label={E.pattern} href="/lab/guideline/situation" />
        {patterns.length === 0 ? (
          <p className="text-[14px] leading-[18px] text-[var(--text-tertiary)]">{E.patternEmpty}</p>
        ) : (
          <div className="-mr-[17px] flex gap-[8px] overflow-x-auto pr-[17px] [scrollbar-width:none]" data-testid="applied-patterns">
            {patterns.map((p) => {
              const art = "art" in p ? p.art : undefined;
              return (
                <Link
                  key={p.id}
                  href={`/lab/guideline/situation/${p.id}`}
                  title={p.hint}
                  className="relative h-[112px] w-[125px] shrink-0 overflow-hidden rounded-[10px] bg-[var(--context-card)] shadow-[inset_0_0_20px_0_rgb(255_255_255/0.66)]"
                >
                  {art ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={art} alt="" className="absolute left-1/2 top-[11px] h-[62px] max-w-none -translate-x-1/2" />
                  ) : (
                    <Icon name="round-graph" size={40} className="absolute left-1/2 top-[22px] -translate-x-1/2 text-[var(--editor-field-label)]" />
                  )}
                  <span className="absolute inset-x-0 top-[81px] truncate px-[var(--space-8)] text-center text-[14px] font-medium leading-[19px] text-[var(--context-strong)] opacity-80">
                    {p.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmModal
        open={confirmClear}
        title={E.clearStatusConfirm.title}
        body={E.clearStatusConfirm.body}
        confirmLabel={E.clearStatus}
        danger
        onConfirm={() => {
          setConfirmClear(false);
          setHistory(false);
          onChange({ inputs: [] });
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}

const LINK = "text-[16px] font-medium leading-none text-[var(--library-section)] underline opacity-50";
const STATUS =
  "rounded-[10px] border border-[var(--context-status-border)] bg-[var(--context-status)] py-[14px] pl-[12px] pr-[18px] text-[16px] leading-[20px] shadow-[inset_0_0_20px_0_var(--neutral-0)]";

const LEGEND = ["sound", "face", "motion"] as const;
const BLOCK: Record<(typeof LEGEND)[number], string> = {
  sound: "var(--web-ecc377)",
  face: "var(--web-e2a1c1)",
  motion: "var(--context-motion)",
};

function SectionHeader({ icon, label, href }: { icon: IconName; label: string; href: string }) {
  return (
    <div className="flex h-[16px] items-center justify-between">
      <span className="flex items-center gap-[5px] whitespace-nowrap text-[16px] font-medium leading-none text-[var(--library-section)]">
        <Icon name={icon} size={16} />
        {label}
      </span>
      <Link href={href} className={LINK}>
        {E.goToGuideline}
      </Link>
    </div>
  );
}

/** Tile grid (Approach 452:2365): 4 columns × 3 rows of 26.559 cells from x 8; rows at 11.95 / 38.51 / 65.07 (r 5.154). */
const CELL = 26.559;
const GRID_X = 8;
const ROW_Y = [11.95, 38.51, 65.07];
/** Corner bridge (452:2373): 12.4 square centred where two blocks touch diagonally, concave on the open sides. */
const BRIDGE = 12.4;

/**
 * The Figma staircase, by how many channels the tile uses — channels go in the order they first come on
 * (first = top left), the last one takes the bottom row: 3 = Approach (1 cell · 2 cells · 2 + 1 cells),
 * 2 = 2 cells then 1 cell down-right, 1 = one cell (Shake / Nod). [row, [start, end) runs].
 */
const STAIRS: Record<number, [number, [number, number][]][]> = {
  1: [[2, [[0, 1]]]],
  2: [
    [1, [[0, 2]]],
    [2, [[2, 3]]],
  ],
  3: [
    [0, [[0, 1]]],
    [1, [[1, 3]]],
    [2, [
      [0, 2],
      [3, 4],
    ]],
  ],
};

/** Concave bridge path at corner (cx, cy); `down` = the lower block continues to the right (else to the left). */
function bridgePath(cx: number, cy: number, down: boolean): string {
  const s = BRIDGE;
  const r = s / 2;
  const x0 = cx - r;
  const y0 = cy - r;
  return down
    ? `M${x0},${y0} L${x0 + s - r},${y0} A${r},${r} 0 0 0 ${x0 + s},${y0 + r} L${x0 + s},${y0 + s} L${x0 + r},${y0 + s} A${r},${r} 0 0 0 ${x0},${y0 + s - r} Z`
    : `M${x0 + r},${y0} L${x0 + s},${y0} L${x0 + s},${y0 + s - r} A${r},${r} 0 0 0 ${x0 + s - r},${y0 + s} L${x0},${y0 + s} L${x0},${y0 + r} A${r},${r} 0 0 0 ${x0 + r},${y0} Z`;
}

function StepTile({ tile }: { tile: ChannelTile }) {
  const component = componentForSim(tile.behaviors[0]);
  const slug = component ? guidelineSlugFor(component.id) : null;
  const label = component?.label ?? simBehaviorLabel(tile.behaviors[0]);
  // Staircase in first-on order (lib/expression channelTiles) — the channel is told by its colour, not its row
  const layout = (STAIRS[tile.order.length] ?? []).map(([row, spans], i) => ({ c: tile.order[i], row, spans }));
  const blocks = layout.flatMap(({ c, row, spans }) => spans.map(([a, b]) => ({ c, row, a, b })));
  const bridges: { x: number; y: number; down: boolean; from: (typeof LEGEND)[number]; to: (typeof LEGEND)[number] }[] = [];
  for (let i = 0; i < layout.length - 1; i++) {
    const up = layout[i];
    const lo = layout[i + 1];
    for (const [ua, ub] of up.spans) {
      for (const [la, lb] of lo.spans) {
        if (la === ub) bridges.push({ x: GRID_X + ub * CELL, y: ROW_Y[lo.row], down: true, from: up.c, to: lo.c });
        if (lb === ua) bridges.push({ x: GRID_X + ua * CELL, y: ROW_Y[lo.row], down: false, from: up.c, to: lo.c });
      }
    }
  }
  const title = `${label} — ${tile.channels.map((c) => E.tabs[c]).join(" · ")}`;
  const gid = useId();
  const body = (
    <>
      <svg width={GRID_X * 2 + CELL * 4} height="92" className="absolute left-0 top-0 overflow-visible" aria-hidden>
        <defs>
          {bridges.map((b, i) => (
            <linearGradient key={i} id={`${gid}-${i}`} x1={b.down ? 0 : 1} y1="0" x2={b.down ? 1 : 0} y2="1">
              <stop offset="0" style={{ stopColor: BLOCK[b.from] }} />
              <stop offset="1" style={{ stopColor: BLOCK[b.to] }} />
            </linearGradient>
          ))}
        </defs>
        {blocks.map(({ c, row, a, b }) => (
          <rect key={`${c}-${a}`} x={GRID_X + a * CELL} y={ROW_Y[row]} width={(b - a) * CELL} height={CELL} rx="5.154" style={{ fill: BLOCK[c] }} />
        ))}
        {bridges.map((b, i) => (
          <path key={i} d={bridgePath(b.x, b.y, b.down)} fill={`url(#${gid}-${i})`} />
        ))}
      </svg>
      <span className="absolute left-[7.54px] top-[100px] max-w-[96px] truncate text-[13px] font-medium leading-[17px] text-[var(--context-tile-label)]">{label}</span>
      <Icon name="tile-chevron" size={9} className="absolute right-[12.4px] top-[107.75px] rotate-90 text-[var(--context-tile-chevron)]" />
    </>
  );
  const box = "relative h-[122.333px] min-w-[122.333px] flex-1 shrink-0 overflow-hidden rounded-[8.379px] bg-[var(--context-tile)] shadow-[inset_0_0_16.758px_0_rgb(255_255_255/0.76)]";
  return slug ? (
    <Link href={`/lab/guideline/behavior/${slug}`} title={title} className={box}>
      {body}
    </Link>
  ) : (
    <div title={title} className={box}>
      {body}
    </div>
  );
}

function InputCard({
  entry,
  strong = false,
  reading,
  activeReference,
  onOpen,
}: {
  entry: InputEntry;
  strong?: boolean;
  reading: string[];
  activeReference: string | null;
  onOpen: (r: Reference) => void;
}) {
  return (
    <div
      title={timeAgo(entry.at)}
      className={`flex flex-col gap-[var(--space-12)] ${strong ? STATUS : "rounded-[10px] border border-[var(--context-status-border)] py-[14px] pl-[12px] pr-[18px]"}`}
      data-testid={strong ? "current-status" : "input-entry"}
    >
      <span className={`text-[16px] leading-[20px] ${strong ? "text-[var(--context-title)]" : "text-[var(--text-secondary)]"}`}>{entry.text}</span>
      {entry.attachments.length > 0 && (
        <div className="flex flex-wrap gap-[var(--space-8)]">
          {entry.attachments.map((r) => (
            <button
              key={r.id}
              title={r.summary ?? fileName(r)}
              onClick={() => onOpen(r)}
              className={`flex items-center gap-[var(--space-8)] rounded-[var(--radius-sm)] border bg-[var(--bg-surface)] px-[var(--space-8)] py-[var(--space-4)] text-[14px] leading-[18px] ${r.status === "failed" ? "border-[var(--border-error)] text-[var(--text-error)]" : activeReference === r.id ? "border-[var(--border-strong)] text-[var(--text-primary)]" : "border-[var(--border-default)] text-[var(--text-primary)]"}`}
            >
              {r.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(r.thumb)} alt="" className="h-[20px] w-[28px] rounded-[var(--radius-2xs)] object-cover" />
              ) : (
                <span>{r.kind === "video" ? "▶" : r.kind === "userData" ? "◇" : "▣"}</span>
              )}
              <span className="max-w-[112px] truncate">{fileName(r)}</span>
              {r.status === "failed" ? <span>· {E.referenceFailed}</span> : reading.includes(r.id) ? <span>· {E.referenceReading}</span> : null}
            </button>
          ))}
        </div>
      )}
      {!strong && <span className="text-[12px] leading-[15px] text-[var(--text-tertiary)]">{timeAgo(entry.at)}</span>}
    </div>
  );
}
