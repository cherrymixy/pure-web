"use client";

import { useEffect, useRef } from "react";
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
}) {
  const video = useRef<HTMLVideoElement>(null);
  const isVideo = reference.kind === "video";

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
    <div className={`flex flex-col gap-1.5 bg-white ${side ? "h-full p-2" : "w-72 rounded border border-neutral-300 p-1.5 shadow"}`} data-testid="reference-player">
      <div className={`overflow-hidden rounded bg-black ${side ? "min-h-0 flex-1" : "aspect-video"}`}>
        {isVideo ? (
          <video ref={video} src={fileUrl(reference.path)} muted playsInline preload="auto" className="h-full w-full object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(reference.path)} alt="" className="h-full w-full object-contain" />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <Button variant={side ? "primary" : "default"} onClick={() => onSide(!side)}>{side ? SY.overlay : SY.sideBySide}</Button>
        <Button disabled={busy || !isVideo || !reference.frames?.length || reference.status !== "ok"} title={isVideo ? undefined : SY.needsVideo} onClick={onMatch}>
          {SY.matchTiming}
        </Button>
        <button aria-label={SY.close} className="ml-auto px-1 text-neutral-500 hover:text-neutral-900" onClick={onClose}>×</button>
      </div>
    </div>
  );
}
