"use client";

import { useRef, useState } from "react";
import { simBehaviorLabel } from "@/data/sim-behaviors";
import { referenceSetFor, referenceSetForText, type ReferenceChannel, type ReferenceItem } from "@/data/reference-sets";
import { STRINGS, fmt } from "@/data/strings";
import { Icon, type IconName } from "@/components/ui/icons/icon";

const E = STRINGS.editor;

/**
 * What the AI referenced: one set (face / motion / sound) per behavior in the expression.
 * `strip` = editor Context tab (Figma W02D-1 901:9964 ×2): "Reference" title + 123px thumbnails with a channel chip each.
 */
export function ReferencedSets({
  behaviors,
  variant = "list",
  keywords,
  onOpen,
  activeFile = null,
}: {
  behaviors: string[];
  /** Editor: face / motion thumbnails open in the reference player instead of the source page */
  onOpen?: (item: ReferenceItem) => void;
  activeFile?: string | null;
  variant?: "list" | "strip";
  /** Editor: one set chosen from the user's input (prompt + attachment summaries), no behavior chips; no match → the first behavior's set */
  keywords?: string;
}) {
  const byBehavior = [...new Set(behaviors)].map((b) => referenceSetFor(b)).filter((s) => s !== undefined);
  const keyed = keywords === undefined ? undefined : referenceSetForText(keywords) ?? byBehavior[0];
  const sets = keywords === undefined ? byBehavior : keyed ? [keyed] : [];
  const [pick, setPick] = useState(0);
  const set = sets[Math.min(pick, sets.length - 1)];
  const label = simBehaviorLabel;

  if (variant === "strip") {
    // Figma 452:2284: header = notes 16 · 5 · Medium 16 #6f6d6e; 123 thumbnails gap 12 running to the panel edge.
    return (
      <section className="flex w-[394px] flex-col gap-[15px]" data-testid="referenced">
        <div className="flex h-[16px] items-center gap-[5px] whitespace-nowrap text-[16px] font-medium leading-none text-[var(--library-section)]" title={E.referencedEmpty}>
          <Icon name="notes" size={16} />
          <h3>{E.reference}</h3>
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
            {/* -mr: the strip scrolls under the panel's right edge like the Figma frame (470 wide in a 430 panel) */}
            <div className="-mr-[17px] flex gap-[12px] overflow-x-auto pr-[17px] [scrollbar-width:none]">
              {set.items.map((it) => <StripItem key={it.channel} item={it} onOpen={onOpen} active={activeFile === it.file} />)}
            </div>
          </>
        )}
      </section>
    );
  }

  // Default list (user data detail, share viewer): DS type scale — label Body/S secondary, set chips S, item cards on bg/canvas.
  return (
    <section className="flex flex-col gap-[var(--space-12)]" data-testid="referenced">
      <span className="text-[13px] leading-[18px] text-[var(--text-secondary)]">{E.referencedTitle}</span>
      {!set ? (
        <p className="text-[14px] leading-[20px] text-[var(--text-tertiary)]">{E.referencedEmpty}</p>
      ) : (
        <>
          {sets.length > 1 && (
            <div className="flex flex-wrap gap-[var(--space-8)]">
              {sets.map((s, i) => (
                <button
                  key={s.behavior}
                  aria-pressed={s === set}
                  onClick={() => setPick(i)}
                  className={`flex h-[32px] items-center rounded-[var(--radius-full)] px-[var(--space-12)] text-[13px] font-medium leading-[18px] ${s === set ? "bg-[var(--bg-inverse)] text-[var(--text-on-inverse)]" : "bg-[var(--bg-canvas)] text-[var(--text-primary)]"}`}
                >
                  {label(s.behavior)}
                </button>
              ))}
            </div>
          )}
          {sets.length === 1 && <span className="text-[14px] leading-[20px] text-[var(--text-link)]">{fmt(E.referencedFor, { behavior: label(set.behavior) })}</span>}
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

/** Channel tab on a strip thumbnail (452:2309 / 2315 / 2323) */
const TAB_ICON: Record<ReferenceChannel, IconName> = { motion: "running-round", face: "smile-square", sound: "volume-loud" };
/** Sound thumbnail bars (452:2325): 20 bars, 2 wide, 4 apart */
const WAVE = [20, 34, 14, 8, 4, 14, 24, 28, 30, 26, 20, 4, 20, 26, 30, 6, 4, 10, 24, 30];
const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Strip thumbnail (452:2292): 123 square r 16 under a 34% black veil; channel tab at 12,0 (#f2f2f2, bottom corners 12,
 * icon 20); video / sound: play 13 at 12,101 and the length (Regular 12 white) at 30,100.
 */
function StripItem({ item, onOpen, active = false }: { item: ReferenceItem; onOpen?: (item: ReferenceItem) => void; active?: boolean }) {
  const video = item.file.endsWith(".webm");
  const audio = item.file.endsWith(".ogg");
  const player = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [length, setLength] = useState<number | null>(null);
  const credit = `${item.title} — ${item.note}\n${fmt(E.referenceSource, { license: item.source.license, author: item.source.author })}`;
  const onMeta = (e: React.SyntheticEvent<HTMLMediaElement>) => Number.isFinite(e.currentTarget.duration) && setLength(e.currentTarget.duration);
  const media = video ? (
    <video src={item.file} poster={item.poster ?? undefined} muted loop autoPlay playsInline onLoadedMetadata={onMeta} className="size-full object-cover" />
  ) : audio ? null : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.file} alt={item.title} className="size-full object-cover" />
  );

  return (
    <figure
      className={`relative size-[123px] shrink-0 overflow-hidden rounded-[16px] bg-[var(--neutral-800)] ${active ? "outline outline-2 -outline-offset-2 outline-[var(--border-strong)]" : ""}`}
      data-testid={`referenced-${item.channel}`}
    >
      {audio ? (
        <>
          <audio ref={player} src={item.file} onLoadedMetadata={onMeta} onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
          <button
            type="button"
            title={credit}
            aria-label={item.title}
            aria-pressed={playing}
            onClick={() => (playing ? player.current?.pause() : void player.current?.play().catch(() => {}))}
            className="absolute inset-0"
          >
            <span className="absolute left-[4px] top-[49px] flex items-center gap-[4px]" aria-hidden>
              {WAVE.map((h, i) => (
                <span key={i} className="w-[2px] bg-[var(--context-wave)]" style={{ height: h }} />
              ))}
            </span>
          </button>
        </>
      ) : onOpen ? (
        <button type="button" title={credit} aria-label={item.title} aria-pressed={active} onClick={() => onOpen(item)} className="absolute inset-0">
          {media}
        </button>
      ) : (
        <a href={item.source.page} target="_blank" rel="noreferrer" title={credit} aria-label={item.title} className="absolute inset-0">
          {media}
        </a>
      )}
      {!audio && <span className="pointer-events-none absolute inset-0 bg-[var(--context-ref-dim)]" aria-hidden />}
      <figcaption className="pointer-events-none absolute left-[12px] top-0 flex rounded-b-[12px] bg-[var(--context-card)] p-[5px] text-[var(--library-section)] shadow-[inset_0_0_20px_0_var(--neutral-0)]">
        <Icon name={TAB_ICON[item.channel]} size={20} label={E.tabs[item.channel]} />
      </figcaption>
      {(video || audio) && (
        <span className="pointer-events-none absolute left-[12px] top-[100px] flex items-center gap-[5px] text-[12px] leading-[15px] text-[var(--text-on-inverse)]">
          <Icon name={audio && playing ? "stop" : "play-glyph"} size={13} />
          {length !== null && clock(length)}
        </span>
      )}
    </figure>
  );
}

function ReferencedItem({ item }: { item: ReferenceItem }) {
  const video = item.file.endsWith(".webm");
  const audio = item.file.endsWith(".ogg");
  return (
    <figure className="flex flex-col gap-[var(--space-8)] rounded-[var(--radius-md)] bg-[var(--bg-canvas)] p-[var(--space-12)]" data-testid={`referenced-${item.channel}`}>
      <div className="flex items-center gap-[var(--space-8)]">
        <span className={`shrink-0 rounded-[var(--radius-sm)] border bg-[var(--bg-surface)] px-[var(--space-8)] py-[2px] text-[12px] leading-[16px] ${CHIP[item.channel]}`}>{E.tabs[item.channel]}</span>
        <b className="truncate text-[14px] font-medium leading-[20px] text-[var(--text-primary)]">{item.title}</b>
      </div>
      {audio ? (
        <audio src={item.file} controls className="h-[32px] w-full" />
      ) : video ? (
        <video src={item.file} poster={item.poster ?? undefined} muted loop autoPlay playsInline className="aspect-video w-full rounded-[var(--radius-xs)] object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.file} alt={item.title} className="aspect-video w-full rounded-[var(--radius-xs)] object-cover" />
      )}
      <span className="text-[13px] leading-[18px] text-[var(--text-link)]">{item.note}</span>
      <figcaption className="truncate text-[11px] leading-[14px] text-[var(--text-tertiary)]">
        <a href={item.source.page} target="_blank" rel="noreferrer" className="underline">{fmt(E.referenceSource, { license: item.source.license, author: item.source.author })}</a>
      </figcaption>
    </figure>
  );
}
