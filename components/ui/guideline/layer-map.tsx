"use client";

import { useState } from "react";
import { STRINGS } from "@/data/strings";
import { Icon } from "../icons/icon";

// Layer map (System structure). Built from the guideline's ASCII tree, so the content stays in one place.

type TreeNode = { name: string; desc: string; more: string[]; kids: TreeNode[] };

/** "├─ Name ──── desc" / "├─ Name (desc)" / "├─ 1 Semantic   desc"; lines without a branch continue the previous node. Depth = column / 3. */
function parseTree(text: string): { root: string; nodes: TreeNode[] } {
  const [rootLine, ...lines] = text.split("\n");
  const nodes: TreeNode[] = [];
  const stack: { depth: number; node: TreeNode }[] = [];
  let last: TreeNode | undefined;
  for (const line of lines) {
    const at = line.search(/[├└]─/);
    if (at < 0) {
      const extra = line.replace(/[│]/g, "").trim();
      if (extra && last) last.more.push(extra);
      continue;
    }
    const depth = Math.round(at / 3);
    const body = line.slice(at + 2).trim();
    const dash = body.split(/\s─{2,}\s*/);
    let name = dash[0];
    let desc = dash.slice(1).join(" ");
    if (!desc) {
      const paren = body.match(/^([^(]+?)\s*\((.+)\)$/);
      const gap = body.match(/^(.+?)\s{2,}(.+)$/);
      // A wide gap separates name and description first ("Role   ATTEND … (+ FACE …)"); parentheses only when there is none.
      if (gap) [name, desc] = [gap[1], gap[2]];
      else if (paren) [name, desc] = [paren[1], paren[2]];
    }
    const node: TreeNode = { name: name.trim(), desc: desc.trim(), more: [], kids: [] };
    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    (stack.length ? stack[stack.length - 1].node.kids : nodes).push(node);
    stack.push({ depth, node });
    last = node;
  }
  return { root: rootLine.trim(), nodes };
}

const G = STRINGS.guideline.layerMap;
// Layer map in the user's "clean hub" reference (Carbonomy board): white field, black hub with the PURE mark, plain square tiles
// evenly round it on thin spokes, names only. Hover / focus a tile → it inverts, its spoke darkens, the side card shows the layer.
// Started from Figma "A · Hub & spokes" (qa6TWYGe4q8LjpH39WURd7, 3:14).
const W = 620;
const H = 620;
const HUB = { x: 310, y: 310 };
const R = 200;
const TILE = 112;
const SPOTS = [-90, -30, 30, 90, 150, 210].map((deg) => {
  const a = (deg * Math.PI) / 180;
  // Rounded so the server render and hydration agree.
  return { x: Math.round(HUB.x + R * Math.cos(a)), y: Math.round(HUB.y + R * Math.sin(a)) };
});

type Tile = { node: TreeNode; group: TreeNode };

/** Top-level nodes with children (Guideline) contribute their children as tiles; the rest are tiles themselves. */
function tilesOf(nodes: TreeNode[]): Tile[] {
  return nodes.flatMap((n) => (n.kids.length ? n.kids.map((k) => ({ node: k, group: n })) : [{ node: n, group: n }]));
}

/** Description split at " = ", then any continuation lines. */
function lines(n: TreeNode): string[] {
  return [...n.desc.split(/\s=\s/), ...n.more.map((m) => m.replace(/^[+=]\s*/, ""))].filter(Boolean);
}

const pct = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });

export function LayerMap({ text }: { text: string }) {
  const { root, nodes } = parseTree(text);
  const tiles = tilesOf(nodes).slice(0, SPOTS.length);
  const [active, setActive] = useState(0);
  const cur = tiles[active];

  return (
    <div className="flex items-stretch gap-[var(--space-20)]">
      <div className="relative aspect-square w-[620px] shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--neutral-0)]">
        <svg aria-hidden className="absolute inset-0 size-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {tiles.map((t, i) => (
            <line
              key={t.node.name}
              x1={HUB.x}
              y1={HUB.y}
              x2={SPOTS[i].x}
              y2={SPOTS[i].y}
              vectorEffect="non-scaling-stroke"
              strokeWidth="2"
              className={`transition-colors duration-[var(--motion-slow)] ${i === active ? "stroke-[var(--home-ink)]" : "stroke-[var(--home-line)]"}`}
            />
          ))}
        </svg>

        <div
          role="img"
          aria-label={root}
          className="absolute flex size-[148px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[36px] bg-[var(--home-ink)]"
          style={pct(HUB.x, HUB.y)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/lab/home/logo.svg" alt="" width={84} height={19} className="invert" />
        </div>

        {tiles.map((t, i) => {
          const on = i === active;
          return (
            <button
              key={t.node.name}
              type="button"
              aria-pressed={on}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              style={{ ...pct(SPOTS[i].x, SPOTS[i].y), width: TILE, height: TILE }}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[28px] px-[var(--space-12)] text-center text-[15px] transition-colors duration-[var(--motion-slow)] motion-reduce:transition-none ${
                on ? "bg-[var(--home-ink)] text-[var(--neutral-0)]" : "bg-[var(--home-pill)] text-[var(--home-ink-2)] hover:bg-[var(--home-nav-on)]"
              }`}
            >
              {t.node.name}
            </button>
          );
        })}

        <span className="absolute bottom-[20px] left-1/2 -translate-x-1/2 text-[12px] text-[var(--home-ink-3)]">{G.hint}</span>
      </div>

      <aside aria-live="polite" className="flex min-w-0 flex-1 flex-col rounded-[var(--radius-lg)] bg-[var(--neutral-0)] p-[var(--space-32)]">
        <div className="flex items-center gap-[var(--space-12)]">
          <span className="rounded-[var(--radius-full)] bg-[var(--home-pill)] px-[12px] py-[5px] text-[12px] font-medium text-[var(--home-ink-2)]">{cur.group.name}</span>
          <span className="flex-1" />
          <span className="font-mono text-[12px] text-[var(--home-ink-3)]">
            {String(active + 1).padStart(2, "0")} / {String(tiles.length).padStart(2, "0")}
          </span>
          {/* mini map: the same six spots, current one filled */}
          <span aria-hidden className="relative size-[34px]">
            {SPOTS.slice(0, tiles.length).map((p, i) => (
              <span
                key={i}
                className={`absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-[2px] transition-colors ${i === active ? "bg-[var(--home-ink)]" : "bg-[var(--home-line)]"}`}
                style={{ left: `${50 + ((p.x - HUB.x) / R) * 42}%`, top: `${50 + ((p.y - HUB.y) / R) * 42}%` }}
              />
            ))}
            <span className="absolute left-1/2 top-1/2 size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-[var(--home-ink)]" />
          </span>
        </div>

        <div key={cur.node.name} className="anim-fade-in mt-[var(--space-32)] flex min-h-0 flex-1 flex-col gap-[var(--space-16)] overflow-y-auto">
          <h3 className="text-[32px] font-semibold leading-[1.15] text-[var(--home-ink)]">{cur.node.name}</h3>
          {lines(cur.node)[0] && <p className="max-w-[440px] text-[16px] leading-[1.55] text-[var(--home-ink-2)]">{lines(cur.node)[0]}</p>}
          {lines(cur.node).length > 1 && (
            <ul className="flex flex-col border-t border-[var(--home-line)]">
              {lines(cur.node).slice(1).map((l) => (
                <li key={l} className="border-b border-[var(--home-line)] py-[var(--space-12)] text-[14px] leading-[1.5] text-[var(--home-ink-2)]">
                  {l}
                </li>
              ))}
            </ul>
          )}
          {cur.node.kids.length > 0 && (
            <div className="grid grid-cols-2 gap-[var(--space-12)]">
              {cur.node.kids.map((k) => (
                <div key={k.name} className="flex flex-col gap-[var(--space-12)] rounded-[var(--radius-md)] bg-[var(--home-pill)] p-[var(--space-16)]">
                  <span className="flex flex-col gap-[2px]">
                    <span className="text-[15px] font-semibold text-[var(--home-ink)]">{k.name}</span>
                    {k.desc && <span className="text-[12px] text-[var(--home-ink-3)]">{k.desc}</span>}
                  </span>
                  <span className="flex flex-wrap gap-[6px]">
                    {k.kids.map((g) => (
                      <span key={g.name} title={[g.desc, ...g.more].join(" ")} className="rounded-[var(--radius-full)] bg-[var(--neutral-0)] px-[10px] py-[5px] text-[12px] font-medium text-[var(--home-ink)]">
                        {g.name.replace(/^\d+\s+/, "")}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-[var(--space-24)] flex items-center gap-[var(--space-12)] border-t border-[var(--home-line)] pt-[var(--space-16)]">
          <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--home-ink-3)]">
            {cur.group.name} · {cur.group.desc}
          </span>
          {[-1, 1].map((d) => (
            <button
              key={d}
              type="button"
              aria-label={d < 0 ? G.prev : G.next}
              onClick={() => setActive((active + d + tiles.length) % tiles.length)}
              className="flex size-[36px] shrink-0 items-center justify-center rounded-[var(--radius-full)] border border-[var(--home-line)] text-[var(--home-ink-2)] transition-colors hover:border-[var(--home-ink)] hover:bg-[var(--home-ink)] hover:text-[var(--neutral-0)]"
            >
              <Icon name="chevron-right-small" size={18} className={d < 0 ? "rotate-180" : undefined} />
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
