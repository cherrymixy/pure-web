import Link from "next/link";
import { GUIDELINE } from "@/data/guideline";
import type { ComponentDoc, ComponentDocBlock, GuidelineEntry, GuidelineSection } from "@/data/guideline/types";
import { STRINGS } from "@/data/strings";
import { DocToc, type TocItem } from "./doc-toc";

const G = STRINGS.guideline;

// Component-page template — Figma W03-4 "component / Approach" (550:2490), 960 frame ×2 (decisions: STEP 22).
// Side nav (550:2533) · Content card (550:2588) = Main (550:2589) + On this page (550:2884). Top bar is the GNB/lab sidebar.

type Href = (s: GuidelineSection, e?: GuidelineEntry) => string;
type Neighbor = { s: GuidelineSection; e: GuidelineEntry } | undefined;

export function ComponentDocPage({
  section,
  entry,
  doc,
  href,
  prev,
  next,
  isPublic,
}: {
  section: GuidelineSection;
  entry: GuidelineEntry;
  doc: ComponentDoc;
  href: Href;
  prev: Neighbor;
  next: Neighbor;
  isPublic: boolean;
}) {
  const slugHref = (slug: string) => {
    for (const s of GUIDELINE) for (const e of s.entries) if (e.slug === slug) return href(s, e);
    return undefined;
  };
  const toc: TocItem[] = doc.sections.flatMap((s) => [
    { id: s.id, label: s.title, level: 0 as const },
    ...s.blocks.flatMap((b) => (b.kind === "subhead" ? [{ id: b.id, label: b.toc ?? b.title, level: 1 as const }] : [])),
  ]);
  const stickyTop = isPublic ? "top-[136px]" : "top-[var(--space-32)]";
  // Anchor offset: below the public GNB, or the lab page's top padding.
  const scrollMt = isPublic ? "scroll-mt-[136px]" : "scroll-mt-[var(--space-32)]";

  return (
    <div className={`flex items-start gap-[var(--space-20)] pb-[var(--space-32)] pr-[var(--space-32)] pt-[var(--space-32)] ${isPublic ? "pl-[var(--space-32)]" : "pl-[33px]"}`}>
      {/* Side nav 550:2533 — same IA as the other guideline pages (sections → entries of the open section). */}
      <nav
        aria-label={G.contents}
        className={`sticky flex w-[300px] shrink-0 flex-col gap-[var(--space-8)] overflow-y-auto rounded-[var(--radius-xl)] bg-[var(--bg-surface)] px-[var(--space-24)] py-[var(--space-28)] leading-normal ${stickyTop} ${isPublic ? "max-h-[calc(var(--app-vh)-168px)]" : "max-h-[calc(var(--app-vh)-64px)]"}`}
      >
        {GUIDELINE.map((s) => (
          <div key={s.id} className="contents">
            <Link
              href={href(s)}
              aria-current={s === section && !entry ? "page" : undefined}
              className="rounded-[var(--radius-sm)] px-[var(--space-12)] py-[var(--space-8)] text-[16px] font-medium text-[var(--text-primary)] hover:bg-[var(--neutral-50)]"
            >
              {s.title}
            </Link>
            {s === section &&
              s.entries.map((e) => (
                <Link
                  key={e.slug}
                  href={href(s, e)}
                  aria-current={e === entry ? "page" : undefined}
                  className={`truncate rounded-[var(--radius-sm)] py-[var(--space-8)] pl-[var(--space-24)] pr-[var(--space-12)] text-[14px] ${
                    e === entry ? "bg-[var(--sage-100)] text-[var(--text-primary)]" : "text-[var(--neutral-500)] hover:bg-[var(--neutral-50)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {e.title}
                </Link>
              ))}
          </div>
        ))}
      </nav>

      {/* Content 550:2588 */}
      <div className="flex min-w-0 flex-1 items-start gap-[66px] rounded-[var(--radius-xl)] bg-[var(--bg-surface)] pb-[106px] pl-[58px] pr-[96px] pt-[50px] leading-normal">
        <article className="flex min-w-0 flex-1 flex-col gap-[60px]">
          <header className="flex flex-col gap-[var(--space-16)]">
            <span className="whitespace-pre text-[14px] font-semibold text-[var(--text-tertiary)]">{doc.breadcrumb.join("  /  ")}</span>
            <h1 className="text-[56px] font-medium text-[var(--text-primary)]">{entry.title}</h1>
            <p className="text-[18px] text-[var(--text-secondary)]">{doc.lead}</p>
            <div className="flex flex-wrap gap-[var(--space-12)]">
              {doc.resources.map((r) => (r.href ? <Link key={r.label} href={r.href} className={PILL}>{r.label}</Link> : <span key={r.label} className={PILL}>{r.label}</span>))}
            </div>
            <div className="flex flex-wrap gap-[var(--space-8)]">
              {doc.tags.map((t) => <span key={t} className={TAG}>{t}</span>)}
            </div>
          </header>

          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className={`flex flex-col gap-[var(--space-8)] ${scrollMt}`}>
              <h2 id={`${s.id}-h`} className="text-[26px] font-medium text-[var(--text-primary)]">{s.title}</h2>
              {s.text && <p className="text-[16px] text-[var(--text-secondary)]">{s.text}</p>}
              {s.blocks.map((b, i) => <DocBlock key={i} block={b} slugHref={slugHref} scrollMt={scrollMt} />)}
            </section>
          ))}

          {/* Prev / Next 550:2877 */}
          <footer className="grid grid-cols-2 gap-[var(--space-16)]">
            {prev ? <NeighborCard href={href(prev.s, prev.e)} label={G.prev} title={prev.e.title} /> : <span />}
            {next ? <NeighborCard href={href(next.s, next.e)} label={G.next} title={next.e.title} end /> : <span />}
          </footer>
        </article>

        <aside className={`sticky mt-[10px] w-[218px] shrink-0 ${stickyTop}`}>
          <DocToc title={G.onThisPage} items={toc} />
        </aside>
      </div>
    </div>
  );
}

const PILL = "rounded-[var(--radius-full)] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-12)] py-[var(--space-8)] text-[14px] font-medium text-[var(--text-primary)]";
const TAG = "rounded-[var(--radius-xs)] bg-[var(--bg-canvas)] px-[var(--space-12)] py-[var(--space-8)] text-[14px] text-[var(--text-link)]";
const CARD = "flex min-w-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-md)] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)]";

function Preview({ label, height }: { label: string; height: number }) {
  return (
    <div style={{ height }} className="flex w-full items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-canvas)] text-[14px] text-[var(--text-tertiary)]">
      {label}
    </div>
  );
}

function DocBlock({ block, slugHref, scrollMt }: { block: ComponentDocBlock; slugHref: (slug: string) => string | undefined; scrollMt: string }) {
  switch (block.kind) {
    case "anatomy":
      return (
        <>
          <AnatomyFigure labels={block.parts.map((p) => p.label)} />
          <ol className="flex flex-col gap-[var(--space-8)] text-[16px]">
            {block.parts.map((p, i) => (
              <li key={p.label} className="flex items-center gap-[var(--space-16)]">
                <Badge n={i + 1} size={24} />
                <span className="shrink-0 font-medium text-[var(--text-primary)]">{p.label}</span>
                <span className="min-w-0 flex-1 text-[var(--text-secondary)]">{p.detail}</span>
              </li>
            ))}
          </ol>
        </>
      );
    case "subhead":
      return (
        <div id={block.id} className={`flex flex-col gap-[var(--space-8)] ${scrollMt}`}>
          <h3 className="text-[20px] font-medium text-[var(--text-primary)]">{block.title}</h3>
          {block.text && <p className="text-[16px] text-[var(--text-secondary)]">{block.text}</p>}
        </div>
      );
    case "cards":
      return (
        <div className="flex gap-[var(--space-16)]">
          {block.cards.map((c) => (
            <div key={c.title} className={`${CARD} gap-[var(--space-12)] p-[var(--space-20)]`}>
              <Preview label={block.preview} height={block.previewHeight} />
              <span className="text-[18px] font-medium text-[var(--text-primary)]">{c.title}</span>
              {c.chips && <div className="flex flex-wrap gap-[var(--space-8)]">{c.chips.map((t) => <span key={t} className={TAG}>{t}</span>)}</div>}
              {c.caption && <span className="text-[14px] text-[var(--text-secondary)]">{c.caption}</span>}
            </div>
          ))}
        </div>
      );
    case "table": {
      const keys = block.keyCols ?? [0];
      const last = block.head.length - 1;
      const col = (j: number) => (block.widths[j] == null ? { className: "min-w-0 flex-1" } : { className: "shrink-0", style: { width: block.widths[j]! } });
      return (
        <div role="table" className="flex flex-col overflow-hidden rounded-[var(--radius-sm)] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] text-[14px]">
          <div role="row" className="flex items-center gap-[var(--space-16)] bg-[var(--bg-canvas)] px-[var(--space-16)] py-[var(--space-12)] font-medium text-[var(--text-secondary)]">
            {block.head.map((h, j) => <span role="columnheader" key={j} {...col(j)}>{h}</span>)}
          </div>
          {block.rows.map((r, i) => (
            <div role="row" key={i} className="flex items-center gap-[var(--space-16)] px-[var(--space-16)] py-[var(--space-12)]">
              {r.map((c, j) => (
                <span
                  role="cell"
                  key={j}
                  {...col(j)}
                  className={`${col(j).className} ${keys.includes(j) ? "font-medium text-[var(--text-primary)]" : j === last ? "font-medium text-[var(--text-link)]" : "text-[var(--text-link)]"}`}
                >
                  {c}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
    }
    case "states":
      return (
        <div className="flex flex-wrap gap-[var(--space-8)] text-[14px]">
          {block.items.map((s) => (
            <span key={s.state} className="flex gap-[var(--space-8)] rounded-[var(--radius-xs)] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-16)] py-[var(--space-8)]">
              <b className="font-medium text-[var(--text-primary)]">{s.state}</b>
              <span className="text-[var(--text-secondary)]">{s.effect}</span>
            </span>
          ))}
        </div>
      );
    case "doDont":
      return (
        <div className="flex gap-[var(--space-16)]">
          {([true, false] as const).map((good) => (
            <div key={String(good)} className={CARD}>
              <span aria-hidden className={`h-[6px] w-full shrink-0 ${good ? "bg-[var(--status-success)]" : "bg-[var(--status-error)]"}`} />
              <div className="flex flex-col gap-[var(--space-12)] p-[var(--space-20)]">
                <Preview label={block.preview} height={block.previewHeight} />
                <p className="flex gap-[var(--space-12)] text-[16px]">
                  <b className={`shrink-0 font-bold ${good ? "text-[var(--status-success)]" : "text-[var(--text-error)]"}`}>{good ? G.do : G.dont}</b>
                  <span className="min-w-0 flex-1 text-[var(--text-primary)]">{good ? block.do : block.dont}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    case "stat":
      return (
        <p className="flex items-center gap-[var(--space-20)] rounded-[var(--radius-sm)] bg-[var(--bg-error-subtle)] px-[var(--space-20)] py-[var(--space-16)]">
          <b className="shrink-0 text-[32px] font-semibold text-[var(--text-error)]">{block.value}</b>
          <span className="min-w-0 flex-1 text-[16px] text-[var(--text-primary)]">{block.text}</span>
        </p>
      );
    case "chips":
      return (
        <div className="flex flex-wrap gap-[var(--space-8)]">
          {block.items.map((c) => {
            const to = c.slug ? slugHref(c.slug) : undefined;
            return to ? (
              <Link key={c.label} href={to} className={`${PILL} hover:bg-[var(--neutral-50)]`}>{c.label}</Link>
            ) : (
              <span key={c.label} className={PILL}>{c.label}</span>
            );
          })}
        </div>
      );
  }
}

function NeighborCard({ href, label, title, end }: { href: string; label: string; title: string; end?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-col gap-[var(--space-4)] rounded-[var(--radius-md)] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-20)] py-[var(--space-16)] hover:bg-[var(--neutral-50)] ${end ? "items-end text-right" : ""}`}
    >
      <span className="text-[14px] text-[var(--text-tertiary)]">{label}</span>
      <span className="max-w-full truncate text-[18px] font-medium text-[var(--text-primary)]">{title}</span>
    </Link>
  );
}

function Badge({ n, size }: { n: number; size: number }) {
  return (
    <span style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--bg-inverse)] text-[14px] font-bold text-[var(--text-on-inverse)]">
      {n}
    </span>
  );
}

/** Anatomy (placeholder) 550:2613 — PURE robot drawn from rectangles + Figma callout lines, 1120×340 (560×170 ×2), centered. */
function AnatomyFigure({ labels }: { labels: string[] }) {
  const A = "/figma/guideline/approach";
  const label = "absolute whitespace-nowrap text-[14px] font-medium text-[var(--text-primary)]";
  const badge = (n: number, left: number, top: number) => (
    <span className="absolute" style={{ left, top }}><Badge n={n} size={28} /></span>
  );
  return (
    <div aria-hidden className="relative h-[340px] w-full overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-canvas)]">
      <div className="absolute left-1/2 top-0 h-full w-[1120px] -translate-x-1/2">
        <span className="absolute left-[490px] top-[164px] h-[128px] w-[140px] rounded-[var(--radius-xl)] bg-[var(--neutral-200)]" />
        <span className="absolute left-[464px] top-[52px] h-[116px] w-[192px] rounded-[var(--radius-2xl)] bg-[var(--neutral-200)]" />
        <span className="absolute left-[490px] top-[76px] h-[68px] w-[140px] rounded-[var(--radius-lg)] bg-[var(--bg-inverse)]" />
        <span className="absolute left-[524px] top-[96px] h-[28px] w-[20px] rounded-[var(--radius-xs)] bg-[var(--bg-surface)]" />
        <span className="absolute left-[572px] top-[96px] h-[28px] w-[20px] rounded-[var(--radius-xs)] bg-[var(--bg-surface)]" />
        {[542, 554, 566].map((x) => <img key={x} src={`${A}/dot.svg`} alt="" width={6} height={6} className="absolute top-[250px] block" style={{ left: x }} />)}
        <img src={`${A}/line-body.svg`} alt="" width={122.07} height={7.5} className="absolute left-[368px] top-[213.25px] block max-w-none" />
        <img src={`${A}/line-face.svg`} alt="" width={122} height={1.5} className="absolute left-[368px] top-[109.25px] block max-w-none" />
        <img src={`${A}/line-speaker.svg`} alt="" width={180.03} height={5.5} className="absolute left-[580px] top-[249.25px] block max-w-none" />
        {badge(1, 340, 200)}
        {badge(2, 340, 96)}
        {badge(3, 760, 236)}
        <span className={`${label} right-[792px] top-[204px]`}>{labels[0]}</span>
        <span className={`${label} right-[792px] top-[100px]`}>{labels[1]}</span>
        <span className={`${label} left-[800px] top-[240px]`}>{labels[2]}</span>
      </div>
    </div>
  );
}
