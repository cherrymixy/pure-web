import { notFound } from "next/navigation";
import { GUIDELINE } from "@/data/guideline";
import { STRINGS } from "@/data/strings";
import { entryDoc, sectionDoc } from "@/lib/ui/guideline-doc";
import { ComponentDocPage } from "./component-doc";
import { DownloadTokens } from "./download-tokens";
import { FormFactorBody } from "./form-factor-body";
import { PatternScene } from "./pattern-scene";
import { PresetCards, RangeLab, RhoLab, SignatureLab } from "./style-lab";
import { GuidelineIndexPage } from "./guideline-index";

/** Form-factor slugs drawn by FormFactorBody (a client module, so the list lives here for the server) */
const FORM_FACTORS = ["full-body", "joint-walking", "joint-driving", "jointless-driving", "joint-fixed"];

/** /lab/guideline (sidebar; the guideline is lab-only): [] → overview, [section], [section, slug]. Every page uses the doc template. */
export function GuidelineView({ base, slug = [] }: { base: string; slug?: string[] }) {
  const [sectionId = GUIDELINE[0].id, entrySlug, ...rest] = slug;
  const section = GUIDELINE.find((s) => s.id === sectionId);
  const entry = entrySlug ? section?.entries.find((e) => e.slug === entrySlug) : undefined;
  if (!section || rest.length || (entrySlug && !entry)) notFound();

  // Patterns: the Component steps the Scene player acts out, titled from the Components section
  const cmp = GUIDELINE.find((x) => x.id === "behavior");
  const steps = entry?.scene?.flatMap((slug) => {
    const c = cmp?.entries.find((e) => e.slug === slug);
    return c ? [{ slug, title: c.title }] : [];
  });
  // Templates: form-factor pages (and the robot instances built on one) show the body with its roles
  const ffSlug = section.id === "templates" ? ({ "pure-pet": "joint-walking", "pure-desk": "joint-fixed" } as Record<string, string>)[entry?.slug ?? ""] ?? entry?.slug : undefined;
  const ff = ffSlug && FORM_FACTORS.includes(ffSlug) ? section.entries.find((e) => e.slug === ffSlug) : undefined;
  const rolesTable = ff?.body.find((b) => b.kind === "table" && b.view === "roles");
  const rows = rolesTable?.kind === "table" ? Object.fromEntries(rolesTable.rows) : undefined;
  const body = ffSlug && rows
    ? { slug: ffSlug, roles: { attend: rows["role.attend"], posture: rows["role.posture"], locomote: rows["role.locomote"], gesture: rows["role.gesture"] }, substitute: rows.substitute }
    : undefined;
  const P = STRINGS.guideline;
  const STYLE_LABS: Record<string, React.ReactNode> = { signature: <SignatureLab />, presets: <PresetCards />, rho: <RhoLab />, rules: <RangeLab /> };
  const STYLE_TEXT: Record<string, string> = { signature: P.lab.signature, presets: P.lab.presets, rho: P.lab.rho, rules: P.lab.rules };
  const feature = steps?.length
    ? { id: "scene", title: P.player.scene, text: P.player.sceneText, node: <PatternScene trigger={entry!.summary} steps={steps} /> }
    : body
      ? { id: "body", title: P.body.title, text: P.body.text, node: <FormFactorBody slug={body.slug} roles={body.roles} substitute={body.substitute} /> }
      : section.id === "style" && entry && STYLE_LABS[entry.slug]
        ? { id: "try", title: P.lab.title, text: STYLE_TEXT[entry.slug], node: STYLE_LABS[entry.slug] }
        : undefined;
  if (entry)
    return <ComponentDocPage title={entry.title} proposed={entry.proposed} doc={entryDoc(section, entry)} base={base} behavior={section.id === "behavior" ? entry.slug : undefined} feature={feature} />;
  const download = section.id === "overview" || section.id === "primitive-tokens";
  // Section pages (Overview, Principles, …) are on the Lab home v2 style; entry pages still use the doc template.
  if (base === "/lab/guideline") return <GuidelineIndexPage title={section.title} doc={sectionDoc(section)} base={base} download={download} />;
  return (
    <ComponentDocPage title={section.title} doc={sectionDoc(section)} base={base} actions={download ? <DownloadTokens /> : undefined} />
  );
}
