"use client";

import { createContext, useContext, useState, type CSSProperties, type ReactNode } from "react";
import type { ComponentDocSection, DocChannel } from "@/data/guideline/types";
import { STRINGS } from "@/data/strings";
import { Icon } from "../icons/icon";
import { BehaviorDemo } from "./behavior-demo";

// Components detail pages: one player shared by Robot (stage + play), Intensity (pick a level) and Time Line (playhead).
// Play restarts the robot and the playhead together (remount by `run`), both looping over the timeline duration.

type Of<K extends string> = Extract<ComponentDocSection, { kind: K }>;
const S = STRINGS.guideline.player;
/** Intensity reach 1 · 2 · 3 → motion amplitude */
const AMP = { 1: 0.55, 2: 1, 3: 1.5 } as const;

interface Player {
  slug: string;
  playing: boolean;
  run: number;
  level: 1 | 2 | 3;
  toggle: () => void;
  setLevel: (l: 1 | 2 | 3) => void;
}
const Ctx = createContext<Player | null>(null);
const usePlayer = () => useContext(Ctx)!;

export function BehaviorPlayer({ slug, duration, children }: { slug: string; duration: number; children: ReactNode }) {
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);
  const [level, setLevel] = useState<1 | 2 | 3>(2);
  const toggle = () => {
    setPlaying((p) => !p);
    setRun((r) => r + 1);
  };
  return (
    <Ctx.Provider value={{ slug, playing, run, level, toggle, setLevel: (l) => { setLevel(l); setRun((r) => r + 1); } }}>
      <div data-playing={playing} style={{ ["--bhv-dur" as string]: `${duration}s`, ["--amp" as string]: AMP[level] } as CSSProperties}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

const CARD = "rounded-[var(--radius-lg)] bg-[var(--neutral-0)]";

export function BehaviorStage({ notes }: { notes: [string, string] }) {
  const p = usePlayer();
  return (
    <div className={`${CARD} relative flex min-w-0 flex-1 flex-col gap-[var(--space-16)] p-[var(--space-24)]`} data-bhv-stage>
      <div className="relative h-[300px] rounded-[14px] bg-[var(--home-canvas)]">
        <BehaviorDemo key={p.run} slug={p.slug} className="absolute inset-0 m-auto block h-[260px] w-full" />
        <button
          type="button"
          onClick={p.toggle}
          aria-pressed={p.playing}
          aria-label={p.playing ? S.pause : S.play}
          className="absolute right-[var(--space-16)] top-[var(--space-16)] flex size-[48px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--home-ink)] text-[var(--neutral-0)] transition-transform duration-[var(--motion-base)] hover:scale-105 motion-reduce:transition-none"
        >
          <Icon name={p.playing ? "stop" : "play"} size={20} />
        </button>
        <span className="absolute bottom-[var(--space-16)] left-[var(--space-16)] rounded-[var(--radius-full)] bg-[var(--neutral-0)] px-[var(--space-12)] py-[4px] text-[12px] font-medium text-[var(--home-ink-2)]">
          {p.playing ? S.playing : S.hint}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-[var(--space-12)]">
        {([S.face, S.motion] as const).map((label, i) => (
          <div key={label} className="flex flex-col gap-[4px] rounded-[14px] bg-[var(--home-canvas)] px-[var(--space-16)] py-[var(--space-12)]">
            <span className="text-[12px] font-medium text-[var(--home-ink-3)]">{label}</span>
            <code className="font-mono text-[13px] text-[var(--home-ink)]">{notes[i]}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BehaviorIntensity({ s }: { s: Of<"intensity"> }) {
  const p = usePlayer();
  return (
    <div className="flex gap-[var(--space-16)]">
      {s.levels.map((l) => {
        const on = p.level === l.reach;
        return (
          <button
            type="button"
            key={l.title}
            aria-pressed={on}
            onClick={() => p.setLevel(l.reach)}
            className={`group ${CARD} flex min-w-0 flex-1 flex-col gap-[var(--space-12)] p-[var(--space-16)] text-left transition-[opacity,transform] duration-[var(--motion-base)] hover:-translate-y-[2px] motion-reduce:transition-none ${on ? "" : "opacity-60 hover:opacity-100"}`}
          >
            <div className="relative h-[120px] rounded-[14px] bg-[var(--home-canvas)]" style={{ ["--amp" as string]: AMP[l.reach] } as CSSProperties}>
              <BehaviorDemo slug={p.slug} className="absolute inset-0 m-auto block h-[110px] w-full" />
              {on && <span className="absolute right-[var(--space-12)] top-[var(--space-12)] rounded-[var(--radius-full)] bg-[var(--home-ink)] px-[var(--space-8)] py-[2px] text-[11px] font-medium text-[var(--neutral-0)]">{S.selected}</span>}
            </div>
            <span className="px-[4px] text-[17px] font-semibold text-[var(--home-ink)]">{l.title}</span>
            <span className="flex flex-wrap items-center gap-[6px] px-[4px]">
              {l.chips.map((c) => <span key={c} className="rounded-[var(--radius-xs)] bg-[var(--home-pill)] px-[var(--space-8)] py-[3px] text-[13px] text-[var(--home-ink-2)]">{c}</span>)}
              <span className="flex-1" />
              <code className="rounded-[var(--radius-xs)] bg-[var(--home-pill)] px-[var(--space-8)] py-[3px] font-mono text-[13px] text-[var(--home-ink)]">{l.token}</code>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Service timeline language: ink clips, shade by channel. */
const CLIP: Record<DocChannel, string> = { motion: "bg-[var(--home-ink)]", face: "bg-[var(--home-ink-2)]", sound: "bg-[var(--home-ink-3)]" };
const I = "/figma/guideline/icons";

export function BehaviorTimeline({ s }: { s: Of<"timeline"> }) {
  const p = usePlayer();
  return (
    <div className={`${CARD} flex flex-col gap-[var(--space-12)] p-[var(--space-24)]`}>
      <div className="flex items-center gap-[var(--space-12)] pl-[142px]">
        <button type="button" onClick={p.toggle} aria-label={p.playing ? S.pause : S.play} className="flex size-[28px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--home-ink)] text-[var(--neutral-0)]">
          <Icon name={p.playing ? "stop" : "play"} size={14} />
        </button>
        <span className="font-mono text-[12px] text-[var(--home-ink-3)]">0 s</span>
        <span className="flex-1" />
        <span className="font-mono text-[12px] text-[var(--home-ink-3)]">{s.duration} s</span>
      </div>
      <div className="relative flex flex-col gap-[var(--space-8)]">
        {s.tracks.map((t) => (
          <div key={t.channel} className="flex items-center">
            <span className="flex w-[142px] shrink-0 items-center gap-[var(--space-8)] text-[15px] font-semibold text-[var(--home-ink)]">
              <img src={`${I}/tl-${t.channel}.svg`} alt="" width={26} height={26} />
              {t.label}
            </span>
            <div className="relative h-[48px] min-w-0 flex-1 rounded-[12px] bg-[var(--home-canvas)]">
              {t.clips.map((c, i) => (
                <span
                  key={i}
                  className={`absolute inset-y-[8px] flex items-center overflow-hidden whitespace-nowrap rounded-[8px] text-[12px] font-semibold text-[var(--neutral-0)] ${CLIP[t.channel]} ${c.align === "start" ? "pl-[12px]" : "justify-center"}`}
                  style={{ left: `${(c.from / s.duration) * 100}%`, width: `${((c.to - c.from) / s.duration) * 100}%` }}
                >
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        ))}
        {/* playhead over the clip lane */}
        <div aria-hidden className="pointer-events-none absolute inset-y-[-6px] left-[142px] right-0">
          <span key={p.run} className={`bhv-playhead absolute inset-y-0 w-[2px] rounded-[var(--radius-full)] bg-[var(--sage-500)] ${p.playing ? "" : "opacity-0"}`} />
        </div>
      </div>
    </div>
  );
}
