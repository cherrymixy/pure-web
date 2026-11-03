import type { ExtractionClient, ExtractionOutput } from "../llm/extraction";
import { resolveUpload } from "../paths";
import type { SignatureDraft } from "../repo";
import { axesFromTone } from "./axes";
import { assertReadable, classifyUrl, extractFromPdf, extractFromUrl, type Extracted, type SourceInput } from "./extract";
import { SignatureError } from "./errors";

export const SIGNATURE_STEPS = ["Reading", "Colors", "Type", "Tone", "Signature"] as const;

export async function extractSource(source: SourceInput): Promise<Extracted> {
  if (source.kind === "url") {
    if (classifyUrl(source.url) === "figma") {
      throw new SignatureError("FIGMA_UNSUPPORTED", "Figma links aren't supported yet. Export the guide as a PDF.");
    }
    return extractFromUrl(source.url);
  }
  const abs = resolveUpload(source.path);
  if (!abs) throw new SignatureError("UNREADABLE", "Invalid file path");
  return extractFromPdf(abs, source.name);
}

export async function toneFromSources(x: Extracted, client: ExtractionClient, opts: { signal?: AbortSignal; temperature?: number } = {}) {
  return client.extract({ pages: x.pages, fonts: x.fonts, colors: x.colors }, opts);
}

/** Extraction + tone → a signature draft ready for repo.signatures.addVersion. */
export function buildDraft(x: Extracted, tone: ExtractionOutput, opts: { source: SourceInput; demo?: boolean }): SignatureDraft {
  // Demo tone quotes another brand guide, and model page numbers can point past the end: only cite real pages of this PDF.
  const cite = (page?: number) => (x.kind === "pdf" && !opts.demo && page && page >= 1 && page <= x.pageCount ? page : undefined);
  const evidence = tone.tone.map((t) => ({ keyword: t.keyword, page: cite(t.page), quote: t.quote }));
  const { axes, mapping } = axesFromTone(evidence);
  const sourceEntry =
    opts.source.kind === "pdf"
      ? { kind: "pdf" as const, name: opts.source.name, path: opts.source.path }
      : { kind: "url" as const, name: x.name, url: opts.source.url };
  return {
    name: x.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim() || "Brand signature",
    axes,
    tone: tone.tone.map((t) => t.keyword),
    mapping,
    sources: [sourceEntry],
    note: [
      x.fonts.length ? `Type: ${x.fonts.slice(0, 2).join(", ")}` : "",
      x.colors.length ? `Colors: ${x.colors.join(" ")}` : "",
      opts.demo ? "Tone from demo fallback" : "",
    ].filter(Boolean).join(" · "),
  };
}

export { assertReadable };
