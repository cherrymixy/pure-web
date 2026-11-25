"use client";

import { useEffect, useState } from "react";
import { STRINGS, fmt } from "@/data/strings";
import { Icon } from "../icons/icon";
import { BehaviorDemo } from "./behavior-demo";

// Patterns detail pages: the situation acted out. Trigger → each Component in order (one robot on the stage) → Exit.
// Play walks the steps on a timer; a step chip jumps straight to that step.

const S = STRINGS.guideline.player;
const STEP_MS = 2600;

export function PatternScene({ trigger, steps }: { trigger: string; steps: { slug: string; title: string }[] }) {
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (at < steps.length - 1) {
        setAt(at + 1);
        setRun((r) => r + 1);
      } else setPlaying(false);
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [playing, at, steps.length]);

  const play = () => {
    if (playing) return setPlaying(false);
    setAt(at >= steps.length - 1 ? 0 : at);
    setRun((r) => r + 1);
    setPlaying(true);
  };
  const jump = (i: number) => {
    setAt(i);
    setRun((r) => r + 1);
    setPlaying(true);
  };
  const cur = steps[at];

  return (
    <div data-playing={playing} className="flex flex-col gap-[var(--space-16)] rounded-[var(--radius-lg)] bg-[var(--neutral-0)] p-[var(--space-24)]">
      <div className="relative h-[300px] rounded-[14px] bg-[var(--home-canvas)]" data-bhv-stage>
        <BehaviorDemo key={`${cur.slug}-${run}`} slug={cur.slug} className="absolute inset-0 m-auto block h-[260px] w-full" />
        <button
          type="button"
          onClick={play}
          aria-pressed={playing}
          aria-label={playing ? S.pause : S.play}
          className="absolute right-[var(--space-16)] top-[var(--space-16)] flex size-[48px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--home-ink)] text-[var(--neutral-0)] transition-transform duration-[var(--motion-base)] hover:scale-105 motion-reduce:transition-none"
        >
          <Icon name={playing ? "stop" : "play"} size={20} />
        </button>
        <span className="absolute left-[var(--space-16)] top-[var(--space-16)] flex flex-col gap-[2px]">
          <span className="text-[12px] font-medium text-[var(--home-ink-3)]">{fmt(S.step, { n: at + 1, total: steps.length })}</span>
          <span className="text-[22px] font-semibold text-[var(--home-ink)]">{cur.title}</span>
        </span>
        {/* progress through the steps */}
        <span aria-hidden className="absolute inset-x-[var(--space-16)] bottom-[var(--space-16)] flex gap-[4px]">
          {steps.map((s, i) => (
            <span key={s.slug} className="h-[4px] flex-1 overflow-hidden rounded-[var(--radius-full)] bg-[var(--home-pill)]">
              {i < at && <span className="block h-full w-full bg-[var(--home-ink)]" />}
              {i === at && <span key={run} className={`block h-full bg-[var(--home-ink)] ${playing ? "scene-fill" : "w-full opacity-30"}`} style={{ animationDuration: `${STEP_MS}ms` }} />}
            </span>
          ))}
        </span>
      </div>

      <ol className="flex flex-wrap items-stretch gap-[var(--space-8)]">
        <li className="flex min-w-[160px] max-w-[260px] flex-col justify-center gap-[2px] rounded-[14px] bg-[var(--home-canvas)] px-[var(--space-16)] py-[var(--space-12)]">
          <span className="text-[12px] font-medium text-[var(--home-ink-3)]">{S.trigger}</span>
          <span className="text-[14px] leading-[1.45] text-[var(--home-ink)]">{trigger}</span>
        </li>
        {steps.map((s, i) => (
          <li key={s.slug} className="flex items-center gap-[var(--space-8)]">
            <span aria-hidden className="text-[15px] text-[var(--home-ink-3)]">→</span>
            <button
              type="button"
              onClick={() => jump(i)}
              aria-current={i === at ? "step" : undefined}
              className={`group flex h-full items-center gap-[var(--space-8)] rounded-[14px] py-[var(--space-8)] pl-[var(--space-8)] pr-[var(--space-16)] transition-colors duration-[var(--motion-base)] ${
                i === at ? "bg-[var(--home-ink)] text-[var(--neutral-0)]" : "bg-[var(--home-canvas)] text-[var(--home-ink)] hover:bg-[var(--home-pill)]"
              }`}
            >
              <span className="flex h-[44px] w-[64px] items-center justify-center rounded-[10px] bg-[var(--neutral-0)]">
                <BehaviorDemo slug={s.slug} className="block h-[40px] w-[64px]" />
              </span>
              <span className="flex flex-col items-start">
                <span className={`text-[11px] font-medium ${i === at ? "text-[var(--neutral-0)] opacity-70" : "text-[var(--home-ink-3)]"}`}>{i + 1}</span>
                <span className="text-[14px] font-semibold">{s.title}</span>
              </span>
            </button>
          </li>
        ))}
        <li className="flex items-center gap-[var(--space-8)]">
          <span aria-hidden className="text-[15px] text-[var(--home-ink-3)]">→</span>
          <span className="flex h-full items-center rounded-[14px] bg-[var(--home-canvas)] px-[var(--space-16)] py-[var(--space-12)] text-[14px] font-semibold text-[var(--home-ink)]">{S.exit}</span>
        </li>
      </ol>
    </div>
  );
}
