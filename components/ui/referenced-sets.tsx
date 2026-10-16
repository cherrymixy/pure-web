"use client";

import { useRef, useState } from "react";
import { COMPONENTS } from "@/data/components";
import { referenceSetFor, type ReferenceChannel, type ReferenceItem } from "@/data/reference-sets";
import { STRINGS, fmt } from "@/data/strings";
import { Icon } from "@/components/ui/icons/icon";

const E = STRINGS.editor;

/**
 * What the AI referenced: one set (face / motion / sound) per behavior in the expression.
 * `strip` = editor Context tab (Figma W02D-1 901:9964 ×2): "Reference" title + 123px thumbnails with a channel chip each.
 */
export function ReferencedSets({ behaviors, variant = "list" }: { behaviors: string[]; variant?: "list" | "strip" }) {
  const sets = [...new Set(behaviors)].map((b) => referenceSetFor(b)).filter((s) => s !== undefined);
  const [pick, setPick] = useState(0);
  const set = sets[Math.min(pick, sets.length - 1)];
  const label = (id: string) => COMPONENTS.find((c) => c.id === id)?.label ?? id;

  if (variant === "strip") {
    return (
      <section className="flex w-[301px] flex-col gap-[var(--space-16)]" data-testid="referenced">
        <div className="flex items-center gap-[var(--space-8)]">
          <Icon name="notes" size={24} className="shrink-0 text-[var(--neutral-800)]" />
          <h3 className="flex-1 text-[18px] leading-[23px] text-[var(--text-primary)]">{E.reference}</h3>
          <span
            title={E.referencedEmpty}
            aria-label={E.referencedTitle}
            className="flex size-[19px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--neutral-300)] text-[12px] leading-[15px] text-[var(--text-on-inverse)]"
          >
            ?
          </span>
        </div>
        {!set ? (
          <p className="text-[14px] leading-[18px] text-[var(--text-tertiary)]">{E.referencedEmpty}</p>
        ) : (
          <>
            {sets.length > 1 && (
              <div className="flex flex-wrap gap-[var(--space-8)]">
                {sets.map((s, i) => (
                  <button
                    key={s.behavior}
                    aria-pressed={s === set}
                    onClick={() => setPick(i)}
                    className={`rounded-[var(--radius-full)] px-[var(--space-12)] py-[var(--space-4)] text-[14px] leading-[18px] ${s === set ? "bg-[var(--neutral-300)] text-[var(--text-primary)]" : "bg-[var(--bg-canvas)] text-[var(--text-secondary)]"}`}
                  >
                    {label(s.behavior)}
                  </button>
                ))}
              </div>
            )}
            {sets.length === 1 && <span className="sr-only">{fmt(E.referencedFor, { behavior: label(set.behavior) })}</span>}
            <div className="relative -mr-[32px] overflow-hidden">
              <div className="flex gap-[var(--space-12)] overflow-x-auto pr-[32px] [scrollbar-width:none]">
                {set.items.map((it) => <StripItem key={it.channel} item={it} />)}
              </div>
              {/* Figma 901:10006: white fade on the right edge (64px) */}
              <div className="pointer-events-none absolute inset-y-0 right-0 w-[64px] bg-gradient-to-l from-[var(--bg-surface)] from-[37%] to-transparent" />
            </div>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2" data-testid="referenced">
      <span className="text-xs text-neutral-500">{E.referencedTitle}</span>
      {!set ? (
        <p className="text-xs text-neutral-400">{E.referencedEmpty}</p>
      ) : (
        <>
          {sets.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {sets.map((s, i) => (
                <button key={s.behavior} aria-pressed={s === set} onClick={() => setPick(i)} className={`rounded-full border px-2 py-0.5 text-xs ${s === set ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}>
                  {label(s.behavior)}
                </button>
              ))}
            </div>
          )}
          {sets.length === 1 && <span className="text-xs text-neutral-500">{fmt(E.referencedFor, { behavior: label(set.behavior) })}</span>}
          {set.items.map((it) => <ReferencedItem key={it.channel} item={it} />)}
        </>
      )}
    </section>
  );
}

/** Channel chip colors (Figma 901:10000 / 10002 / 10004: web/75add7 · web/e2a1c1 · web/ecc377). */
const CHIP: Record<ReferenceChannel, string> = {
  motion: "border-[var(--web-75add7)] text-[var(--web-75add7)]",
  face: "border-[var(--web-e2a1c1)] text-[var(--web-e2a1c1)]",
  sound: "border-[var(--web-ecc377)] text-[var(--web-ecc377)]",
};

function StripItem({ item }: { item: ReferenceItem }) {
  const video = item.file.endsWith(".webm");
  const audio = item.file.endsWith(".ogg");
  const player = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const credit = `${item.title} — ${item.note}\n${fmt(E.referenceSource, { license: item.source.license, author: item.source.author })}`;

  return (
    <figure className="flex w-[123px] shrink-0 flex-col items-start gap-[var(--space-8)]" data-testid={`referenced-${item.channel}`}>
      <div className="relative size-[123px] overflow-hidden rounded-[var(--radius-md)] bg-[var(--neutral-800)]">
        <a href={item.source.page} target="_blank" rel="noreferrer" title={credit} aria-label={item.title} className="absolute inset-0">
          {audio ? (
            <span className="flex size-full items-center justify-center text-[var(--web-ecc377)]">
              <Icon name="sound" size={40} />
            </span>
          ) : video ? (
            <video src={item.file} poster={item.poster ?? undefined} muted loop autoPlay playsInline className="size-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.file} alt={item.title} className="size-full object-cover" />
          )}
        </a>
        {audio && (
          <>
            <audio ref={player} src={item.file} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
            <button
              type="button"
              aria-label={item.title}
              onClick={() => (playing ? player.current?.pause() : void player.current?.play().catch(() => {}))}
              className="absolute right-[var(--space-8)] top-[var(--space-8)] flex size-[24px] items-center justify-center rounded-[var(--radius-full)] text-[var(--text-on-inverse)]"
            >
              <Icon name={playing ? "stop" : "play-glyph"} size={playing ? 16 : 24} />
            </button>
          </>
        )}
        {video && <Icon name="play-glyph" size={13} className="pointer-events-none absolute left-[100px] top-[10px] text-[var(--text-on-inverse)]" />}
      </div>
      <figcaption className={`rounded-[var(--radius-sm)] border bg-[var(--bg-surface)] px-[var(--space-12)] py-[var(--space-4)] text-[14px] leading-[18px] ${CHIP[item.channel]}`}>
        {E.tabs[item.channel]}
      </figcaption>
    </figure>
  );
}

function ReferencedItem({ item }: { item: ReferenceItem }) {
  const video = item.file.endsWith(".webm");
  const audio = item.file.endsWith(".ogg");
  return (
    <figure className="flex flex-col gap-1 rounded border border-neutral-200 p-1.5" data-testid={`referenced-${item.channel}`}>
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0 text-[10px] uppercase tracking-wide text-neutral-500">{E.tabs[item.channel]}</span>
        <b className="truncate text-xs">{item.title}</b>
      </div>
      {audio ? (
        <audio src={item.file} controls className="h-7 w-full" />
      ) : video ? (
        <video src={item.file} poster={item.poster ?? undefined} muted loop autoPlay playsInline className="aspect-video w-full rounded object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.file} alt={item.title} className="aspect-video w-full rounded object-cover" />
      )}
      <span className="text-xs text-neutral-600">{item.note}</span>
      <figcaption className="truncate text-[10px] text-neutral-400">
        <a href={item.source.page} target="_blank" rel="noreferrer" className="underline">{fmt(E.referenceSource, { license: item.source.license, author: item.source.author })}</a>
      </figcaption>
    </figure>
  );
}
