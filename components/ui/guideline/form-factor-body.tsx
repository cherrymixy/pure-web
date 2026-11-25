"use client";

import { useState } from "react";
import { STRINGS } from "@/data/strings";

// Templates detail pages: the form factor's body with its four roles. Pick a role → the part that plays it lights up and
// moves the way that role moves (attend turns, posture rises, locomote travels, gesture swings). A missing role shows the
// part that stands in for it, or nothing when it is skipped. globals.css .ff-*.

const S = STRINGS.guideline.body;
export type Role = "attend" | "posture" | "locomote" | "gesture";
const ROLES: Role[] = ["attend", "posture", "locomote", "gesture"];
type Part = string;
/** role → the part that has it, a stand-in part, or missing */
type Map = Record<Role, { part: Part } | { via: Part } | null>;

const MAPS: Record<string, Map> = {
  "full-body": { attend: { part: "head" }, posture: { part: "torso" }, locomote: { part: "legs" }, gesture: { part: "arms" } },
  "joint-walking": { attend: { part: "head" }, posture: { part: "torso" }, locomote: { part: "legs" }, gesture: { via: "head" } },
  "joint-driving": { attend: { part: "head" }, posture: { part: "torso" }, locomote: { part: "legs" }, gesture: { part: "arms" } },
  "jointless-driving": { attend: { part: "torso" }, posture: null, locomote: { part: "legs" }, gesture: { via: "torso" } },
  "joint-fixed": { attend: { part: "head" }, posture: { part: "torso" }, locomote: { via: "torso" }, gesture: { via: "head" } },
};

const INK = "var(--home-ink)";
/** Each body drawn from four parts (head · torso · legs · arms), origins for the role motion. */
function Drawing({ slug, lit, role }: { slug: string; lit?: Part; role: Role }) {
  const part = (name: Part, origin: string, children: React.ReactNode) => (
    <g className={lit === name ? `ff-lit ff-${role}` : undefined} style={{ transformOrigin: origin, transformBox: "view-box" }}>
      {children}
    </g>
  );
  const eyes = (x: number, y: number) => (
    <>
      <rect className="ff-eye" x={x - 9} y={y} width={6} height={10} rx={2.5} fill="var(--neutral-0)" />
      <rect className="ff-eye" x={x + 3} y={y} width={6} height={10} rx={2.5} fill="var(--neutral-0)" />
    </>
  );
  switch (slug) {
    case "full-body":
      return (
        <>
          {part("legs", "120px 120px", <><rect x={104} y={102} width={12} height={36} rx={6} fill={INK} /><rect x={124} y={102} width={12} height={36} rx={6} fill={INK} /></>)}
          {part("arms", "120px 66px", <><rect x={82} y={62} width={11} height={38} rx={5.5} fill={INK} /><rect x={147} y={62} width={11} height={38} rx={5.5} fill={INK} /></>)}
          {part("torso", "120px 104px", <rect x={96} y={58} width={48} height={48} rx={14} fill={INK} />)}
          {part("head", "120px 54px", <><rect x={100} y={18} width={40} height={34} rx={12} fill={INK} />{eyes(120, 30)}</>)}
        </>
      );
    case "joint-walking":
      return (
        <>
          {part("legs", "120px 124px", <>{[78, 96, 140, 158].map((x) => <rect key={x} x={x} y={92} width={10} height={40} rx={5} fill={INK} />)}</>)}
          {part("torso", "120px 96px", <rect x={70} y={62} width={104} height={40} rx={18} fill={INK} />)}
          {part("head", "168px 70px", <><rect x={150} y={30} width={46} height={40} rx={14} fill={INK} />{eyes(173, 44)}</>)}
        </>
      );
    case "joint-driving":
      return (
        <>
          {part("legs", "120px 126px", <><rect x={82} y={108} width={76} height={18} rx={9} fill={INK} /><circle cx={96} cy={130} r={9} fill={INK} /><circle cx={144} cy={130} r={9} fill={INK} /></>)}
          {part("torso", "120px 108px", <rect x={114} y={66} width={12} height={44} rx={6} fill={INK} />)}
          {part("arms", "150px 88px", <rect x={124} y={82} width={36} height={9} rx={4.5} fill={INK} />)}
          {part("head", "120px 66px", <><rect x={96} y={30} width={48} height={38} rx={13} fill={INK} />{eyes(120, 43)}</>)}
        </>
      );
    case "jointless-driving":
      return (
        <>
          {part("legs", "120px 128px", <><circle cx={100} cy={130} r={9} fill={INK} /><circle cx={140} cy={130} r={9} fill={INK} /></>)}
          {part("torso", "120px 124px", <><rect x={88} y={30} width={64} height={98} rx={30} fill={INK} />{eyes(120, 52)}</>)}
        </>
      );
    case "joint-fixed":
      return (
        <>
          <rect x={92} y={124} width={56} height={12} rx={6} fill={INK} opacity={0.85} />
          {part("torso", "120px 124px", <><rect x={114} y={84} width={12} height={42} rx={6} fill={INK} /><rect x={114} y={58} width={12} height={32} rx={6} fill={INK} transform="rotate(-18 120 86)" /></>)}
          {part("head", "128px 60px", <><rect x={104} y={22} width={50} height={38} rx={13} fill={INK} />{eyes(129, 35)}</>)}
        </>
      );
  }
  return null;
}

export function FormFactorBody({ slug, roles, substitute }: { slug: string; roles: Record<Role, string>; substitute: string }) {
  const map = MAPS[slug];
  const [role, setRole] = useState<Role>("attend");
  const m = map[role];
  const lit = m ? ("part" in m ? m.part : m.via) : undefined;
  return (
    <div className="flex gap-[var(--space-16)] rounded-[var(--radius-lg)] bg-[var(--neutral-0)] p-[var(--space-24)]">
      <div className="relative h-[320px] min-w-0 flex-1 rounded-[14px] bg-[var(--home-canvas)]">
        <svg aria-hidden viewBox="0 0 240 150" className="absolute inset-0 m-auto block h-[280px] w-full">
          <ellipse cx={120} cy={142} rx={70} ry={4} fill={INK} opacity={0.08} />
          <Drawing key={role} slug={slug} lit={lit} role={role} />
        </svg>
        <span className="absolute bottom-[var(--space-16)] left-[var(--space-16)] rounded-[var(--radius-full)] bg-[var(--neutral-0)] px-[var(--space-12)] py-[4px] text-[12px] font-medium text-[var(--home-ink-2)]">
          {m === null ? S.skipped : m && "via" in m ? S.standIn : S.has}
        </span>
      </div>
      <div className="flex w-[320px] shrink-0 flex-col gap-[var(--space-8)]">
        {ROLES.map((r) => {
          const x = map[r];
          const on = r === role;
          return (
            <button
              type="button"
              key={r}
              aria-pressed={on}
              onClick={() => setRole(r)}
              onMouseEnter={() => setRole(r)}
              className={`flex flex-col items-start gap-[2px] rounded-[14px] px-[var(--space-16)] py-[var(--space-12)] text-left transition-colors duration-[var(--motion-base)] ${on ? "bg-[var(--home-ink)] text-[var(--neutral-0)]" : "bg-[var(--home-canvas)] text-[var(--home-ink)] hover:bg-[var(--home-pill)]"}`}
            >
              <span className="flex w-full items-center gap-[var(--space-8)]">
                <code className="font-mono text-[13px] font-semibold">role.{r}</code>
                <span className="flex-1" />
                <span className={`rounded-[var(--radius-full)] px-[var(--space-8)] py-[1px] text-[11px] font-medium ${on ? "bg-[color-mix(in_srgb,var(--neutral-0)_18%,transparent)]" : "bg-[var(--neutral-0)] text-[var(--home-ink-2)]"}`}>
                  {x === null ? S.skipped : "via" in x ? S.standIn : S.has}
                </span>
              </span>
              <span className={`text-[14px] ${on ? "opacity-80" : "text-[var(--home-ink-2)]"}`}>{roles[r]}</span>
            </button>
          );
        })}
        <div className="mt-auto flex flex-col gap-[2px] px-[var(--space-4)] pt-[var(--space-8)]">
          <span className="text-[12px] font-medium text-[var(--home-ink-3)]">{S.substitute}</span>
          <span className="text-[14px] text-[var(--home-ink)]">{substitute}</span>
        </div>
      </div>
    </div>
  );
}
