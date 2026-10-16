"use client";

/**
 * <Viewport> — the one React entry point to the simulator. One instance per page
 * (10MB wasm); card thumbnails use controller.capture() PNGs instead.
 */

import { useEffect, useRef, type RefObject } from "react";
import type { Clip, FaceSpec, Recipe, SoundSpec, Structure } from "@/lib/models";
import { SimController, type JointState, type PlaybackParams, type SimEventMap, type SoundEngine } from "./sim-controller";

export type ViewportMode = "editor" | "structure" | "preview" | "share";

/** Structural subset of Expression (lib/models.ts, STEP 4) the viewport can play. */
export interface PlayableExpression {
  motion: { mode: "recipe" | "clip"; recipe: Recipe; clip?: Clip };
  face?: FaceSpec;
  sound?: SoundSpec;
}

export type ViewportEvent =
  | { type: "ready" }
  | { type: "playing"; name: string }
  | { type: "ended"; name: string }
  | { type: "tick"; t: number; duration: number }
  | ({ type: "limitExceeded" } & SimEventMap["limitExceeded"])
  | { type: "jointState"; joints: JointState[] }
  | { type: "error"; message: string };

const MODES: Record<ViewportMode, { pan: boolean; zoom: boolean; idle: boolean }> = {
  editor: { pan: true, zoom: true, idle: true },
  structure: { pan: false, zoom: true, idle: false },
  preview: { pan: false, zoom: false, idle: true },
  share: { pan: false, zoom: false, idle: true },
};

let mounted = 0;

export interface ViewportProps {
  controllerRef?: RefObject<SimController | null>;
  structure?: Structure;
  signatureParams?: PlaybackParams;
  expression?: PlayableExpression;
  mode?: ViewportMode;
  orbit?: boolean;
  /** Start playing when `expression` changes (default false: cued at t = 0, paused). */
  autoPlay?: boolean;
  sound?: SoundEngine;
  onEvent?: (e: ViewportEvent) => void;
  className?: string;
}

export function Viewport({
  controllerRef,
  structure,
  signatureParams,
  expression,
  mode = "editor",
  orbit = true,
  autoPlay = false,
  sound,
  onEvent,
  className,
}: ViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctrlRef = useRef<SimController | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const soundRef = useRef(sound);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    mounted += 1;
    if (mounted > 1 && process.env.NODE_ENV !== "production") {
      console.error(`[Viewport] ${mounted} instances mounted — one per page (CLAUDE.md rule 14).`);
    }
    const ctrl = new SimController(canvas, { sound: soundRef.current, idle: MODES[mode].idle });
    ctrlRef.current = ctrl;
    if (controllerRef) controllerRef.current = ctrl;

    const send = (e: ViewportEvent) => onEventRef.current?.(e);
    const offs = [
      ctrl.on("ready", () => send({ type: "ready" })),
      ctrl.on("playing", (p) => send({ type: "playing", ...p })),
      ctrl.on("ended", (p) => send({ type: "ended", ...p })),
      ctrl.on("tick", (p) => send({ type: "tick", ...p })),
      ctrl.on("limitExceeded", (p) => send({ type: "limitExceeded", ...p })),
      ctrl.on("jointState", (joints) => send({ type: "jointState", joints })),
      ctrl.on("error", (p) => send({ type: "error", ...p })),
    ];
    ctrl.ready.catch(() => {});

    const ro = new ResizeObserver(([entry]) => ctrl.resize(entry.contentRect.width, entry.contentRect.height));
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      offs.forEach((off) => off());
      ctrl.dispose();
      ctrlRef.current = null;
      if (controllerRef) controllerRef.current = null;
      mounted -= 1;
    };
    // The controller lives for the component's lifetime; mode/props are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = MODES[mode];
    ctrlRef.current?.enableOrbit(orbit, { pan: m.pan, zoom: m.zoom });
    ctrlRef.current?.setIdle({ on: m.idle });
  }, [mode, orbit]);

  useEffect(() => {
    if (structure) ctrlRef.current?.load(structure);
  }, [structure]);

  useEffect(() => {
    if (signatureParams) ctrlRef.current?.setParams(signatureParams);
  }, [signatureParams]);

  useEffect(() => {
    const ctrl = ctrlRef.current;
    if (!ctrl || !expression) return;
    let cancelled = false;
    // Playback needs the model; face/sound can be set right away.
    if (expression.face) ctrl.setFace(expression.face);
    ctrl.setSound(expression.sound ?? null);
    ctrl.ready.then(() => {
      if (cancelled) return;
      const { motion } = expression;
      if (motion.mode === "clip" && motion.clip) ctrl.playClip(motion.clip, undefined, { autoplay: autoPlay });
      else ctrl.playRecipe(motion.recipe, undefined, { autoplay: autoPlay });
    }, () => {});
    return () => {
      cancelled = true;
    };
  }, [expression, autoPlay]);

  return <canvas ref={canvasRef} className={className} />;
}
