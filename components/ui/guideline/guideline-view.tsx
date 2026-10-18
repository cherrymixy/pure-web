import { notFound } from "next/navigation";
import { GUIDELINE } from "@/data/guideline";
import { entryDoc, sectionDoc } from "@/lib/ui/guideline-doc";
import { ComponentDocPage } from "./component-doc";
import { DownloadTokens } from "./download-tokens";

/** Same content for /guideline (GNB) and /lab/guideline (sidebar): [] → overview, [section], [section, slug]. Every page uses the doc template. */
export function GuidelineView({ base, slug = [] }: { base: string; slug?: string[] }) {
  const [sectionId = GUIDELINE[0].id, entrySlug, ...rest] = slug;
  const section = GUIDELINE.find((s) => s.id === sectionId);
  const entry = entrySlug ? section?.entries.find((e) => e.slug === entrySlug) : undefined;
  if (!section || rest.length || (entrySlug && !entry)) notFound();

  const isPublic = base === "/guideline";
  if (entry)
    return <ComponentDocPage title={entry.title} proposed={entry.proposed} doc={entryDoc(section, entry)} base={base} current={`${base}/${section.id}/${entry.slug}`} isPublic={isPublic} />;
  const download = section.id === "overview" || section.id === "primitive-tokens";
  return (
    <ComponentDocPage title={section.title} doc={sectionDoc(section)} base={base} current={`${base}/${section.id}`} isPublic={isPublic} actions={download ? <DownloadTokens /> : undefined} />
  );
}
