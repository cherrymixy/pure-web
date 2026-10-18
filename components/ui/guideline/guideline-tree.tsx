import Link from "next/link";
import { GUIDELINE_NAV, type GuidelineNavItem } from "@/data/guideline/nav";

/** Guideline tree (Figma 808:1594 / 886:1706 "Side nav"): groups, and the open group's pages (open on the group's own page too). Items without a page are plain text. */
export function GuidelineTree({ base, current }: { base: string; current: string }) {
  const href = (it: GuidelineNavItem) => (it.path ? `${base}/${it.path}` : undefined);
  return (
    <div className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xl)] bg-[var(--bg-surface)] px-[var(--space-24)] py-[var(--space-28)] text-[14px] leading-normal">
      {GUIDELINE_NAV.map((g) => {
        const open = href(g) === current || g.children?.some((c) => href(c) === current);
        return (
          <div key={g.label} className="contents">
            <Item label={g.label} href={href(g)} on={href(g) === current && !g.children?.some((c) => href(c) === current)} cls="px-[var(--space-12)] font-medium text-[var(--text-primary)]" />
            {open &&
              g.children &&
              g.children!.map((c) =>
                c.tag ? (
                  <span key={c.label} className="px-[var(--space-12)] py-[var(--space-8)] text-[12px] font-medium text-[var(--text-tertiary)]">{c.label}</span>
                ) : (
                  <Item key={c.label} label={c.label} href={href(c)} on={href(c) === current} cls="px-[var(--space-24)] text-[var(--text-secondary)]" />
                ),
              )}
          </div>
        );
      })}
    </div>
  );
}

function Item({ label, href, on, cls }: { label: string; href?: string; on: boolean; cls: string }) {
  const c = `rounded-[var(--radius-sm)] py-[var(--space-8)] ${cls} ${on ? "bg-[var(--sage-100)] !text-[var(--text-primary)]" : ""}`;
  return href ? (
    <Link href={href} aria-current={on ? "page" : undefined} className={`${c} ${on ? "" : "hover:bg-[var(--neutral-50)]"}`}>
      {label}
    </Link>
  ) : (
    <span className={c}>{label}</span>
  );
}
