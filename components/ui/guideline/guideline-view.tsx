import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDELINE } from "@/data/guideline";
import type { GuidelineBlock, GuidelineEntry, GuidelineSection } from "@/data/guideline/types";
import { STRINGS, fmt } from "@/data/strings";
import { chipClass } from "../chip";
import { Icon } from "../icons/icon";
import { ComponentDocPage } from "./component-doc";
import { DownloadTokens } from "./download-tokens";

const G = STRINGS.guideline;

/** Same content for /guideline (GNB) and /lab/guideline (sidebar): [] → overview, [section], [section, slug]. */
export function GuidelineView({ base, slug = [] }: { base: string; slug?: string[] }) {
  const [sectionId = GUIDELINE[0].id, entrySlug, ...rest] = slug;
  const section = GUIDELINE.find((s) => s.id === sectionId);
  const entry = entrySlug ? section?.entries.find((e) => e.slug === entrySlug) : undefined;
  if (!section || rest.length || (entrySlug && !entry)) notFound();

  const flat = GUIDELINE.flatMap((s) => s.entries.map((e) => ({ s, e })));
  const at = entry ? flat.findIndex((x) => x.e === entry && x.s === section) : -1;
  const href = (s: GuidelineSection, e?: GuidelineEntry) => `${base}/${s.id}${e ? `/${e.slug}` : ""}`;
  const slugIndex = new Map(flat.map((x) => [x.e.slug, x]));

  // No Figma frame: landing/editor web scale — white radius-xl cards (contents nav, article) on the page background,
  // eyebrow 16 medium sage/500, H1 48 semibold sage/800, summary 22 sage/500, body 18 text/link.
  const isPublic = base === "/guideline";
  if (entry?.doc)
    return <ComponentDocPage section={section} entry={entry} doc={entry.doc} href={href} prev={flat[at - 1]} next={flat[at + 1]} isPublic={isPublic} />;
  return (
    <div className={`grid grid-cols-[300px_minmax(0,1fr)] items-start gap-[var(--space-24)] pb-[var(--space-32)] pr-[var(--space-32)] ${isPublic ? "pl-[var(--space-32)] pt-[var(--space-32)]" : "pl-[33px] pt-[var(--space-32)]"}`}>
      <nav
        className={`sticky flex flex-col gap-[var(--space-16)] overflow-y-auto rounded-[var(--radius-xl)] bg-[var(--bg-surface)] p-[var(--space-20)] ${isPublic ? "top-[136px] max-h-[calc(var(--app-vh)-168px)]" : "top-[var(--space-32)] max-h-[calc(var(--app-vh)-64px)]"}`}
        aria-label={G.contents}
      >
        <span className="px-[var(--space-12)] text-[13px] leading-[18px] text-[var(--text-secondary)]">{G.contents}</span>
        <div className="flex flex-col gap-[var(--space-4)]">
          {GUIDELINE.map((s) => {
            const open = s === section;
            return (
              <div key={s.id} className="flex flex-col gap-[2px]">
                <Link
                  href={href(s)}
                  aria-current={open && !entry ? "page" : undefined}
                  className={`rounded-[var(--radius-xs)] px-[var(--space-12)] py-[10px] text-[18px] leading-[24px] text-[var(--text-link)] ${open && !entry ? "bg-[var(--sage-50)] font-semibold" : open ? "font-semibold" : "hover:bg-[var(--neutral-50)]"}`}
                >
                  {s.title}
                </Link>
                {open &&
                  s.entries.map((e) => (
                    <Link
                      key={e.slug}
                      href={href(s, e)}
                      aria-current={e === entry ? "page" : undefined}
                      className={`flex items-center gap-[var(--space-8)] rounded-[var(--radius-xs)] py-[var(--space-8)] pl-[var(--space-24)] pr-[var(--space-12)] text-[15px] leading-[22px] ${
                        e === entry ? "bg-[var(--sage-50)] font-medium text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--neutral-50)] hover:text-[var(--text-link)]"
                      }`}
                    >
                      <span className="truncate">{e.title}</span>
                      {e.placeholder && <span aria-label={G.placeholder} className="size-[6px] shrink-0 rounded-[var(--radius-full)] bg-[var(--neutral-400)]" />}
                    </Link>
                  ))}
              </div>
            );
          })}
        </div>
      </nav>

      <article className="flex min-w-0 flex-col gap-[var(--space-32)] rounded-[var(--radius-xl)] bg-[var(--bg-surface)] px-[var(--space-48)] py-[var(--space-48)]">
        {!entry ? (
          <>
            <header className="flex items-start justify-between gap-[var(--space-24)]">
              <div className="flex flex-col gap-[var(--space-16)]">
                <span className="text-[16px] font-medium leading-[1.26] text-[var(--sage-500)]">{G.title}</span>
                <h1 className="text-[48px] font-semibold leading-[1.26] text-[var(--sage-800)]">{section.title}</h1>
                <p className="max-w-[760px] text-[22px] leading-[1.4] text-[var(--sage-500)]">{section.summary}</p>
              </div>
              {(section.id === "overview" || section.id === "primitive-tokens") && <DownloadTokens />}
            </header>
            <span className="text-[13px] leading-[18px] text-[var(--text-secondary)]">{fmt(G.entries, { n: section.entries.length })}</span>
            <div className="grid grid-cols-2 gap-[var(--space-16)]">
              {section.entries.map((e) => (
                <Link
                  key={e.slug}
                  href={href(section, e)}
                  className={`flex flex-col gap-[var(--space-8)] rounded-[var(--radius-lg)] p-[var(--space-24)] hover:bg-[var(--neutral-150)] ${e.placeholder ? "border border-dashed border-[var(--neutral-400)] bg-[var(--bg-surface)]" : "bg-[var(--bg-canvas)]"}`}
                >
                  <span className="text-[20px] font-semibold leading-[26px] text-[var(--sage-800)]">{e.title}</span>
                  <span className="text-[16px] leading-[22px] text-[var(--text-link)]">{e.summary}</span>
                  {e.placeholder && <span className="text-[13px] leading-[18px] text-[var(--text-secondary)]">{G.placeholder}</span>}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <header className="flex flex-col gap-[var(--space-16)]">
              <Link href={href(section)} className="w-fit text-[16px] font-medium leading-[1.26] text-[var(--sage-500)] hover:text-[var(--sage-700)]">{section.title}</Link>
              <h1 className="text-[48px] font-semibold leading-[1.26] text-[var(--sage-800)]">{entry.title}</h1>
              <p className="max-w-[760px] text-[22px] leading-[1.4] text-[var(--sage-500)]">{entry.summary}</p>
              {entry.placeholder && (
                <p data-testid="placeholder" className="flex items-center gap-[var(--space-12)] rounded-[var(--radius-md)] border border-dashed border-[var(--neutral-400)] bg-[var(--bg-surface-muted)] px-[var(--space-20)] py-[var(--space-16)] text-[16px] leading-[22px] text-[var(--text-link)]">
                  <Icon name="info" size={20} className="shrink-0 text-[var(--icon-secondary)]" />
                  {G.placeholder}
                </p>
              )}
              {entry.simBehavior && (
                <span className="flex w-fit items-center gap-[var(--space-8)] rounded-[var(--radius-full)] bg-[var(--sage-50)] px-[var(--space-16)] py-[var(--space-8)] text-[14px] leading-[18px] text-[var(--sage-700)]">
                  <Icon name="running-round" size={18} />
                  {fmt(G.demonstratedBy, { behavior: entry.simBehavior })}
                </span>
              )}
            </header>
            <div className="flex flex-col gap-[var(--space-24)]">
              {entry.body.map((b, i) => <Block key={i} block={b} />)}
            </div>
            {(entry.dos?.length || entry.donts?.length) && (
              <div className="grid grid-cols-2 gap-[var(--space-16)]">
                <DoList title={G.do} items={entry.dos ?? []} good />
                <DoList title={G.dont} items={entry.donts ?? []} good={false} />
              </div>
            )}
            {entry.related?.length ? (
              <div className="flex flex-wrap items-center gap-[var(--space-8)]">
                <span className="mr-[var(--space-8)] text-[13px] leading-[18px] text-[var(--text-secondary)]">{G.related}</span>
                {entry.related.map((r) => {
                  const hit = slugIndex.get(r);
                  return hit ? (
                    <Link key={r} href={href(hit.s, hit.e)} className={chipClass({ size: "S" }) + " border border-[var(--border-default)]"}>
                      {hit.e.title}
                    </Link>
                  ) : null;
                })}
              </div>
            ) : null}
            <footer className="grid grid-cols-2 gap-[var(--space-16)] border-t border-[var(--border-default)] pt-[var(--space-32)]">
              {at > 0 ? <PageLink href={href(flat[at - 1].s, flat[at - 1].e)} label={G.prev} title={flat[at - 1].e.title} dir="prev" /> : <span />}
              {at >= 0 && at < flat.length - 1 ? <PageLink href={href(flat[at + 1].s, flat[at + 1].e)} label={G.next} title={flat[at + 1].e.title} dir="next" /> : <span />}
            </footer>
          </>
        )}
      </article>
    </div>
  );
}

function PageLink({ href, label, title, dir }: { href: string; label: string; title: string; dir: "prev" | "next" }) {
  const next = dir === "next";
  return (
    <Link
      href={href}
      className={`flex items-center gap-[var(--space-16)] rounded-[var(--radius-lg)] bg-[var(--bg-canvas)] px-[var(--space-24)] py-[var(--space-20)] hover:bg-[var(--neutral-150)] ${next ? "flex-row-reverse text-right" : ""}`}
    >
      <Icon name="chevron-right-small" size={24} className={`shrink-0 text-[var(--icon-secondary)] ${next ? "" : "rotate-180"}`} />
      <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-4)]">
        <span className="text-[13px] leading-[18px] text-[var(--text-secondary)]">{label}</span>
        <span className="truncate text-[18px] font-medium leading-[24px] text-[var(--text-primary)]">{title}</span>
      </span>
    </Link>
  );
}

function Block({ block }: { block: GuidelineBlock }) {
  switch (block.kind) {
    case "p":
      return <p className="max-w-[860px] text-[18px] leading-[1.6] text-[var(--text-link)]">{block.text}</p>;
    case "list":
      return (
        <ul className="flex max-w-[860px] list-disc flex-col gap-[var(--space-8)] pl-[var(--space-24)] text-[18px] leading-[1.6] text-[var(--text-link)] marker:text-[var(--sage-400)]">
          {block.items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      );
    case "code":
      return <pre className="overflow-x-auto rounded-[var(--radius-md)] bg-[var(--bg-inverse)] px-[var(--space-24)] py-[var(--space-20)] font-mono text-[15px] leading-[1.6] text-[var(--neutral-100)]">{block.text}</pre>;
    case "table":
      return (
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)]">
          <table className="w-full">
            <thead className="bg-[var(--bg-canvas)] text-left">
              <tr>{block.head.map((h) => <th key={h} className="px-[var(--space-20)] py-[var(--space-12)] text-[13px] font-medium leading-[18px] text-[var(--text-secondary)]">{h}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i} className="border-t border-[var(--border-default)]">
                  {r.map((c, j) => (
                    <td key={j} className={`px-[var(--space-20)] py-[var(--space-12)] align-top ${j === 0 ? "font-mono text-[14px] leading-[22px] text-[var(--text-primary)]" : "text-[16px] leading-[22px] text-[var(--text-link)]"}`}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

function DoList({ title, items, good }: { title: string; items: string[]; good: boolean }) {
  return (
    <div className="relative flex flex-col gap-[var(--space-12)] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--bg-canvas)] p-[var(--space-24)] pt-[28px]">
      <span aria-hidden className={`absolute inset-x-0 top-0 h-[4px] ${good ? "bg-[var(--status-success)]" : "bg-[var(--status-error)]"}`} />
      <b className={`flex items-center gap-[var(--space-8)] text-[18px] font-semibold leading-[24px] ${good ? "text-[var(--status-success)]" : "text-[var(--text-error)]"}`}>
        <Icon name={good ? "check" : "close"} size={20} />
        {title}
      </b>
      <ul className="flex list-disc flex-col gap-[var(--space-8)] pl-[var(--space-20)] text-[16px] leading-[1.5] text-[var(--text-link)]">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
