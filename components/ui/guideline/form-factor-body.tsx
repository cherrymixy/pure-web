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
/** Line drawings traced from the Figma form-factor icons (public/figma/guideline/icons/icon-*.svg), scaled up:
 *  white fills, ink 3 px round strokes, joint dots. Coordinates are the icon's, mapped by (ox, oy, s). */
const FIGS: Record<string, { s: number; ox: number; oy: number }> = {
  "full-body": { s: 11, ox: 79, oy: 10 },
  "joint-walking": { s: 12, ox: 64, oy: 22 },
  "joint-driving": { s: 12, ox: 71, oy: 20 },
  "jointless-driving": { s: 11.5, ox: 80, oy: 14 },
  "joint-fixed": { s: 11.5, ox: 68, oy: 12 },
};

function Drawing({ slug, lit, role }: { slug: string; lit?: Part; role: Role }) {
  const f = FIGS[slug];
  if (!f) return null;
  const X = (x: number) => f.ox + x * f.s;
  const Y = (y: number) => f.oy + y * f.s;
  const line = { stroke: INK, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const box = (x1: number, y1: number, x2: number, y2: number, r: number) => (
    <rect x={X(x1)} y={Y(y1)} width={(x2 - x1) * f.s} height={(y2 - y1) * f.s} rx={r * f.s} fill="var(--neutral-0)" {...line} />
  );
  const seg = (x1: number, y1: number, x2: number, y2: number) => <line x1={X(x1)} y1={Y(y1)} x2={X(x2)} y2={Y(y2)} {...line} />;
  const dot = (x: number, y: number, r: number) => <circle cx={X(x)} cy={Y(y)} r={r * f.s} fill="var(--neutral-0)" {...line} />;
  /** two eyes centred at (x, y) in icon units */
  const eyes = (x: number, y: number, k = 1) => (
    <>
      <rect className="ff-eye" x={X(x) - 9 * k} y={Y(y) - 5 * k} width={5 * k} height={10 * k} rx={2.5 * k} fill={INK} />
      <rect className="ff-eye" x={X(x) + 4 * k} y={Y(y) - 5 * k} width={5 * k} height={10 * k} rx={2.5 * k} fill={INK} />
    </>
  );
  const part = (name: Part, ox: number, oy: number, children: React.ReactNode) => (
    <g className={lit === name ? `ff-lit ff-${role}` : undefined} style={{ transformOrigin: `${X(ox)}px ${Y(oy)}px`, transformBox: "view-box" }}>
      {children}
    </g>
  );
  switch (slug) {
    case "full-body":
      return (
        <>
          {part("legs", 3.72, 7.29, <>{seg(2.93, 7.29, 2.73, 10.86)}{seg(4.51, 7.29, 4.71, 10.86)}</>)}
          {part("arms", 3.72, 4.12, <>{seg(1.74, 4.12, 0.35, 6.89)}{seg(5.7, 4.12, 7.09, 6.89)}</>)}
          {part("torso", 3.72, 7.29, box(1.74, 3.32, 5.7, 7.29, 1))}
          {part("head", 3.72, 3.3, <>{seg(3.72, 2.73, 3.72, 3.32)}{box(2.33, 0.35, 5.11, 2.73, 1)}{eyes(3.72, 1.54, 0.8)}</>)}
        </>
      );
    case "joint-walking":
      return (
        <>
          {part("legs", 3.5, 5.9, <>{seg(1.54, 5.9, 1.14, 8.68)}{seg(2.92, 5.9, 3.12, 8.68)}{seg(4.51, 5.9, 4.11, 8.68)}{seg(5.9, 5.9, 6.29, 8.68)}</>)}
          {part("torso", 3.5, 5.9, <>{seg(0.35, 4, -0.5, 2.9)}{box(0.35, 2.93, 6.69, 5.9, 1.49)}</>)}
          {part("head", 6.2, 3.6, <>{box(5.5, 0.95, 9.07, 3.73, 1)}{eyes(7.3, 2.34, 0.8)}</>)}
        </>
      );
    case "joint-driving":
      return (
        <>
          {part("legs", 4.11, 8.1, <>{box(0.35, 6.1, 7.88, 8.08, 0.79)}{dot(1.93, 8.78, 0.69)}{dot(6.3, 8.78, 0.69)}</>)}
          {part("torso", 4.11, 6.1, <>{seg(4.11, 6.1, 4.11, 3.52)}{dot(4.11, 4.81, 0.4)}</>)}
          {part("arms", 4.11, 4.81, <>{seg(4.5, 4.81, 6.6, 4.3)}{dot(6.75, 4.26, 0.3)}</>)}
          {part("head", 4.11, 3.52, <>{box(1.93, 0.35, 6.3, 3.52, 1)}{eyes(4.11, 1.94, 0.9)}</>)}
        </>
      );
    case "jointless-driving":
      return (
        <>
          {part("legs", 3.52, 9.2, <>{dot(1.94, 9.17, 0.89)}{dot(5.11, 9.17, 0.89)}</>)}
          {part("torso", 3.52, 8.28, <>{box(0.35, 0.35, 6.69, 8.28, 3.17)}{box(1.74, 2.33, 5.3, 3.91, 0.79)}{eyes(3.52, 3.12, 0.6)}</>)}
        </>
      );
    case "joint-fixed":
      return (
        <>
          {box(0.35, 9.27, 6.3, 10.06, 0.4)}
          {part("torso", 3.32, 9.27, <>{seg(3.32, 9.27, 2.33, 5.7)}{seg(2.33, 5.7, 5.11, 3.13)}{dot(2.33, 5.7, 0.5)}{dot(5.11, 3.13, 0.5)}</>)}
          {part("head", 5.11, 3.13, <>{box(4.91, 0.35, 8.68, 2.93, 0.9)}{eyes(6.8, 1.64, 0.8)}</>)}
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
