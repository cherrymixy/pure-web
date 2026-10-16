"use client";

import { useEffect, useRef, useState } from "react";
import { STRINGS, fmt } from "@/data/strings";
import { CLIP_FPS, clipToJointCommands, formatTime } from "@/lib/expression";
import { EASINGS, type Clip, type FaceSpec, type Key, type SoundSpec, type Structure } from "@/lib/models";

const T = STRINGS.editor.timeline;

export type Track = string; // joint id, "face" or "sound"
export type KeyRef = { track: Track; index: number };
type Easing = Key["easing"];

export interface TimelineProps {
  clip: Clip;
  /** Keys come from the recipe until the first edit */
  fromRecipe: boolean;
  structure: Structure;
  face: FaceSpec;
  sound: SoundSpec;
  t: number;
  playing: boolean;
  loop: boolean;
  selectedTrack: Track | null;
  selectedKey: KeyRef | null;
  onSeek: (t: number) => void;
  onTogglePlay: () => void;
  onLoop: (on: boolean) => void;
  onSelectTrack: (track: Track) => void;
  onSelectKey: (key: KeyRef | null) => void;
  onAddKey: () => void;
  /** Live while dragging (`done` false), commit on release */
  onDragKey: (key: KeyRef, t: number, done: boolean) => void;
  onApplyKey: (key: KeyRef, patch: Partial<Key>) => void;
  onDeleteKey: (key: KeyRef) => void;
  onFaceKeyFromCurrent: (index: number) => void;
}

// W02E Edit Detail: ruler + playhead, Joint Layers, Face / Sound tracks, keyframe inspector.
export function Timeline(p: TimelineProps) {
  const lanes = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ key: KeyRef | null; moved: boolean } | null>(null);
  const duration = Math.max(p.clip.duration, 0.1);
  const pct = (t: number) => `${(Math.min(Math.max(t, 0), duration) / duration) * 100}%`;

  const timeAt = (clientX: number) => {
    const box = lanes.current?.getBoundingClientRect();
    if (!box) return 0;
    return Math.min(Math.max((clientX - box.left) / box.width, 0), 1) * duration;
  };

  // Space = play / pause (not while typing).
  const toggle = useRef(p.onTogglePlay);
  toggle.current = p.onTogglePlay;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || (e.target as HTMLElement).closest("input, textarea, select, button")) return;
      e.preventDefault();
      toggle.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const t = timeAt(e.clientX);
    if (drag.key) p.onDragKey(drag.key, t, false);
    else p.onSeek(t);
    if (!drag.moved) setDrag({ ...drag, moved: true });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (drag?.key && drag.moved) p.onDragKey(drag.key, timeAt(e.clientX), true);
    setDrag(null);
  }

  const startKeyDrag = (key: KeyRef) => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    p.onSelectKey(key);
    setDrag({ key, moved: false });
  };

  /** Keys under the playhead render hollow (W02E-4 Lane › Keyframe at the playhead = bg/surface). */
  const atPlayhead = (t: number) => Math.abs(t - p.t) < 0.5 / CLIP_FPS;

  const keyMark = (key: KeyRef, t: number, shape: "diamond" | "dot" | "square") => {
    const selected = p.selectedKey?.track === key.track && p.selectedKey.index === key.index;
    const fill = selected
      ? "bg-[var(--neutral-800)]"
      : atPlayhead(t)
        ? "bg-[var(--bg-surface)]"
        : shape === "dot"
          ? "bg-[var(--web-e2a1c1)]"
          : shape === "square"
            ? "bg-[var(--web-ecc377)]"
            : "bg-[var(--sage-300)]";
    const form = shape === "diamond" ? "size-[9px] rotate-45 rounded-[var(--radius-2xs)]" : shape === "dot" ? "size-[10px] rounded-[var(--radius-full)]" : "size-[9px] rounded-[2px]";
    return (
      <button
        key={`${key.track}-${key.index}`}
        type="button"
        aria-label={`${key.track} key ${formatTime(t)}`}
        aria-pressed={selected}
        onPointerDown={startKeyDrag(key)}
        style={{ left: pct(t) }}
        className="absolute top-1/2 z-[1] flex size-[16px] -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center"
      >
        <span className={`${form} ${fill}`} />
      </button>
    );
  };

  const rows: { track: Track; label: string }[] = [
    ...p.structure.joints.map((j) => ({ track: j.id, label: j.label })),
    ...(p.structure.channels.includes("face") ? [{ track: "face", label: T.faceTrack }] : []),
    ...(p.structure.channels.includes("sound") ? [{ track: "sound", label: T.soundTrack }] : []),
  ];

  const timesOf = (track: Track): number[] => {
    if (track === "face") return (p.face.keys ?? []).map((k) => k.t);
    if (track === "sound") return p.sound.cues.map((c) => c.t);
    return (p.clip.tracks[track] ?? []).map((k) => k.t);
  };
  const keysOf = (track: Track) => {
    if (track === "face") return (p.face.keys ?? []).map((k, index) => keyMark({ track, index }, k.t, "dot"));
    if (track === "sound") return p.sound.cues.map((c, index) => keyMark({ track, index }, c.t, "square"));
    return (p.clip.tracks[track] ?? []).map((k, index) => keyMark({ track, index }, k.t, "diamond"));
  };

  // Current commanded value per joint (Track list › Meta) — sampled from the clip at the playhead.
  const pose = clipToJointCommands(p.clip, p.t, p.structure);
  const metaOf = (track: Track) => {
    if (track === "face") return p.face.preset;
    if (track === "sound") return String(p.sound.cues.length);
    const v = pose[track];
    return v === undefined ? "—" : `${v.toFixed(1)}°`;
  };

  const ticks = Array.from({ length: Math.floor(duration / 0.5) + 1 }, (_, i) => i * 0.5);
  const selKey = p.selectedKey;
  const jointKey = selKey && selKey.track !== "face" && selKey.track !== "sound" ? p.clip.tracks[selKey.track]?.[selKey.index] : undefined;

  const chip = "flex items-center gap-[var(--space-8)] rounded-[var(--radius-full)] px-[var(--space-12)] py-[var(--space-8)] text-[12px] leading-[15px] whitespace-nowrap";
  const transportBtn = "flex size-[28px] items-center justify-center rounded-[var(--radius-full)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-muted)]";
  const ROW = "h-[39px] shrink-0 rounded-[var(--radius-sm)]";

  // W02E-4 Timeline Panel (901:12348 ×2): header (title · transport · time · fps | loop · ease · + Keyframe), body (Track List 228 | Lanes).
  return (
    <section className="flex h-full min-h-0 flex-col gap-[var(--space-20)] px-[var(--space-28)] pb-[var(--space-28)] pt-[var(--space-16)]" data-testid="timeline">
      {/* Timeline Header */}
      <div className="flex shrink-0 items-center justify-between gap-[var(--space-24)]">
        <div className="flex min-w-0 items-center gap-[var(--space-24)]">
          <h2 className="text-[16px] leading-[20px] text-[var(--text-primary)]">{T.header}</h2>
          <div className="flex items-center gap-[var(--space-8)] rounded-[var(--radius-full)] bg-[var(--bg-canvas)] p-[var(--space-8)]">
            <button type="button" aria-label="Skip to start" className={transportBtn} onClick={() => p.onSeek(0)}>
              <span className="flex items-center gap-[4px]" aria-hidden>
                <span className="h-[10.5px] w-[2px] rounded-[var(--radius-full)] bg-current" />
                <span className="size-0 border-y-[4px] border-r-[7px] border-y-transparent border-r-current" />
              </span>
            </button>
            <button type="button" aria-label="Stop" className={transportBtn} onClick={() => { if (p.playing) p.onTogglePlay(); p.onSeek(0); }}>
              <span className="size-[9px] rounded-[var(--radius-2xs)] bg-[var(--bg-inverse)]" aria-hidden />
            </button>
            <button
              type="button"
              onClick={p.onTogglePlay}
              aria-label={p.playing ? STRINGS.editor.pause : STRINGS.editor.play}
              title={p.playing ? STRINGS.editor.pause : STRINGS.editor.play}
              className="flex size-[28px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--primary)] text-[var(--bg-canvas)]"
            >
              {p.playing ? (
                <span className="flex gap-[3px]" aria-hidden>
                  <span className="h-[9px] w-[3px] rounded-[1px] bg-current" />
                  <span className="h-[9px] w-[3px] rounded-[1px] bg-current" />
                </span>
              ) : (
                <span className="ml-[2px] size-0 border-y-[4.5px] border-l-[8px] border-y-transparent border-l-current" aria-hidden />
              )}
            </button>
            <button type="button" aria-label="Skip to end" className={transportBtn} onClick={() => p.onSeek(duration)}>
              <span className="flex items-center gap-[4px]" aria-hidden>
                <span className="size-0 border-y-[4px] border-l-[7px] border-y-transparent border-l-current" />
                <span className="h-[10.5px] w-[2px] rounded-[var(--radius-full)] bg-current" />
              </span>
            </button>
          </div>
          <span className="flex items-center gap-[var(--space-8)] whitespace-pre text-[16px] leading-[20px] tabular-nums" data-testid="timeline-time">
            <span className="text-[var(--sage-300)]">{formatTime(p.t)}</span>
            <span className="text-[var(--neutral-500)]">{`/  ${formatTime(duration)}`}</span>
          </span>
          <span className={`${chip} bg-[var(--bg-surface-muted)] tabular-nums text-[var(--text-primary)]`}>
            {fmt(T.frame, { n: Math.round(p.t * CLIP_FPS) })} · {T.fps}
          </span>
          {p.fromRecipe && <span className="min-w-0 truncate text-[12px] leading-[15px] text-[var(--text-tertiary)]">{T.recipeNote}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-[var(--space-8)]">
          <button
            type="button"
            aria-pressed={p.loop}
            onClick={() => p.onLoop(!p.loop)}
            className={`${chip} ${p.loop ? "bg-[var(--sage-300)] text-[var(--neutral-950)]" : "bg-[var(--bg-surface-muted)] text-[var(--text-primary)]"}`}
          >
            {T.loop}
          </button>
          <label className={`${chip} relative bg-[var(--bg-surface-muted)] text-[var(--text-primary)] ${jointKey ? "" : "opacity-40"}`}>
            <span>{T.ease}:</span>
            <select
              disabled={!jointKey}
              value={jointKey?.easing ?? "ease_in_out"}
              onChange={(e) => selKey && p.onApplyKey(selKey, { easing: e.target.value as Easing })}
              aria-label={T.ease}
              className="-ml-[var(--space-4)] appearance-none bg-transparent text-[12px] leading-[15px] text-[var(--text-primary)] outline-none disabled:cursor-not-allowed"
            >
              {EASINGS.map((e) => <option key={e} value={e}>{T.easings[e]}</option>)}
            </select>
          </label>
          <button
            type="button"
            disabled={!p.selectedTrack || p.selectedTrack === "sound"}
            onClick={p.onAddKey}
            className={`${chip} bg-[var(--sage-300)] text-[var(--neutral-950)] disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {T.addKey}
          </button>
        </div>
      </div>

      {/* Timeline Body: one scroll box so the layer names and lanes stay row-aligned */}
      <div className="flex min-h-0 flex-1 gap-[var(--space-16)]">
        <div className="flex min-h-0 min-w-0 flex-1 gap-[var(--space-16)] overflow-y-auto" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={() => setDrag(null)}>
          {/* Track List 228 */}
          <div className="flex w-[228px] shrink-0 flex-col gap-[var(--space-8)]">
            <div className="sticky top-0 z-[3] flex h-[25px] shrink-0 items-center justify-between bg-[var(--bg-surface)] pl-[var(--space-12)] text-[12px] leading-[15px] text-[var(--neutral-500)]">
              <span>{T.layers}</span>
              <span>{T.layerValue}</span>
            </div>
            {rows.map((r, i) => {
              const sel = p.selectedTrack === r.track;
              const keyHere = timesOf(r.track).some(atPlayhead);
              return (
                <button
                  key={r.track}
                  type="button"
                  aria-pressed={sel}
                  onClick={() => p.onSelectTrack(r.track)}
                  className={`${ROW} flex w-full items-center justify-between gap-[var(--space-8)] px-[var(--space-12)] text-left ${sel ? "bg-[var(--sage-100)]" : "bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-muted)]"}`}
                >
                  <span className="flex min-w-0 items-center gap-[var(--space-8)] text-[14px] leading-[18px]">
                    <span className="size-[5px] shrink-0 rounded-[var(--radius-full)] bg-[var(--sage-300)]" aria-hidden />
                    <span className="text-[var(--neutral-500)]">{i + 1}</span>
                    <span className="truncate text-[var(--text-primary)]">{r.label}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-[var(--space-8)]">
                    <span className="text-[12px] leading-[15px] tabular-nums text-[var(--neutral-500)]">{metaOf(r.track)}</span>
                    <span className={`size-[8px] rotate-45 rounded-[2px] ${keyHere ? "bg-[var(--sage-300)]" : "border border-[var(--sage-300)]"}`} aria-hidden />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Lanes */}
          <div ref={lanes} className="relative flex min-w-0 flex-1 select-none flex-col gap-[var(--space-8)]">
            <div
              className="sticky top-0 z-[3] h-[25px] shrink-0 cursor-ew-resize bg-[var(--bg-surface)]"
              onPointerDown={(e) => {
                (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                p.onSeek(timeAt(e.clientX));
                setDrag({ key: null, moved: false });
              }}
            >
              {ticks.map((t) => {
                const major = Number.isInteger(t);
                return (
                  <span key={t} className="absolute top-0 h-full" style={{ left: pct(t) }}>
                    {major && (
                      <span className={`absolute top-0 whitespace-nowrap text-[10px] leading-[13px] text-[var(--neutral-500)] ${t === 0 ? "" : "-translate-x-1/2"}`}>{t}s</span>
                    )}
                    <span className={`absolute left-0 w-px bg-[var(--bg-disabled)] ${major ? "top-[16px] h-[9px]" : "top-[19px] h-[6px]"}`} />
                  </span>
                );
              })}
              <span className="absolute inset-x-0 bottom-0 h-px bg-[var(--sage-100)]" />
            </div>
            {rows.map((r) => {
              const times = timesOf(r.track);
              const lo = times.length ? Math.min(...times) : 0;
              const hi = times.length ? Math.max(...times) : 0;
              return (
                <div
                  key={r.track}
                  className={`${ROW} relative ${p.selectedTrack === r.track ? "bg-[var(--sage-50)]" : "bg-[var(--bg-canvas)]"}`}
                  onPointerDown={() => p.onSelectTrack(r.track)}
                >
                  {times.length > 1 && r.track !== "face" && r.track !== "sound" && (
                    <span
                      className="absolute top-1/2 h-[19px] -translate-y-1/2 rounded-[var(--radius-xs)] border border-[var(--sage-300)] bg-[color-mix(in_srgb,var(--sage-300)_30%,transparent)]"
                      style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }}
                      aria-hidden
                    />
                  )}
                  {keysOf(r.track)}
                </div>
              );
            })}
            {/* Playhead: 2px sage/300 line + head */}
            <div className="pointer-events-none absolute inset-y-0 z-[4] w-[12px] -translate-x-1/2" style={{ left: pct(p.t) }} data-testid="playhead">
              <span className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-[var(--sage-300)]" />
              <span className="absolute left-1/2 top-0 size-0 -translate-x-1/2 border-x-[5.5px] border-t-[8px] border-x-transparent border-t-[var(--sage-300)]" />
            </div>
          </div>
        </div>

        <Inspector {...p} jointKey={jointKey} />
      </div>
    </section>
  );
}

function Inspector(p: TimelineProps & { jointKey: Key | undefined }) {
  const sel = p.selectedKey;
  const joint = sel ? p.structure.joints.find((j) => j.id === sel.track) : undefined;
  const faceKey = sel?.track === "face" ? p.face.keys?.[sel.index] : undefined;
  const cue = sel?.track === "sound" ? p.sound.cues[sel.index] : undefined;
  const keyT = p.jointKey?.t ?? faceKey?.t ?? cue?.t;
  const [t, setT] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    setT(keyT === undefined ? "" : keyT.toFixed(3));
    setValue(p.jointKey ? p.jointKey.value.toFixed(1) : "");
  }, [keyT, p.jointKey, sel?.track, sel?.index]);

  const box = "flex w-[280px] shrink-0 flex-col gap-[var(--space-12)] self-start rounded-[var(--radius-lg)] bg-[var(--bg-canvas)] px-[var(--space-20)] py-[var(--space-16)]";
  const field = "w-[112px] rounded-[var(--radius-xs)] bg-[var(--bg-surface)] px-[var(--space-8)] py-[var(--space-4)] text-right text-[14px] leading-[18px] tabular-nums text-[var(--text-primary)] outline-none";
  const label = "text-[14px] leading-[18px] text-[var(--text-secondary)]";
  const btn = "flex-1 rounded-[var(--radius-full)] px-[var(--space-12)] py-[var(--space-8)] text-[12px] leading-[15px]";

  if (!sel || keyT === undefined) return <aside className={`${box} text-[14px] leading-[18px] text-[var(--text-secondary)]`}>{T.pickKey}</aside>;

  const v = Number(value);
  const outOfRange = !!joint && (!Number.isFinite(v) || v < joint.min || v > joint.max);
  return (
    <aside className={box} data-testid="inspector">
      <h3 className="text-[16px] leading-[20px] text-[var(--text-primary)]">{T.inspector} · {joint?.label ?? (sel.track === "face" ? T.faceTrack : T.soundTrack)}</h3>
      <label className="flex items-center justify-between gap-[var(--space-8)]">
        <span className={label}>{T.time}</span>
        <input type="number" step={1 / CLIP_FPS} min={0} max={p.clip.duration} value={t} onChange={(e) => setT(e.target.value)} className={field} />
      </label>
      {joint && (
        <>
          <label className="flex items-center justify-between gap-[var(--space-8)]">
            <span className={label}>{T.value}</span>
            <input
              type="number"
              step={0.5}
              min={joint.min}
              max={joint.max}
              value={value}
              aria-invalid={outOfRange}
              onChange={(e) => setValue(e.target.value)}
              className={`${field} ${outOfRange ? "text-[var(--text-error)] outline outline-1 outline-[var(--border-error)]" : ""}`}
            />
          </label>
          <span className={`text-[12px] leading-[15px] ${outOfRange ? "text-[var(--text-error)]" : "text-[var(--text-tertiary)]"}`}>{fmt(T.range, { min: joint.min, max: joint.max })}</span>
        </>
      )}
      {faceKey && (
        <button type="button" className={`${btn} bg-[var(--bg-surface-muted)] text-[var(--text-primary)]`} onClick={() => p.onFaceKeyFromCurrent(sel.index)}>{T.fromFace}</button>
      )}
      <div className="flex gap-[var(--space-8)]">
        <button
          type="button"
          className={`${btn} bg-[var(--sage-300)] text-[var(--neutral-950)] disabled:cursor-not-allowed disabled:opacity-40`}
          disabled={outOfRange || !Number.isFinite(Number(t))}
          onClick={() => p.onApplyKey(sel, joint ? { t: Number(t), value: v } : { t: Number(t) })}
        >
          {T.apply}
        </button>
        <button type="button" className={`${btn} bg-[var(--bg-surface)] text-[var(--text-error)]`} onClick={() => p.onDeleteKey(sel)}>{T.delete}</button>
      </div>
    </aside>
  );
}
