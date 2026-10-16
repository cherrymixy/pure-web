"use client";

import { useEffect, useRef } from "react";

// The W00-1 prototype is drawn at half size (960 wide = 1920 target). The landing is built in Figma's
// 960-unit coordinates and scaled with CSS zoom = viewport width / 960 (default 2, clamped 1.5–2.5).
const BASE = 960;
const clamp = (v: number) => Math.min(2.5, Math.max(1.5, v));

export function LandingZoom({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = () => ref.current?.style.setProperty("--landing-zoom", String(clamp(document.documentElement.clientWidth / BASE)));
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return (
    <div ref={ref} className="flex justify-center overflow-x-clip bg-[var(--bg-canvas)]">
      <div className="relative w-[960px] shrink-0 leading-[1.26] [zoom:var(--landing-zoom,2)]">{children}</div>
    </div>
  );
}
