/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { searchIndex } from "@/data/guideline";
import type { ComponentDoc } from "@/data/guideline/types";
import { STRINGS } from "@/data/strings";
import { DownloadTokens } from "./download-tokens";
import { GuideCard } from "./guide-card";
import { IndexNav } from "./index-nav";

const G = STRINGS.guideline;

// Guideline section page (Overview, Principles, …) in the Lab home v2 style (Figma 1095:6556): canvas + glow, runs at the
// fitted 1× frame zoom like Lab, glass controls, white hairline cards. Type scale shared with Lab:
// title 60 / section 22 / card title + lead 17 / controls 15 / body 14 / labels 12.
export function GuidelineIndexPage({ title, doc, base, download }: { title: string; doc: ComponentDoc; base: string; download?: boolean }) {
  const section = doc.rows.flatMap((r) => (Array.isArray(r) ? r : [r])).find((s) => s.kind === "cards");
  const items = section?.kind === "cards" ? section.items : [];
  return (
    <div data-fit-frame className="relative px-[var(--space-40)] py-[42px] leading-normal">
      <img src="/figma/lab/home/glow.svg" alt="" aria-hidden className="pointer-events-none absolute left-[26px] top-[-360px] h-[680px] w-[1360px] max-w-none" />

      {/* Header lives in the content column so the download button ends exactly where the card grid ends; the rail starts at the top. */}
      <div className="relative flex items-start gap-[var(--space-40)]">
        <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-40)]">
          <header id="top" className="flex flex-col gap-[var(--space-12)]">
            <div className="flex items-center gap-[var(--space-12)]">
              <h1 className="text-[60px] font-semibold text-[var(--home-ink)]">{title}</h1>
              <span className="flex-1" />
              {download && <DownloadTokens lab />}
            </div>
            <p className="max-w-[760px] text-[17px] text-[var(--home-ink-2)]">
              {doc.lead.map((l, i) => <span key={i} className="block">{l}</span>)}
            </p>
          </header>

          {section && (
            <section id={section.id} aria-label={section.title} className="flex flex-col">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-[var(--space-20)]">
                {items.map((it, i) => (
                  <GuideCard key={it.path} href={`${base}/${it.path}`} index={i} title={it.title} summary={it.summary} refId={it.ref} proposed={it.proposed} />
                ))}
              </div>
            </section>
          )}

          {(doc.prev || doc.next) && (
            <footer className="grid grid-cols-2 gap-[16.483px]">
              {doc.prev ? <Neighbor href={`${base}/${doc.prev.path}`} label={G.prevDoc} title={doc.prev.title} /> : <span />}
              {doc.next ? <Neighbor href={`${base}/${doc.next.path}`} label={G.nextDoc} title={doc.next.title} end /> : <span />}
            </footer>
          )}
        </div>

        <aside className="sticky top-[42px] w-[280px] shrink-0">
          <IndexNav index={searchIndex(base)} pages={(doc.pages ?? []).map((p) => ({ label: p.label, href: `${base}/${p.path}`, current: p.current }))} />
        </aside>
      </div>
    </div>
  );
}

function Neighbor({ href, label, title, end }: { href: string; label: string; title: string; end?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex min-w-0 flex-col gap-[var(--space-4)] rounded-[var(--radius-lg)] bg-[color-mix(in_srgb,var(--neutral-0)_50%,transparent)] px-[var(--space-20)] py-[var(--space-16)] transition-[transform,background-color] hover:bg-[var(--neutral-0)] duration-[var(--motion-slow)] hover:-translate-y-[2px] ${end ? "items-end text-right" : ""}`}
    >
      <span className="text-[12px] text-[var(--home-ink-3)]">{label}</span>
      <span className="max-w-full truncate text-[17px] font-semibold text-[var(--home-ink)]">{title}</span>
    </Link>
  );
}
