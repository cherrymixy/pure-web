import { GUIDELINE } from "@/data/guideline";
import type { ComponentDoc, ComponentDocSection, GuidelineBlock, GuidelineEntry, GuidelineSection } from "@/data/guideline/types";
import { STRINGS, fmt } from "@/data/strings";

// Every guideline page renders on the doc template of Face (Figma W03-2L 808:1649).
// Pages with their own Figma frame carry a hand-written doc; the rest are derived here from their body blocks.

const G = STRINGS.guideline;

const flat = () => GUIDELINE.flatMap((s) => s.entries.map((e) => ({ s, e })));
const path = (s: GuidelineSection, e?: GuidelineEntry) => `${s.id}${e ? `/${e.slug}` : ""}`;

/** Sibling pages in the right-hand list: the entry's group, or the whole section. */
function siblings(section: GuidelineSection, entry: GuidelineEntry): ComponentDoc["pages"] {
  return section.entries.filter((e) => !entry.group || e.group === entry.group).map((e) => ({ label: e.title, path: path(section, e), ...(e === entry ? { current: true as const } : {}) }));
}

function neighbors(section: GuidelineSection, entry: GuidelineEntry): Pick<ComponentDoc, "prev" | "next"> {
  const all = flat();
  const at = all.findIndex((x) => x.e === entry && x.s === section);
  const prev = all[at - 1];
  const next = all[at + 1];
  return {
    ...(prev ? { prev: { title: prev.e.title, path: path(prev.s, prev.e) } } : {}),
    ...(next ? { next: { title: next.e.title, path: path(next.s, next.e) } } : {}),
  };
}

const anchor = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";

/** Titled blocks start sections; untitled blocks join the one above (leading paragraphs join the lead). */
export function blocksToSections(blocks: GuidelineBlock[], lead: string[]): ComponentDocSection[] {
  const out: (ComponentDocSection & { kind: "blocks" })[] = [];
  const used = new Set<string>();
  const open = (title: string) => {
    let id = anchor(title);
    for (let n = 2; used.has(id); n++) id = `${anchor(title)}-${n}`;
    used.add(id);
    const s = { id, title, kind: "blocks" as const, blocks: [] as GuidelineBlock[] };
    out.push(s);
    return s;
  };
  for (const b of blocks) {
    if (b.title) open(b.title).blocks.push(b);
    else if (out.length) out[out.length - 1].blocks.push(b);
    else if (b.kind === "p") lead.push(b.text);
    else open("Overview").blocks.push(b);
  }
  return out;
}

/** Doc for an entry: its own Figma doc (pages / neighbors filled in), or one derived from the body. */
export function entryDoc(section: GuidelineSection, entry: GuidelineEntry): ComponentDoc {
  const around = { pages: siblings(section, entry), ...neighbors(section, entry) };
  if (entry.doc) return { ...around, ...entry.doc, ref: entry.doc.ref ?? entry.ref };

  const lead = [entry.summary];
  if (entry.placeholder) lead.push(G.placeholder);
  const rows: ComponentDocSection[] = blocksToSections(entry.body, lead);
  if (entry.dos?.length) rows.push({ id: "do", title: G.do, kind: "blocks", blocks: [{ kind: "list", items: entry.dos }] });
  if (entry.donts?.length) rows.push({ id: "dont", title: G.dont, kind: "blocks", blocks: [{ kind: "list", items: entry.donts }] });
  const related = (entry.related ?? []).map((r) => resolve(r, section)).filter((x) => x !== undefined);
  if (related.length) rows.push({ id: "related", title: G.related, kind: "links", items: related });

  return {
    breadcrumb: section.title,
    ref: entry.ref,
    lead,
    resources: entry.simBehavior ? [{ label: fmt(G.demonstratedBy, { behavior: entry.simBehavior }) }] : undefined,
    rows,
    ...around,
  };
}

/** Section landing page: the summary, then one card per page. Siblings = the other sections. */
export function sectionDoc(section: GuidelineSection): ComponentDoc {
  const at = GUIDELINE.indexOf(section);
  const prev = GUIDELINE[at - 1];
  const next = GUIDELINE[at + 1];
  return {
    breadcrumb: G.title,
    lead: [section.summary],
    pages: GUIDELINE.map((s) => ({ label: s.title, path: s.id, ...(s === section ? { current: true as const } : {}) })),
    rows: [
      {
        id: "pages",
        title: fmt(G.entries, { n: section.entries.length }),
        toc: G.contents,
        kind: "cards",
        items: section.entries.map((e) => ({ title: e.title, summary: e.summary, path: path(section, e), ref: e.ref, proposed: !!e.proposed })),
      },
    ],
    ...(prev ? { prev: { title: prev.title, path: prev.id } } : {}),
    ...(next ? { next: { title: next.title, path: next.id } } : {}),
  };
}

/** related: "slug" (same section first, then any) or "section/slug" */
function resolve(ref: string, from: GuidelineSection): { title: string; path: string } | undefined {
  const [a, b] = ref.split("/");
  if (b) {
    const s = GUIDELINE.find((x) => x.id === a);
    const e = s?.entries.find((x) => x.slug === b);
    return s && e ? { title: e.title, path: path(s, e) } : undefined;
  }
  const own = from.entries.find((x) => x.slug === a);
  if (own) return { title: own.title, path: path(from, own) };
  const hit = flat().find((x) => x.e.slug === a);
  return hit ? { title: hit.e.title, path: path(hit.s, hit.e) } : undefined;
}
