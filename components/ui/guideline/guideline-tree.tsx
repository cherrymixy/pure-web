import Link from "next/link";
import { GUIDELINE_NAV } from "@/data/guideline/nav";

/** Guideline tree (Figma W03-4L 808:1594 "Side nav"): groups, pages, a REJECTED divider. Items without a page are plain text. */
export function GuidelineTree({ base, current }: { base: string; current: string }) {
  return (
    <div className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] bg-[var(--bg-surface)] px-[var(--space-24)] py-[var(--space-28)] text-[14px] leading-normal">
      {GUIDELINE_NAV.map((it, i) => {
        const href = it.path ? `${base}/${it.path}` : undefined;
        const on = href === current;
        const cls =
          it.level === "tag"
            ? "px-[var(--space-12)] py-[var(--space-8)] text-[12px] font-medium text-[var(--text-tertiary)]"
            : `rounded-[var(--radius-sm)] py-[var(--space-8)] ${it.level === 0 ? "px-[var(--space-12)] font-medium" : "px-[var(--space-24)]"} ${
                on ? "bg-[var(--sage-100)] text-[var(--text-primary)]" : it.level === 0 ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
              }`;
        return href ? (
          <Link key={i} href={href} aria-current={on ? "page" : undefined} className={`${cls} ${on ? "" : "hover:bg-[var(--neutral-50)]"}`}>
            {it.label}
          </Link>
        ) : (
          <span key={i} className={cls}>{it.label}</span>
        );
      })}
    </div>
  );
}
