"use client";

import { useEffect, useRef, useState } from "react";
import { STRINGS, fmt } from "@/data/strings";
import { CLIP_FPS, formatTime } from "@/lib/expression";
import { EASINGS, type Clip, type FaceSpec, type Key, type SoundSpec, type Structure } from "@/lib/models";
import { Button } from "@/components/ui/button";

const T = STRINGS.editor.timeline;
const LABEL_W = 140;
const ROW_H = 28;

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

  const diamond = (key: KeyRef, t: number, extra = "") => {
    const selected = p.selectedKey?.track === key.track && p.selectedKey.index === key.index;
    return (
      <button
        key={`${key.track}-${key.index}`}
        aria-label={`${key.track} key ${formatTime(t)}`}
        onPointerDown={startKeyDrag(key)}
        style={{ left: pct(t) }}
        className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border ${selected ? "border-neutral-900 bg-neutral-900" : "border-neutral-600 bg-white"} ${extra}`}
      />
    );
  };

  const rows: { track: Track; label: string }[] = [
    ...p.structure.joints.map((j) => ({ track: j.id, label: j.label })),
    ...(p.structure.channels.includes("face") ? [{ track: "face", label: T.faceTrack }] : []),
    ...(p.structure.channels.includes("sound") ? [{ track: "sound", label: T.soundTrack }] : []),
  ];

  const keysOf = (track: Track) => {
    if (track === "face") return (p.face.keys ?? []).map((k, index) => diamond({ track, index }, k.t, "rounded-full rotate-0"));
    if (track === "sound") return p.sound.cues.map((c, index) => diamond({ track, index }, c.t, "rotate-0 rounded-sm"));
    return (p.clip.tracks[track] ?? []).map((k, index) => diamond({ track, index }, k.t));
  };

  const ticks = Array.from({ length: Math.floor(duration / 0.5) + 1 }, (_, i) => i * 0.5);
  const selKey = p.selectedKey;
  const jointKey = selKey && selKey.track !== "face" && selKey.track !== "sound" ? p.clip.tracks[selKey.track]?.[selKey.index] : undefined;

  return (
    <section className="col-span-3 grid grid-cols-[1fr_240px] border-t border-neutral-200 text-sm" data-testid="timeline">
      <div className="flex min-w-0 flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-neutral-200 px-3 py-1.5">
          <b>{T.title}</b>
          <span className="font-mono" data-testid="timeline-time">{formatTime(p.t)} / {formatTime(duration)}</span>
          <span className="font-mono text-xs text-neutral-500">{fmt(T.frame, { n: Math.round(p.t * CLIP_FPS) })} · {T.fps}</span>
          <Button onClick={p.onTogglePlay}>{p.playing ? STRINGS.editor.pause : STRINGS.editor.play}</Button>
          <Button variant={p.loop ? "primary" : "default"} onClick={() => p.onLoop(!p.loop)}>{T.loop}</Button>
          <label className="flex items-center gap-1">
            <span className="text-xs text-neutral-500">{T.ease}</span>
            <select
              disabled={!jointKey}
              value={jointKey?.easing ?? "ease_in_out"}
              onChange={(e) => selKey && p.onApplyKey(selKey, { easing: e.target.value as Easing })}
              className="rounded border border-neutral-300 px-1 py-0.5 text-xs disabled:opacity-40"
            >
              {EASINGS.map((e) => <option key={e} value={e}>{T.easings[e]}</option>)}
            </select>
          </label>
          <Button disabled={!p.selectedTrack || p.selectedTrack === "sound"} onClick={p.onAddKey}>{T.addKey}</Button>
          {p.fromRecipe && <span className="truncate text-xs text-neutral-400">{T.recipeNote}</span>}
        </div>

        <div className="flex max-h-64 overflow-y-auto" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={() => setDrag(null)}>
          {/* Layer names */}
          <div className="shrink-0 border-r border-neutral-200" style={{ width: LABEL_W }}>
            <div className="px-2 text-xs text-neutral-500" style={{ height: ROW_H, lineHeight: `${ROW_H}px` }}>{T.layers}</div>
            {rows.map((r) => (
              <button
                key={r.track}
                onClick={() => p.onSelectTrack(r.track)}
                className={`block w-full truncate px-2 text-left ${p.selectedTrack === r.track ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`}
                style={{ height: ROW_H }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Lanes */}
          <div ref={lanes} className="relative min-w-0 flex-1 select-none">
            <div
              className="relative cursor-ew-resize border-b border-neutral-200 bg-neutral-50"
              style={{ height: ROW_H }}
              onPointerDown={(e) => {
                (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
                p.onSeek(timeAt(e.clientX));
                setDrag({ key: null, moved: false });
              }}
            >
              {ticks.map((t) => (
                <span key={t} className="absolute top-0 h-full border-l border-neutral-300 pl-0.5 font-mono text-[10px] text-neutral-500" style={{ left: pct(t) }}>
                  {Number.isInteger(t) ? `${t}s` : ""}
                </span>
              ))}
            </div>
            {rows.map((r) => (
              <div
                key={r.track}
                className={`relative border-b border-neutral-100 ${p.selectedTrack === r.track ? "bg-neutral-50" : ""}`}
                style={{ height: ROW_H }}
                onPointerDown={() => p.onSelectTrack(r.track)}
              >
                {keysOf(r.track)}
              </div>
            ))}
            <div className="pointer-events-none absolute inset-y-0 w-px bg-red-500" style={{ left: pct(p.t) }} data-testid="playhead" />
          </div>
        </div>
      </div>

      <Inspector {...p} jointKey={jointKey} />
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

  if (!sel || keyT === undefined) return <aside className="border-l border-neutral-200 p-3 text-xs text-neutral-500">{T.pickKey}</aside>;

  const v = Number(value);
  const outOfRange = !!joint && (!Number.isFinite(v) || v < joint.min || v > joint.max);
  return (
    <aside className="flex flex-col gap-2 border-l border-neutral-200 p-3" data-testid="inspector">
      <b>{T.inspector} · {joint?.label ?? (sel.track === "face" ? T.faceTrack : T.soundTrack)}</b>
      <label className="flex items-center justify-between gap-2">
        <span className="text-xs text-neutral-500">{T.time}</span>
        <input type="number" step={1 / CLIP_FPS} min={0} max={p.clip.duration} value={t} onChange={(e) => setT(e.target.value)} className="w-24 rounded border border-neutral-300 px-1 py-0.5 font-mono" />
      </label>
      {joint && (
        <>
          <label className="flex items-center justify-between gap-2">
            <span className="text-xs text-neutral-500">{T.value}</span>
            <input
              type="number"
              step={0.5}
              min={joint.min}
              max={joint.max}
              value={value}
              aria-invalid={outOfRange}
              onChange={(e) => setValue(e.target.value)}
              className={`w-24 rounded border px-1 py-0.5 font-mono ${outOfRange ? "border-red-500 text-red-600" : "border-neutral-300"}`}
            />
          </label>
          <span className="text-xs text-neutral-400">{fmt(T.range, { min: joint.min, max: joint.max })}</span>
        </>
      )}
      {faceKey && <Button onClick={() => p.onFaceKeyFromCurrent(sel.index)}>{T.fromFace}</Button>}
      <div className="flex gap-2">
        <Button
          variant="primary"
          disabled={outOfRange || !Number.isFinite(Number(t))}
          onClick={() => p.onApplyKey(sel, joint ? { t: Number(t), value: v } : { t: Number(t) })}
        >
          {T.apply}
        </Button>
        <Button variant="danger" onClick={() => p.onDeleteKey(sel)}>{T.delete}</Button>
      </div>
    </aside>
  );
}
