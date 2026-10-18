"use client";

import { useEffect, useRef } from "react";

// The W00-1 prototype is drawn at half size (960 wide = 1920 target). The landing is built in Figma's
// 960-unit coordinates and scaled with CSS zoom so it fills the viewport width (default 2, at least 1.5). The page root is
// zoomed too (--app-zoom), so the landing zoom works in root-zoomed px: viewport width / root zoom / 960.
const BASE = 960;
const fit = () => {
  const root = Number(getComputedStyle(document.documentElement).zoom) || 1;
  const z = Math.max(1.5, window.innerWidth / root / BASE);
  return { z, visible: window.innerHeight / root / z };
};

// Hero (Figma 960 × 610) fits the first screen: on short/wide windows it gets shorter (never below
// HERO_MIN) and the robot shrinks with it (HERO_K: 1 at full height, linear down to HERO_K_MIN).
const HERO_H = 610;
const HERO_MIN = 440;
const HERO_K_MIN = 0.6;
const hero = (visible: number) => {
  const h = Math.min(HERO_H, Math.max(HERO_MIN, visible));
  const k = Math.max(HERO_K_MIN, Math.min(1, (h - 250) / (HERO_H - 250)));
  return { h, k };
};

export function LandingZoom({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = () => {
      const { z, visible } = fit();
      const { h, k } = hero(visible);
      ref.current?.style.setProperty("--landing-zoom", String(z));
      ref.current?.style.setProperty("--hero-h", String(h));
      ref.current?.style.setProperty("--hero-k", String(k));
      ref.current?.style.setProperty("--landing-unzoom", String(1 / z)); // CSS zoom can't take calc(1 / var())
    };
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
