import Link from "next/link";
import type { ComponentDoc, ComponentDocSection, DocChannel, GuidelineEntry } from "@/data/guideline/types";
import { STRINGS } from "@/data/strings";
import { DocToc, type TocItem } from "./doc-toc";
import { GuidelineTree } from "./guideline-tree";

const G = STRINGS.guideline;
const A = "/figma/guideline/approach";
const I = "/figma/guideline/icons";

// Component-page template — Figma W03-4L "Components · Approach" (808:1254), 960 frame ×2 (decisions: STEP 22).
// Content card 808:1255 = main column + search / On this page (808:1580, 808:1277…). In the lab the guideline tree lives in
// the app sidebar (LabNav); on the public route it sits in its own card on the left.

export function ComponentDocPage({ entry, doc, base, current, isPublic }: { entry: GuidelineEntry; doc: ComponentDoc; base: string; current: string; isPublic: boolean }) {
  const sections = doc.rows.flatMap((r) => (Array.isArray(r) ? r : [r]));
  const toc: TocItem[] = [{ id: "common", label: G.common }, ...sections.map((s) => ({ id: s.id, label: s.toc ?? s.title }))];
  const stickyTop = isPublic ? "top-[136px]" : "top-[var(--space-32)]";
  const scrollMt = isPublic ? "scroll-mt-[136px]" : "scroll-mt-[var(--space-32)]";

  return (
    <div className={`flex items-start gap-[29px] pb-[var(--space-32)] pr-[var(--space-32)] pt-[var(--space-32)] ${isPublic ? "pl-[var(--space-32)]" : "pl-[29px]"}`}>
      {isPublic && (
        <nav aria-label={G.contents} className={`sticky w-[268px] shrink-0 ${stickyTop}`}>
          <GuidelineTree base={base} current={current} />
        </nav>
      )}

      <div className="flex min-w-0 flex-1 items-start gap-[118px] rounded-[var(--radius-xl)] bg-[var(--bg-surface)] pb-[75px] pl-[69px] pr-[61px] pt-[62px] leading-normal">
        <article className="flex min-w-0 flex-1 flex-col">
          <span className="text-[14px] font-medium text-[var(--text-primary)]">{doc.breadcrumb}</span>
          <header id="common" className={`mt-[var(--space-28)] flex flex-col gap-[var(--space-32)] ${scrollMt}`}>
            <div className="flex flex-col gap-[var(--space-28)]">
              <h1 className="text-[60px] font-semibold text-[var(--text-primary)]">{entry.title}</h1>
              <p className="text-[18px] text-[var(--text-secondary)]">
                {doc.lead.map((l, i) => <span key={i} className="block">{l}</span>)}
              </p>
            </div>
            <div className="flex flex-wrap gap-[var(--space-12)]">
              {doc.resources.map((r) => (r.href ? <Link key={r.label} href={r.href} className={`${PILL} hover:bg-[var(--neutral-50)]`}>{r.label}</Link> : <span key={r.label} className={PILL}>{r.label}</span>))}
            </div>
          </header>

          <div className="mt-[50px] flex flex-col gap-[119px]">
            {doc.rows.map((r, i) =>
              Array.isArray(r) ? (
                <div key={i} className="flex items-start gap-[var(--space-48)]">
                  <Section s={r[0]} scrollMt={scrollMt} className="min-w-0 flex-1" />
                  <Section s={r[1]} scrollMt={scrollMt} className="w-[355px] shrink-0" />
                </div>
              ) : (
                <Section key={i} s={r} scrollMt={scrollMt} />
              ),
            )}
          </div>

          {(doc.prev || doc.next) && (
            <footer className="mt-[118px] grid grid-cols-2 gap-[var(--space-12)]">
              {doc.prev ? <NeighborCard href={`${base}/${doc.prev.path}`} label={G.prevDoc} title={doc.prev.title} /> : <span />}
              {doc.next ? <NeighborCard href={`${base}/${doc.next.path}`} label={G.nextDoc} title={doc.next.title} end /> : <span />}
            </footer>
          )}
        </article>

        <aside className={`sticky -mt-[30px] w-[333px] shrink-0 ${stickyTop}`}>
          <DocToc title={G.onThisPage} searchLabel={G.search} emptyLabel={G.noMatch} items={toc} />
        </aside>
      </div>
    </div>
  );
}

const PILL = "rounded-[var(--radius-full)] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-16)] py-[var(--space-8)] text-[14px] font-medium text-[var(--text-primary)]";

function Section({ s, scrollMt, className = "" }: { s: ComponentDocSection; scrollMt: string; className?: string }) {
  return (
    <section id={s.id} aria-labelledby={`${s.id}-h`} className={`flex flex-col ${scrollMt} ${className}`} style={{ gap: s.gap ?? 40 }}>
      <div className="flex flex-col gap-[var(--space-8)]">
        <h2 id={`${s.id}-h`} className="text-[26px] font-medium text-[var(--text-primary)]">{s.title}</h2>
        <p className="text-[14px] text-[var(--text-secondary)]">{s.text}</p>
      </div>
      <SectionBody s={s} />
    </section>
  );
}

function SectionBody({ s }: { s: ComponentDocSection }) {
  switch (s.kind) {
    case "robot":
      return (
        <div className="flex items-start gap-[var(--space-40)]">
          <ul className="flex w-[181px] shrink-0 flex-col gap-[var(--space-16)]">
            {s.classes.map((c, i) => {
              const on = i === s.selected;
              return (
                <li
                  key={c.label}
                  aria-current={on ? "true" : undefined}
                  className={`flex h-[40px] items-center gap-[var(--space-8)] px-[var(--space-16)] py-[var(--space-8)] text-[14px] ${
                    on ? "rounded-[var(--radius-full)] bg-[var(--sage-100)] text-[var(--text-primary)]" : "rounded-[var(--radius-sm)] text-[var(--text-tertiary)]"
                  }`}
                >
                  <ClassIcon icon={c.icon} on={on} />
                  {c.label}
                </li>
              );
            })}
          </ul>
          <RobotStage notes={s.notes} />
        </div>
      );
    case "intensity":
      return (
        <div className="flex gap-[var(--space-16)]">
          {s.levels.map((l) => (
            <div key={l.title} className="flex min-w-0 flex-1 flex-col gap-[var(--space-12)] rounded-[var(--radius-lg)] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] p-[var(--space-20)]">
              {/* Illustration 808:1372 in a 136.57-wide preview, x as % so it spans any card width: ghost = start, dot = reach, bar = target */}
              <div aria-hidden className="relative h-[119px] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--sage-50)]">
                <img src={`${A}/int-ghost.png`} alt="" width={59.47} height={59.47} className="absolute left-[16.45%] top-[29.74px] opacity-30" />
                <img src={`${A}/int-ball.svg`} alt="" width={59.47} height={59.47} className="absolute top-[29.74px]" style={{ left: `${((22.47 + 25.35 * l.reach) / 136.57) * 100}%` }} />
                <span className="absolute left-[94.54%] top-[9.92px] h-[99.12px] w-[3.96px] rounded-[var(--radius-full)] bg-[var(--neutral-700)]" />
              </div>
              <span className="text-[18px] font-medium text-[var(--text-primary)]">{l.title}</span>
              <div className="flex flex-wrap items-start justify-between gap-y-[var(--space-8)]">
                <div className="flex items-center gap-[var(--space-8)]">
                  {l.chips.map((c) => (
                    <span key={c} className="rounded-[var(--radius-xs)] bg-[var(--bg-canvas)] px-[var(--space-16)] py-[var(--space-8)] text-[12px] text-[var(--text-link)]">{c}</span>
                  ))}
                </div>
                <code className="flex h-[48px] items-center rounded-[var(--radius-xs)] border-2 border-[var(--neutral-50)] p-[var(--space-12)] font-mono text-[10px] font-medium text-[var(--neutral-600)]">{l.token}</code>
              </div>
            </div>
          ))}
        </div>
      );
    case "timeline":
      return (
        <div className="flex flex-col gap-[13px]">
          <div className="flex justify-between pl-[142px] pr-[18px] text-[14px] text-[var(--web-7e7f7f)]">
            <span>0 s</span>
            <span>{s.duration} s</span>
          </div>
          <div className="flex flex-col gap-[var(--space-12)]">
            {s.tracks.map((t) => (
              <div key={t.channel} className="flex items-center">
                <span className="flex w-[142px] shrink-0 items-center gap-[var(--space-8)] text-[20px] font-semibold text-[var(--neutral-950)]">
                  <img src={`${I}/tl-${t.channel}.svg`} alt="" width={29.74} height={29.74} />
                  {t.label}
                </span>
                <div className="relative h-[59.47px] min-w-0 flex-1 rounded-[var(--radius-sm)] bg-[var(--bg-canvas)]">
                  {t.clips.map((c, i) => (
                    <span
                      key={i}
                      className={`absolute bottom-[8.92px] top-[8.92px] flex items-center overflow-hidden whitespace-nowrap rounded-[var(--radius-sm)] text-[14px] font-bold text-[var(--text-on-inverse)] ${CLIP[t.channel]} ${
                        c.align === "start" ? "pl-[18px]" : "justify-center"
                      }`}
                      style={{ left: `${(c.from / s.duration) * 100}%`, width: `${((c.to - c.from) / s.duration) * 100}%` }}
                    >
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case "table": {
      const col = (j: number) => (s.widths[j] == null ? "min-w-0 flex-1" : "shrink-0");
      const w = (j: number) => (s.widths[j] == null ? undefined : { width: s.widths[j]! });
      return (
        <div role="table" className="flex flex-col overflow-hidden rounded-[var(--radius-sm)] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] text-[16px]">
          <div role="row" className="flex items-center gap-[var(--space-16)] bg-[var(--bg-canvas)] px-[var(--space-16)] py-[var(--space-12)] font-medium text-[var(--text-secondary)]">
            {s.head.map((h, j) => <span role="columnheader" key={j} className={col(j)} style={w(j)}>{h}</span>)}
          </div>
          {s.rows.map((r, i) => (
            <div role="row" key={i} className={`flex items-center gap-[var(--space-16)] px-[var(--space-16)] py-[var(--space-12)] ${i ? "border-t-[0.5px] border-[var(--border-default)]" : ""}`}>
              {r.map((c, j) => (
                <span role="cell" key={j} className={`${col(j)} ${CELL[s.cols[j]]}`} style={w(j)}>
                  {s.cols[j] === "track" && isChannel(c) ? (
                    <span className={`flex items-center gap-[var(--space-4)] font-medium ${TRACK_TEXT[c]}`}>
                      <img src={`${I}/spec-${c}.svg`} alt="" width={17.84} height={17.84} />
                      {c}
                    </span>
                  ) : (
                    c
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
    }
    case "states":
      return (
        <ul className="flex flex-col items-start gap-[var(--space-8)] text-[16px]">
          {s.items.map((it) => (
            <li key={it.state} className="flex gap-[var(--space-8)] whitespace-nowrap rounded-[var(--radius-xs)] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-16)] py-[var(--space-8)]">
              <span className="font-medium text-[var(--text-primary)]">{it.state}</span>
              <span className="ms-[var(--space-24)] list-item list-disc text-[var(--text-secondary)]">{it.effect}</span>
            </li>
          ))}
        </ul>
      );
  }
}

const CLIP: Record<DocChannel, string> = { sound: "bg-[var(--web-e0c99f)]", face: "bg-[var(--web-e2a1c1)]", motion: "bg-[var(--sage-200)]" };
const TRACK_TEXT: Record<DocChannel, string> = { motion: "text-[var(--web-75add7)]", face: "text-[var(--web-e2a1c1)]", sound: "text-[var(--web-f2a65a)]" };
const CELL = {
  key: "font-semibold text-[var(--text-primary)]",
  label: "font-medium text-[var(--text-secondary)]",
  muted: "text-[var(--text-secondary)]",
  text: "text-[var(--text-primary)]",
  code: "font-mono font-medium text-[var(--text-primary)]",
  track: "text-[var(--text-primary)]",
} as const;
const isChannel = (v: string): v is DocChannel => v === "motion" || v === "face" || v === "sound";

/** Robot-class icons (808:1293…1328): Figma strokes drawn as masks so the selected one can take the dark color. Size = svg ×2. */
const CLASS_ICON = {
  wheel: [14.09, 20.82],
  "wheel-arm": [16.47, 19.64],
  arm: [18.06, 20.83],
  quad: [18.84, 18.06],
  human: [14.88, 22.42],
} as const;

function ClassIcon({ icon, on }: { icon: keyof typeof CLASS_ICON; on: boolean }) {
  const [w, h] = CLASS_ICON[icon];
  const mask = `url(${I}/icon-${icon}.svg) center / contain no-repeat`;
  return (
    <span aria-hidden className="flex size-[23.79px] shrink-0 items-center justify-center">
      <span style={{ width: w, height: h, mask, WebkitMask: mask }} className={on ? "bg-[var(--neutral-800)]" : "bg-[var(--neutral-400)]"} />
    </span>
  );
}

/** Robot stage 808:1334 — drawn at Figma coordinates (376.67×189.82) with zoom 2, centered on a stage that fills the row. */
function RobotStage({ notes }: { notes: [string, string] }) {
  const bubble = "absolute flex h-[15.364px] items-center justify-center overflow-hidden rounded-[var(--radius-full)] bg-[var(--bg-inverse)] text-[6px] whitespace-nowrap text-[var(--neutral-100)]";
  const dot = "absolute flex size-[19.824px] items-center justify-center overflow-hidden rounded-[var(--radius-full)] bg-[var(--bg-inverse)]";
  return (
    <div aria-hidden className="relative flex h-[380px] min-w-[753px] flex-1 justify-center overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-canvas)]">
      <div className="relative h-[189.819px] w-[376.665px] shrink-0 leading-normal" style={{ zoom: 2 }}>
        <div className="absolute left-[188.33px] top-[79.79px] flex h-[110.026px] w-[57.987px] items-center justify-center">
          <div className="flex-none rotate-180 -scale-y-100">
            <div className="relative h-[110.026px] w-[57.987px]">
              <Fill src="v25580.svg" inset="inset-[-0.21%_-0.76%]" />
            </div>
          </div>
        </div>
        <div className="absolute left-[108.54px] top-[79.79px] h-[110.026px] w-[57.987px]">
          <Fill src="v25578.svg" inset="inset-[-0.21%_-0.76%]" />
        </div>
        <div className="absolute left-[132.11px] top-[133.82px] flex h-[25.134px] w-[195.119px] items-center justify-center">
          {/* Figma's matrix: scale, then skew, then rotate (Tailwind's rotate/scale props would apply after the skew) */}
          <div className="flex-none" style={{ transform: "rotate(6deg) skewX(-76deg) scaleY(0.24)" }}>
            <div className="relative h-[131.833px] w-[64.925px] opacity-20">
              <img alt="" src={`${A}/robot-shadow.png`} className="pointer-events-none absolute inset-0 size-full max-w-none object-bottom" />
            </div>
          </div>
        </div>
        <div className="absolute left-[161.07px] top-[47.58px] h-[22.798px] w-[28.745px] bg-[var(--bg-surface)]" />
        <div className="absolute left-[193.78px] top-[123.41px] h-0 w-[55.509px]">
          <Fill src="vec.svg" inset="inset-[-0.25px_-0.45%]" />
        </div>
        <img alt="" src={`${A}/robot.png`} className="pointer-events-none absolute left-[145.21px] top-[31.22px] h-[131.833px] w-[64.925px] max-w-none object-bottom" />
        <img alt="" src={`${A}/ellipse28.svg`} className="absolute left-[249.29px] top-[138.28px] block h-[5.452px] w-[36.675px] max-w-none" />
        <div className="absolute left-[200.23px] top-[102.16px] flex h-[91.531px] w-[106.804px] items-center justify-center">
          <img alt="" src={`${A}/rect83.svg`} className="block h-[58.332px] w-[90.534px] max-w-none flex-none rotate-[25.4deg]" />
        </div>
        <div className="absolute left-[96.89px] top-[85.49px] h-[48.322px] w-[96.892px]">
          <Fill src="vec1.svg" inset="inset-[-2.74%_-1.36%]" />
        </div>
        <div className="absolute left-[114.98px] top-[58.98px] h-0 w-[47.579px]">
          <Fill src="vec2.svg" inset="inset-[-1.32px_-2.78%_-1.32px_-0.52%]" />
        </div>
        <img alt="" src={`${A}/v25581.svg`} className="absolute left-1/2 top-[125.39px] block h-[0.991px] w-[431.182px] max-w-none -translate-x-1/2" />
        <img alt="" src={`${A}/v25584.svg`} className="absolute left-1/2 top-[171.36px] block h-[1.24px] w-[431.182px] max-w-none -translate-x-1/2" />
        <img alt="" src={`${A}/v25583.svg`} className="absolute left-1/2 top-[84px] block h-[0.496px] w-[310.253px] max-w-none -translate-x-1/2" />
        <div className="absolute left-[95.16px] top-[39.65px] flex size-[18.833px] items-center justify-center">
          <img alt="" src={`${A}/rect81.svg`} className="block size-[18.833px] max-w-none flex-none rotate-180 -scale-y-100" />
        </div>
        <span className={`${bubble} left-[32.21px] top-[33.7px] w-[72.359px]`}>{notes[0]}</span>
        <div className="absolute left-[218.56px] top-[81.28px] flex h-[110.026px] w-[151.162px] items-center justify-center">
          <div className="flex-none rotate-180 -scale-y-100">
            <div className="relative h-[110.026px] w-[151.162px]">
              <Fill src="v25579.svg" inset="inset-[-0.36%_-0.19%]" />
            </div>
          </div>
        </div>
        <img alt="" src={`${A}/rect19.svg`} className="absolute left-[254.25px] top-[103.58px] block size-[18.833px] max-w-none" />
        <div className="absolute left-[-8.92px] top-[79.79px] h-[110.026px] w-[151.162px]">
          <Fill src="v25577.svg" inset="inset-[-0.36%_-0.19%]" />
        </div>
        <span className={`${dot} left-[104.57px] top-[49.07px]`}><img alt="" src={`${A}/stage-face.svg`} className="block size-[11.895px]" /></span>
        <span className={`${dot} left-[243.84px] top-[113px]`}><img alt="" src={`${A}/stage-sound.svg`} className="block size-[11.895px]" /></span>
        <span className={`${dot} left-[83.76px] top-[123.9px]`}><img alt="" src={`${A}/stage-motion.svg`} className="block size-[11.895px]" /></span>
        <span className={`${bubble} left-[263.67px] top-[97.64px] w-[89.21px]`}>{notes[1]}</span>
      </div>
      {/* Play 808:1349/1350 — top-right of the stage (no media yet) */}
      <span className="absolute right-[var(--space-24)] top-[var(--space-24)] flex size-[55.5px] items-center justify-center">
        <img alt="" src={`${A}/ellipse29.svg`} className="absolute inset-0 block size-full" />
        <img alt="" src={`${A}/polygon2.svg`} className="relative ml-[6px] block h-[19.82px] w-[21.81px] rotate-90" />
      </span>
    </div>
  );
}

/** Figma vector wrapper: the svg box overshoots its frame by the stroke (inset), the img fills it. */
function Fill({ src, inset }: { src: string; inset: string }) {
  return (
    <div className={`absolute ${inset}`}>
      <img alt="" src={`${A}/${src}`} className="block size-full max-w-none" />
    </div>
  );
}

function NeighborCard({ href, label, title, end }: { href: string; label: string; title: string; end?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-col gap-[var(--space-4)] rounded-[var(--radius-md)] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-20)] py-[var(--space-16)] hover:bg-[var(--neutral-50)] ${end ? "items-end text-right" : ""}`}
    >
      <span className="text-[12px] text-[var(--text-tertiary)]">{label}</span>
      <span className="max-w-full truncate text-[18px] font-medium text-[var(--text-primary)]">{title}</span>
    </Link>
  );
}
