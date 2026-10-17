"use client";

import { useEffect, useRef } from "react";
import type { SimController } from "@/components/sim/sim-controller";
import { Viewport } from "@/components/sim/Viewport";

// W00-1 hero robot: the live PURE Desk sim in place of the Figma render; the head turns toward the pointer.
// Gaze = joint commands through the controller contract (debugCommand): left/right is shared between base yaw and
// head pan, up/down goes to head tilt; the joints' position servos do the easing. Pointer gone → back to rest.
// Commands go out at most every COMMAND_MS: each one restarts the sim clock, so per-frame calls would freeze the physics.
const YAW_MAX = 40; // degrees at the viewport edge
const TILT_MAX = 22;
const YAW_SPLIT = 0.55; // base_yaw share; the rest is head_pan
const COMMAND_MS = 120;
const FACE_VIEWER = -36; // yaw (degrees) at which the screen faces the hero camera — pointer in the middle = eye contact

export function HeroRobot({ className, label }: { className?: string; label: string }) {
  const ctrl = useRef<SimController | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = { yaw: 0, tilt: 0 };
    const sent = { yaw: NaN, tilt: NaN }; // NaN: the first tick turns the robot to face the viewer
    let ready = false;
    let timer = 0;

    const onMove = (e: PointerEvent) => {
      const r = box.current?.getBoundingClientRect();
      if (!r) return;
      // From the robot's head (upper third of the box) to the pointer, normalised by the window.
      const dx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      const dy = (e.clientY - (r.top + r.height * 0.3)) / (window.innerHeight / 2);
      target.yaw = Math.max(-1, Math.min(1, dx)) * YAW_MAX;
      target.tilt = Math.max(-1, Math.min(1, dy)) * TILT_MAX;
    };
    const onLeave = () => {
      target.yaw = 0;
      target.tilt = 0;
    };

    const tick = () => {
      if (!ready || !ctrl.current) return;
      if (Math.abs(target.yaw - sent.yaw) < 0.5 && Math.abs(target.tilt - sent.tilt) < 0.5) return;
      sent.yaw = target.yaw;
      sent.tilt = target.tilt;
      ctrl.current.debugCommand({
        base_yaw: (FACE_VIEWER + sent.yaw) * YAW_SPLIT,
        head_pan: (FACE_VIEWER + sent.yaw) * (1 - YAW_SPLIT),
        head_tilt: -sent.tilt,
      });
    };

    ctrl.current?.ready.then(() => (ready = true), () => {});
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    if (!reduce) timer = window.setInterval(tick, COMMAND_MS);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    // The stage blends into the hero background: floor/grid in the hero's floor tone, edges faded out with a mask.
    // The landing is CSS-zoomed (×2–3); the inner box undoes that zoom so the canvas renders at screen resolution.
    <div ref={box} role="img" aria-label={label} className={`${className ?? ""} [--sim-floor:var(--neutral-0)] [--sim-grid-major:var(--neutral-0)] [--sim-grid-minor:var(--neutral-0)] [--sim-stage:var(--neutral-50)] [mask-image:radial-gradient(ellipse_42%_46%_at_50%_58%,black_45%,transparent_100%)]`}>
      <div className="size-full [zoom:var(--landing-unzoom,1)]">
        <Viewport controllerRef={ctrl} mode="structure" orbit={false} className="block size-full" />
      </div>
    </div>
  );
}
