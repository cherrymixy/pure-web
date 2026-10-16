import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDELINE } from "@/data/guideline";
import type { GuidelineBlock, GuidelineEntry, GuidelineSection } from "@/data/guideline/types";
import { STRINGS, fmt } from "@/data/strings";
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

  return (
    <div className="grid min-h-full grid-cols-[260px_1fr] gap-10 p-10">
      <nav className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col gap-3 self-start overflow-y-auto text-sm" aria-label={G.contents}>
        <span className="text-xs text-neutral-500">{G.contents}</span>
        {GUIDELINE.map((s) => (
          <div key={s.id} className="flex flex-col gap-1">
            <Link href={href(s)} className={`font-semibold ${s === section && !entry ? "underline" : ""}`}>{s.title}</Link>
            {s === section &&
              s.entries.map((e) => (
                <Link key={e.slug} href={href(s, e)} className={`pl-3 ${e === entry ? "font-semibold" : "text-neutral-600"} ${e.placeholder ? "italic" : ""}`}>
                  {e.title}{e.placeholder ? " ·" : ""}
                </Link>
              ))}
          </div>
        ))}
      </nav>

      <article className="flex max-w-3xl flex-col gap-6">
        {!entry ? (
          <>
            <header className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-neutral-500">{G.title}</span>
                <h1 className="text-3xl font-semibold">{section.title}</h1>
                <p className="text-neutral-600">{section.summary}</p>
              </div>
              {(section.id === "overview" || section.id === "primitive-tokens") && <DownloadTokens />}
            </header>
            <span className="text-xs text-neutral-500">{fmt(G.entries, { n: section.entries.length })}</span>
            <div className="grid grid-cols-2 gap-3">
              {section.entries.map((e) => (
                <Link key={e.slug} href={href(section, e)} className={`flex flex-col gap-1 rounded border p-4 hover:border-neutral-500 ${e.placeholder ? "border-dashed border-amber-400" : "border-neutral-200"}`}>
                  <span className="font-semibold">{e.title}</span>
                  <span className="text-sm text-neutral-600">{e.summary}</span>
                  {e.placeholder && <span className="text-xs text-amber-700">{G.placeholder}</span>}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <header className="flex flex-col gap-2">
              <Link href={href(section)} className="text-xs text-neutral-500">{section.title}</Link>
              <h1 className="text-3xl font-semibold">{entry.title}</h1>
              <p className="text-neutral-600">{entry.summary}</p>
              {entry.placeholder && <p data-testid="placeholder" className="rounded border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-800">{G.placeholder}</p>}
              {entry.simBehavior && <span className="text-xs text-neutral-500">{fmt(G.demonstratedBy, { behavior: entry.simBehavior })}</span>}
            </header>
            {entry.body.map((b, i) => <Block key={i} block={b} />)}
            {(entry.dos?.length || entry.donts?.length) && (
              <div className="grid grid-cols-2 gap-4">
                <DoList title={G.do} items={entry.dos ?? []} tone="border-green-600" />
                <DoList title={G.dont} items={entry.donts ?? []} tone="border-red-600" />
              </div>
            )}
            {entry.related?.length ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-neutral-500">{G.related}</span>
                {entry.related.map((r) => {
                  const hit = slugIndex.get(r);
                  return hit ? <Link key={r} href={href(hit.s, hit.e)} className="rounded-full border border-neutral-300 px-2.5 py-0.5">{hit.e.title}</Link> : null;
                })}
              </div>
            ) : null}
            <footer className="flex justify-between border-t border-neutral-200 pt-4 text-sm">
              {at > 0 ? <Link href={href(flat[at - 1].s, flat[at - 1].e)}>← {flat[at - 1].e.title}</Link> : <span />}
              {at >= 0 && at < flat.length - 1 ? <Link href={href(flat[at + 1].s, flat[at + 1].e)}>{flat[at + 1].e.title} →</Link> : <span />}
            </footer>
          </>
        )}
      </article>
    </div>
  );
}

function Block({ block }: { block: GuidelineBlock }) {
  switch (block.kind) {
    case "p":
      return <p className="leading-relaxed">{block.text}</p>;
    case "list":
      return <ul className="list-disc pl-6">{block.items.map((it, i) => <li key={i}>{it}</li>)}</ul>;
    case "code":
      return <pre className="overflow-x-auto rounded bg-neutral-100 p-3 font-mono text-sm">{block.text}</pre>;
    case "table":
      return (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-neutral-500">
            <tr>{block.head.map((h) => <th key={h} className="border-b border-neutral-200 py-1 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {block.rows.map((r, i) => (
              <tr key={i} className="border-b border-neutral-100">{r.map((c, j) => <td key={j} className={`py-1 pr-3 ${j === 0 ? "font-mono" : ""}`}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      );
  }
}

function DoList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div className={`flex flex-col gap-1.5 border-t-2 pt-2 ${tone}`}>
      <b className="text-sm">{title}</b>
      <ul className="list-disc pl-5 text-sm">{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
    </div>
  );
}
