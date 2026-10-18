import type {
  ComponentDocSection,
  PrincipleFigure,
} from "@/data/guideline/types";
import { STRINGS } from "@/data/strings";

// Principle sections without a Figma frame, drawn in the Face page's language (808:1649, 960 frame ×2):
// p-cards = Type cards (808:1671) · p-flow = "What is changing?" figure (808:1738) · p-bullets = Positivity/Negativity row (808:1766)
// p-phases = Rhythm figure + loop cards (808:1808) · p-compare = How to Change cards (808:1873) · p-donts = Don't cards (808:1902).

type Of<K extends string> = Extract<ComponentDocSection, { kind: K }>;

const F = "/figma/guideline/face";
/** Figma column 808:1667 (490.66 ×2) */
const COL = "w-full max-w-[981.31px]";
const GRID = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" } as const;

/** Chips (Face order chips 808:1786 ×2: first sage-200, rest sage-100 + border) with arrows when `flow`, under an optional big label. */
/** small: inside cards (12 px chips) so a three-step flow stays on one line */
function Figure({
  f,
  dark = false,
  small = false,
}: {
  f: PrincipleFigure;
  dark?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-[var(--space-12)] px-[var(--space-16)] text-center">
      {f.big && (
        <span
          className={`font-mono text-[28px] font-semibold leading-[34px] ${dark ? "text-[var(--text-on-inverse)]" : "text-[var(--text-primary)]"}`}
        >
          {f.big}
        </span>
      )}
      {f.chips?.length ? (
        <div
          className={`flex flex-wrap items-center justify-center ${small ? "gap-[var(--space-4)]" : "gap-[var(--space-8)]"}`}
        >
          {f.chips.map((c, i) => (
            <span key={i} className="flex items-center">
              <Chip first={i === 0} label={c} small={small} />
              {f.flow && i < f.chips!.length - 1 && <Arrow small={small} />}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Chip({
  label,
  first,
  small = false,
}: {
  label: string;
  first: boolean;
  small?: boolean;
}) {
  return (
    <span
      className={`flex items-center whitespace-nowrap rounded-[var(--radius-full)] text-[var(--text-primary)] ${small ? "h-[28px] px-[var(--space-12)] text-[12px]" : "h-[34px] px-[var(--space-16)] text-[14px]"} ${
        first
          ? "bg-[var(--sage-200)]"
          : "border-[1px] border-[var(--sage-200)] bg-[var(--sage-100)]"
      }`}
    >
      {label}
    </span>
  );
}

/** Face order arrow 808:1790 (5.947 wide, stroke overshoot) at ×2 */
function Arrow({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative h-0 w-[11.89px] shrink-0 ${small ? "mx-[var(--space-4)]" : "ml-[var(--space-8)]"}`}
    >
      <span className="absolute inset-[-2.64px_-22.22%_-2.64px_-4.17%]">
        <img
          alt=""
          src={`${F}/order-arrow-1.svg`}
          className="block size-full max-w-none"
        />
      </span>
    </span>
  );
}

function Proposed() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-[var(--radius-full)] border border-dashed border-[var(--neutral-400)] px-[var(--space-8)] py-[2px] text-[11px] font-medium leading-[14px] text-[var(--text-secondary)]">
      {STRINGS.guideline.proposed}
    </span>
  );
}

/** Type cards 808:1671 */
export function PrincipleCards({ s }: { s: Of<"p-cards"> }) {
  return (
    <div
      className={`${COL} grid gap-[var(--space-20)] ${GRID[s.columns ?? 4]}`}
    >
      {s.items.map((it) => (
        <div
          key={it.title}
          className="flex min-w-0 flex-col gap-[var(--space-16)] rounded-[var(--radius-lg)] border-[0.85px] border-[var(--border-default)] bg-[var(--bg-surface)] p-[var(--space-16)]"
        >
          {it.figure && (
            <div
              aria-hidden
              className="flex h-[127.16px] items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-canvas)]"
            >
              <Figure f={it.figure} small />
            </div>
          )}
          <div className="flex flex-col gap-[var(--space-8)]">
            {it.tag && (
              <code className="font-mono text-[12px] text-[var(--web-3f77a1)]">
                {it.tag}
              </code>
            )}
            <span className="flex flex-wrap items-center gap-[var(--space-8)] text-[16px] font-bold text-[var(--text-primary)]">
              {it.title}
              {it.proposed && <Proposed />}
            </span>
            {it.subtitle && (
              <span className="text-[12px] text-[var(--text-secondary)]">
                {it.subtitle}
              </span>
            )}
          </div>
          {it.info && (
            <div className="mt-auto flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xs)] bg-[var(--bg-canvas)] px-[var(--space-12)] py-[var(--space-8)]">
              <span className="text-[10px] font-bold text-[var(--web-3f77a1)]">
                {it.infoLabel ?? s.label}
              </span>
              <span className="text-[12px] text-[var(--text-link)]">
                {it.info}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** "What is changing?" figure 808:1738: a sage-50 band with a chip flow and notes under each step */
export function PrincipleFlow({ s }: { s: Of<"p-flow"> }) {
  return (
    <div
      className={`${COL} flex min-h-[254.74px] flex-col items-center justify-center gap-[var(--space-24)] rounded-[var(--radius-xl)] bg-[var(--sage-50)] px-[var(--space-40)] py-[var(--space-40)]`}
    >
      <div className="flex flex-wrap items-start justify-center gap-y-[var(--space-16)]">
        {s.steps.map((st, i) => (
          <div key={i} className="flex items-start">
            <div className="flex max-w-[180px] flex-col items-center gap-[var(--space-8)] text-center">
              <Chip first={i === 0} label={st.label} />
              {st.note && (
                <span className="text-[12px] leading-[16px] text-[var(--text-secondary)]">
                  {st.note}
                </span>
              )}
            </div>
            {i < s.steps.length - 1 && (
              <span className="flex h-[34px] items-center px-[var(--space-8)]">
                <Arrow />
              </span>
            )}
          </div>
        ))}
      </div>
      {s.caption && (
        <span className="text-center text-[14px] font-medium text-[var(--text-primary)]">
          {s.caption}
        </span>
      )}
    </div>
  );
}

/** Positivity / Negativity row 808:1766: heading + line bullets, figure on the right */
export function PrincipleBullets({ s }: { s: Of<"p-bullets"> }) {
  return (
    <div className={`${COL} flex items-center gap-[var(--space-24)]`}>
      <div className="flex w-[498.59px] shrink-0 flex-col gap-[var(--space-24)]">
        <span className="text-[22px] font-medium text-[var(--neutral-700)]">
          {s.heading}
        </span>
        <ul className="flex flex-col gap-[var(--space-24)]">
          {s.items.map((b, i) => (
            <li key={i} className="flex items-start gap-[var(--space-12)]">
              {/* bullet line 808:1771 (22.8 tall, drawn at zoom 2) */}
              <span aria-hidden className="w-0 shrink-0" style={{ zoom: 2 }}>
                <span className="relative flex h-[22.798px] w-0 items-center justify-center">
                  <span className="relative h-0 w-[22.798px] flex-none rotate-90">
                    <span className="absolute inset-[-1.49px_0_0_0]">
                      <img
                        alt=""
                        src={`${F}/bullet-1.svg`}
                        className="block size-full max-w-none"
                      />
                    </span>
                  </span>
                </span>
              </span>
              <span className="w-[428.21px] text-[14px] text-[var(--text-secondary)]">
                {b}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div
        aria-hidden
        className="flex min-h-[222.03px] min-w-0 flex-1 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--sage-50)] py-[var(--space-24)]"
      >
        <Figure f={s.figure} />
      </div>
    </div>
  );
}

/** Rhythm figure 808:1810 + loop cards 808:1847: a track split into phases (short · long · short), labels under it */
export function PrinciplePhases({ s }: { s: Of<"p-phases"> }) {
  const grow = (i: number) => (s.phases.length === 3 && i === 1 ? 3 : 1);
  return (
    <div className={`${COL} flex flex-col gap-[var(--space-20)]`}>
      <div className="flex flex-col gap-[var(--space-24)] rounded-[var(--radius-xl)] bg-[var(--bg-canvas)] px-[51.5px] pb-[var(--space-32)] pt-[var(--space-48)]">
        <div aria-hidden className="flex h-[48px] items-stretch">
          {s.phases.map((p, i) => (
            <div
              key={p.title}
              style={{ flexGrow: grow(i) }}
              className={`basis-0 ${i ? "border-l border-dashed border-[var(--neutral-400)]" : ""} ${
                grow(i) > 1
                  ? "bg-gradient-to-b from-[color-mix(in_srgb,var(--web-c5d1d4)_0%,transparent)] to-[color-mix(in_srgb,var(--web-c5d1d4)_44%,transparent)]"
                  : ""
              } flex items-end`}
            >
              <span
                className={`h-[3px] w-full ${grow(i) > 1 ? "bg-[var(--neutral-700)]" : "bg-[var(--neutral-400)]"}`}
              />
            </div>
          ))}
        </div>
        <div className="flex">
          {s.phases.map((p, i) => (
            <div
              key={p.title}
              style={{ flexGrow: grow(i) }}
              className={`flex basis-0 flex-col gap-[var(--space-8)] ${i === 0 ? "items-start" : i === s.phases.length - 1 ? "items-end text-right" : "items-center text-center"}`}
            >
              <div className="flex items-start gap-[var(--space-12)]">
                <span className="whitespace-nowrap text-[14px] font-bold text-[var(--text-primary)]">
                  {p.title}
                </span>
                <span className="flex h-[40px] items-center justify-center whitespace-nowrap rounded-[var(--radius-sm)] bg-[var(--bg-surface)] p-[var(--space-12)] text-[10px] font-bold text-[var(--text-primary)]">
                  {p.time}
                </span>
              </div>
              <span className="max-w-[300px] text-[10px] text-[var(--text-secondary)]">
                {p.note}
              </span>
            </div>
          ))}
        </div>
      </div>
      {s.loops?.length ? (
        <div className="flex gap-[var(--space-20)]">
          {s.loops.map((l) => (
            <div
              key={l.title}
              className="flex min-h-[104.08px] min-w-0 flex-1 flex-col gap-[var(--space-8)] rounded-[var(--radius-lg)] bg-[var(--sage-50)] px-[19.35px] py-[18.84px]"
            >
              <div className="flex items-start justify-between gap-[var(--space-12)]">
                <span className="text-[14px] font-bold text-[var(--text-primary)]">
                  {l.title}
                </span>
                <div className="flex shrink-0 flex-wrap justify-end gap-[var(--space-8)]">
                  {l.chips.map((c) => (
                    <span
                      key={c}
                      className="flex h-[36.88px] items-center whitespace-nowrap rounded-[var(--radius-xs)] bg-[var(--bg-surface)] p-[var(--space-12)] text-[10px] font-bold text-[var(--web-7e7f7f)]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <span className="whitespace-pre-line text-[10px] text-[var(--text-secondary)]">
                {l.text}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** How to Change Expression cards 808:1873 */
export function PrincipleCompare({ s }: { s: Of<"p-compare"> }) {
  return (
    <div className={`${COL} flex gap-[var(--space-20)]`}>
      {s.items.map((it) => (
        <div
          key={it.title}
          className="flex min-w-0 flex-1 flex-col gap-[var(--space-12)] rounded-[var(--radius-lg)] border-[0.85px] border-[var(--neutral-150)] bg-[var(--bg-surface)] p-[var(--space-16)]"
        >
          <div className="relative flex h-[118.95px] flex-col items-center justify-center gap-[var(--space-8)] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--neutral-300)]">
            <Figure f={it.figure} dark small />
            <span className="text-center text-[14px] font-medium text-[var(--text-on-inverse)]">
              {it.caption}
            </span>
          </div>
          <div className="flex flex-col gap-[var(--space-4)]">
            <span className="text-[16px] font-bold text-[var(--text-primary)]">
              {it.title}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              {it.text}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Don't cards 808:1902 */
export function PrincipleDonts({ s }: { s: Of<"p-donts"> }) {
  return (
    <div className={`${COL} grid grid-cols-3 gap-[var(--space-20)]`}>
      {s.items.map((it) => (
        <div
          key={it.title}
          className="flex min-w-0 flex-col gap-[var(--space-12)] rounded-[var(--radius-lg)] border-[0.86px] border-[var(--neutral-150)] bg-[var(--bg-surface)] p-[var(--space-20)]"
        >
          <div
            aria-hidden
            className="flex h-[128.6px] items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--neutral-150)]"
          >
            <Figure f={it.figure} small />
          </div>
          <span className="text-[16px] font-bold text-[var(--red-500)]">
            {it.title}
          </span>
          <span className="text-[10px] text-[var(--text-secondary)]">
            {it.text}
          </span>
        </div>
      ))}
    </div>
  );
}
