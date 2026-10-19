"use client";

import { useEffect, useRef, useState } from "react";
import { STRINGS } from "@/data/strings";
import type { Reference } from "@/lib/models";
import { fileUrl } from "@/lib/ui/upload";
import { Button } from "@/components/ui/button";

const SY = STRINGS.editor.sync;

/**
 * W02E reference sync: the video follows the playhead, stretched to the motion's length
 * (the same mapping Match timing uses), so peaks line up visually.
 */
export function ReferencePlayer({
  reference,
  t,
  duration,
  playing,
  side,
  busy,
  onSide,
  onMatch,
  onClose,
  label = null,
}: {
  reference: Reference;
  t: number;
  duration: number;
  playing: boolean;
  side: boolean;
  busy: boolean;
  onSide: (on: boolean) => void;
  onMatch: () => void;
  onClose: () => void;
  /** Caption name; null = the uploaded file's name */
  label?: string | null;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const isVideo = reference.kind === "video";
  // Referenced-set items are public files ("/reference-sets/…"); uploads go through /api/files.
  const src = reference.path.startsWith("/") ? reference.path : fileUrl(reference.path);
  const name = label ?? reference.path.split("/").pop()?.replace(/^[0-9a-f]{8}-/, "") ?? "";
  const [clock, setClock] = useState({ t: 0, d: 0 });

  useEffect(() => {
    const v = video.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0 || !(duration > 0) || !Number.isFinite(duration)) return;
    const target = Math.min((t / duration) * v.duration, v.duration);
    v.playbackRate = Math.min(Math.max(v.duration / duration, 0.25), 4);
    if (playing) {
      if (v.paused) void v.play().catch(() => {});
      if (Math.abs(v.currentTime - target) > 0.25) v.currentTime = target;
    } else {
      if (!v.paused) v.pause();
      if (Math.abs(v.currentTime - target) > 0.04) v.currentTime = target;
    }
  }, [t, duration, playing]);

  return (
    <div
      className={`flex flex-col gap-[var(--space-12)] bg-[var(--bg-surface)] ${side ? "h-full p-[var(--space-16)]" : "w-[420px] rounded-[var(--radius-xl)] p-[var(--space-16)] shadow-[var(--pure-shadow-modal)]"}`}
      data-testid="reference-player"
    >
      <div className={`overflow-hidden rounded-[var(--radius-md)] bg-[var(--neutral-800)] ${side ? "min-h-0 flex-1" : "aspect-video"}`}>
        {isVideo ? (
          <video
            ref={video}
            src={src}
            muted
            playsInline
            preload="auto"
            className="h-full w-full object-contain"
            onLoadedMetadata={(e) => setClock({ t: e.currentTarget.currentTime, d: e.currentTarget.duration })}
            onTimeUpdate={(e) => setClock({ t: e.currentTarget.currentTime, d: e.currentTarget.duration })}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-full w-full object-contain" />
        )}
      </div>
      <div className="flex items-center gap-[var(--space-8)] text-[14px] leading-[18px] text-[var(--text-tertiary)]">
        <span className="min-w-0 truncate">{name}</span>
        {isVideo && Number.isFinite(clock.d) && clock.d > 0 && <span className="shrink-0">· {stamp(clock.t, true)} / {stamp(clock.d)}</span>}
        <button aria-label={SY.close} className="ml-auto shrink-0 px-[var(--space-4)] text-[18px] leading-none hover:text-[var(--text-primary)]" onClick={onClose}>×</button>
      </div>
      <div className="flex flex-wrap items-center gap-[var(--space-8)]">
        <Button onClick={() => onSide(!side)}>{side ? SY.overlay : SY.sideBySide}</Button>
        <Button variant="primary" disabled={busy || !isVideo || !reference.frames?.length || reference.status !== "ok"} title={isVideo ? undefined : SY.needsVideo} onClick={onMatch}>
          {SY.matchTiming}
        </Button>
      </div>
    </div>
  );
}

/** 00:07 / 00:01.25 */
function stamp(sec: number, cents = false): string {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = cents ? (sec % 60).toFixed(2).padStart(5, "0") : String(Math.round(sec % 60)).padStart(2, "0");
  return `${m}:${s}`;
}
