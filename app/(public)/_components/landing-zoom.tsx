"use client";

import { useEffect, useRef } from "react";

// The W00-1 prototype is drawn at half size (960 wide = 1920 target). The landing is built in Figma's
// 960-unit coordinates and scaled with CSS zoom so it fills the viewport width (default 2, at least 1.5). The page root is
// zoomed too (--app-zoom), so the landing zoom works in root-zoomed px: viewport width / root zoom / 960.
const BASE = 960;
const fit = () => {
  const root = Number(getComputedStyle(document.documentElement).zoom) || 1;
  return Math.max(1.5, window.innerWidth / root / BASE);
};

export function LandingZoom({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = () => ref.current?.style.setProperty("--landing-zoom", String(fit()));
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
