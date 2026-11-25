import { notFound } from "next/navigation";
import { GUIDELINE } from "@/data/guideline";
import { entryDoc, sectionDoc } from "@/lib/ui/guideline-doc";
import { ComponentDocPage } from "./component-doc";
import { DownloadTokens } from "./download-tokens";
import { GuidelineIndexPage } from "./guideline-index";

/** /lab/guideline (sidebar; the guideline is lab-only): [] → overview, [section], [section, slug]. Every page uses the doc template. */
export function GuidelineView({ base, slug = [] }: { base: string; slug?: string[] }) {
  const [sectionId = GUIDELINE[0].id, entrySlug, ...rest] = slug;
  const section = GUIDELINE.find((s) => s.id === sectionId);
  const entry = entrySlug ? section?.entries.find((e) => e.slug === entrySlug) : undefined;
  if (!section || rest.length || (entrySlug && !entry)) notFound();

  if (entry)
    return <ComponentDocPage title={entry.title} proposed={entry.proposed} doc={entryDoc(section, entry)} base={base} behavior={section.id === "behavior" ? entry.slug : undefined} />;
  const download = section.id === "overview" || section.id === "primitive-tokens";
  // Section pages (Overview, Principles, …) are on the Lab home v2 style; entry pages still use the doc template.
  if (base === "/lab/guideline") return <GuidelineIndexPage title={section.title} doc={sectionDoc(section)} base={base} download={download} />;
  return (
    <ComponentDocPage title={section.title} doc={sectionDoc(section)} base={base} actions={download ? <DownloadTokens /> : undefined} />
  );
}
