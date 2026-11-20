import Link from "next/link";
import { STRINGS } from "@/data/strings";
import { Icon } from "../icons/icon";

const G = STRINGS.guideline;

// Accent per card, cycled: the blurred glow behind the tile. Channel / brand colours already in tokens.
const ACCENTS = ["var(--sage-300)", "var(--web-75add7)", "var(--web-e2a1c1)", "var(--web-ecc377)"];

/** Guideline entry card (after the user's reference boards): soft glow header, title + summary,
 *  ref / proposed chips, dashed rule, footer "Read →". No border or shadow; hover lifts, deepens the glow, nudges the arrow. */
export function GuideCard({ href, index, title, summary, refId, proposed }: { href: string; index: number; title: string; summary: string; refId?: string; proposed?: boolean }) {
  const accent = ACCENTS[index % ACCENTS.length];
  const glow = (a: number) =>
    [
      `radial-gradient(70% 150% at 18% 15%, color-mix(in srgb, ${accent} ${a}%, transparent), transparent 70%)`,
      `radial-gradient(60% 140% at 88% 25%, color-mix(in srgb, var(--sage-200) ${Math.round(a * 0.7)}%, transparent), transparent 70%)`,
      `linear-gradient(180deg, color-mix(in srgb, ${accent} ${Math.round(a * 0.25)}%, transparent), transparent)`,
    ].join(", ");
  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--neutral-0)] transition-transform duration-[var(--motion-slow)] ease-[var(--ease-standard)] hover:-translate-y-[3px] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div aria-hidden className="relative h-[72px] shrink-0">
        <div className="absolute inset-0" style={{ backgroundImage: glow(60) }} />
        <div className="absolute inset-0 opacity-0 transition-opacity duration-[var(--motion-slow)] group-hover:opacity-100" style={{ backgroundImage: glow(95) }} />
      </div>

      <div className="flex flex-1 flex-col gap-[var(--space-8)] px-[var(--space-20)] pb-[var(--space-16)] pt-[var(--space-16)]">
        <span className="text-[17px] font-semibold text-[var(--home-ink)]">{title}</span>
        <span className="line-clamp-3 text-[14px] leading-[1.5] text-[var(--home-ink-2)]">{summary}</span>
        {(refId || proposed) && (
          <span className="mt-[var(--space-4)] flex flex-wrap gap-[6px]">
            {refId && <code className="rounded-[var(--radius-xs)] bg-[var(--home-pill)] px-[var(--space-8)] py-[3px] font-mono text-[12px] text-[var(--home-ink-2)]">{refId}</code>}
            {proposed && (
              <span className="rounded-[var(--radius-xs)] border border-dashed border-[var(--home-ink-3)] px-[var(--space-8)] py-[2px] text-[12px] font-medium text-[var(--home-ink-2)]">{G.proposed}</span>
            )}
          </span>
        )}
        <span className="flex-1" />
        <span className="mt-[var(--space-8)] flex items-center border-t border-dashed border-[var(--home-line)] pt-[var(--space-12)]">
          <span className="text-[13px] font-medium text-[var(--home-ink-2)]">{G.read}</span>
          <span className="flex-1" />
          <span className="flex size-[30px] items-center justify-center rounded-[var(--radius-full)] border border-[var(--home-line)] text-[var(--home-ink-2)] transition-[transform,background-color,color] duration-[var(--motion-slow)] group-hover:translate-x-[2px] group-hover:bg-[var(--home-ink)] group-hover:text-[var(--neutral-0)] motion-reduce:transition-none">
            <Icon name="arrow-right" size={16} />
          </span>
        </span>
      </div>
    </Link>
  );
}
