"use client";

import { useEffect, useRef } from "react";
import type { SimController } from "@/components/sim/sim-controller";
import { Viewport } from "@/components/sim/Viewport";

// W00-1 hero robot: the live PURE Desk sim in place of the Figma render; it turns toward the pointer.
// Gaze = joint commands through the controller contract (debugCommand); the joints' position servos do the easing.
// Left/right: the angle to the pointer as if the viewer sat DEPTH in front of the screen (edge ≈ 70°). The head leads
// (head_pan up to HEAD_LEAD), anything past that turns the body (base_yaw) — far side = the whole robot turns.
// Up/down goes to head tilt. Pointer gone → back to eye contact.
// Commands go out at most every COMMAND_MS: each one restarts the sim clock, so per-frame calls would freeze the physics.
const DEPTH = 0.35; // × window width
const HEAD_LEAD = 25; // degrees the head turns before the body follows
const TILT_MAX = 22;
const COMMAND_MS = 120;
// At rest (pointer in the middle) the robot looks just past the camera (base_yaw + head_pan = −50°; −36° = eye contact). The body stands side-on
// and the head turns to the viewer (Figma 950:2872).
const REST = { base_yaw: -80, head_pan: 30 };

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
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = (e.clientY - (r.top + r.height * 0.3)) / (window.innerHeight / 2);
      target.yaw = (Math.atan2(dx, window.innerWidth * DEPTH) * 180) / Math.PI;
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
      const head = Math.max(-HEAD_LEAD, Math.min(HEAD_LEAD, sent.yaw));
      ctrl.current.debugCommand({
        base_yaw: REST.base_yaw + (sent.yaw - head),
        head_pan: REST.head_pan + head,
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
    <div ref={box} role="img" aria-label={label} className={`${className ?? ""} [--sim-floor:var(--neutral-0)] [--sim-grid-major:none] [--sim-grid-minor:none] [--sim-stage:var(--neutral-50)] [mask-image:radial-gradient(ellipse_42%_46%_at_50%_58%,black_45%,transparent_100%)]`}>
      <div className="size-full [zoom:var(--landing-unzoom,1)]">
        <Viewport controllerRef={ctrl} mode="structure" orbit={false} className="block size-full" />
      </div>
    </div>
  );
}
