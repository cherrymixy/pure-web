import Link from "next/link";
import { GUIDELINE_NAV, type GuidelineNavItem } from "@/data/guideline/nav";

/** Guideline tree in the Lab sidebar, nav-row style (1095:6568): hairline-indented groups 15, pages 14, selected = #eef1f4 + ink medium.
 *  Structure from Figma 808:1594 / 886:1706 "Side nav": groups, and the open group's pages (open on the group's own page too). Items without a page are plain text. */
export function GuidelineTree({ base, current: at }: { base: string; current: string }) {
  // The guideline landing page is the first Foundations page, so Foundations reads as selected there.
  const current = at === base ? `${base}/${GUIDELINE_NAV[0].path}` : at;
  const href = (it: GuidelineNavItem) => (it.path ? `${base}/${it.path}` : undefined);
  return (
    <div className="ml-[21px] flex flex-col gap-[2px] border-l border-[var(--home-line)] pl-[var(--space-8)] text-[15px] leading-normal">
      {GUIDELINE_NAV.map((g) => {
        const open = href(g) === current || g.children?.some((c) => href(c) === current);
        return (
          <div key={g.label} className="contents">
            <Item label={g.label} href={href(g)} on={href(g) === current && !g.children?.some((c) => href(c) === current)} cls="px-[var(--space-12)] text-[var(--home-ink-2)]" />
            {open &&
              g.children &&
              g.children!.map((c) =>
                c.tag ? (
                  <span key={c.label} className="px-[var(--space-12)] pb-[2px] pt-[var(--space-8)] text-[12px] font-medium text-[var(--home-ink-3)]">{c.label}</span>
                ) : (
                  <Item key={c.label} label={c.label} href={href(c)} on={href(c) === current} cls="pl-[var(--space-24)] pr-[var(--space-12)] text-[14px] text-[var(--home-ink-2)]" />
                ),
              )}
          </div>
        );
      })}
    </div>
  );
}

function Item({ label, href, on, cls }: { label: string; href?: string; on: boolean; cls: string }) {
  const c = `rounded-[10px] py-[7px] ${cls} ${on ? "bg-[var(--home-nav-on)] font-medium !text-[var(--home-ink)]" : ""}`;
  return href ? (
    <Link href={href} aria-current={on ? "page" : undefined} className={`${c} ${on ? "" : "hover:bg-[var(--home-nav-on)]"}`}>
      {label}
    </Link>
  ) : (
    <span className={c}>{label}</span>
  );
}
