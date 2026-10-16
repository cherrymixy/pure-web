"use client";

/** W02D Reference: video ≤ 30 s → 8 evenly spaced JPEG frames, read in the browser (<video> + canvas). */
export const MAX_VIDEO_SECONDS = 30;
export const FRAME_COUNT = 8;
const FRAME_MAX_PX = 512;

export class ReferenceError extends Error {
  constructor(readonly code: "TOO_LONG" | "UNREADABLE", message: string) {
    super(message);
  }
}

/** Frame times centred in 8 equal slices, so the first and last frames aren't black fades. */
export function frameTimes(duration: number, count = FRAME_COUNT): number[] {
  return Array.from({ length: count }, (_, i) => ((i + 0.5) / count) * duration);
}

function once(el: HTMLMediaElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ok = () => { cleanup(); resolve(); };
    const fail = () => { cleanup(); reject(new ReferenceError("UNREADABLE", "This video can't be decoded")); };
    const cleanup = () => { el.removeEventListener(event, ok); el.removeEventListener("error", fail); };
    el.addEventListener(event, ok, { once: true });
    el.addEventListener("error", fail, { once: true });
  });
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new ReferenceError("UNREADABLE", "Frame capture failed"))), "image/jpeg", 0.8));
}

export async function extractFrames(file: File): Promise<{ duration: number; frames: Blob[] }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "auto";
  video.src = url;
  try {
    await once(video, "loadedmetadata");
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) throw new ReferenceError("UNREADABLE", "Unknown video length");
    if (duration > MAX_VIDEO_SECONDS) throw new ReferenceError("TOO_LONG", `Videos must be ${MAX_VIDEO_SECONDS}s or shorter`);
    const scale = Math.min(1, FRAME_MAX_PX / Math.max(video.videoWidth, video.videoHeight, 1));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new ReferenceError("UNREADABLE", "2D canvas unavailable");
    const frames: Blob[] = [];
    for (const t of frameTimes(duration)) {
      video.currentTime = t;
      await once(video, "seeked");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(await toJpeg(canvas));
    }
    return { duration, frames };
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
  }
}

/** Load frame images and read them as small RGBA buffers (for diffEnergy). */
export async function readFramePixels(urls: string[], size = 64): Promise<Uint8ClampedArray[]> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new ReferenceError("UNREADABLE", "2D canvas unavailable");
  const out: Uint8ClampedArray[] = [];
  for (const url of urls) {
    const img = new Image();
    img.src = url;
    await img.decode().catch(() => {
      throw new ReferenceError("UNREADABLE", "A reference frame couldn't be loaded");
    });
    ctx.drawImage(img, 0, 0, size, size);
    out.push(ctx.getImageData(0, 0, size, size).data);
  }
  return out;
}
