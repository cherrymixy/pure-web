"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

const FRAME_W = 1920;
const APP_ZOOM = 0.67; // = --base-zoom fallback in styles/tokens.css
/** Below 1920 (a 1440–1512 Mac) everything read too small: text and UI run ~10 % larger there. */
const SMALL_BOOST = 1.1;

/** Live --frame-zoom = min(1, window width / 1920): the scale at which the 1× sidebar + home frame fit the window.
 *  --sidebar-zoom = that scale divided by the html zoom of a 67 % page (`zoom` can't take calc(), so it's a plain number).
 *  Fit-frame pages already run html at the frame zoom: globals.css sets --sidebar-zoom to 1 there, so the sidebar
 *  doesn't depend on whether the page had rendered when this ran (it read the live zoom before and stuck enlarged). */
function useFrameZoom(pathname: string) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const fit = () => {
      // clientWidth/Height leave out an always-on scrollbar (macOS with a mouse); innerWidth counted it and pushed the frame 15px wide.
      const w = root.clientWidth;
      const boost = w < FRAME_W ? SMALL_BOOST : 1;
      const frame = Math.min(1, (w / FRAME_W) * boost);
      const base = APP_ZOOM * boost;
      root.style.setProperty("--frame-zoom", String(frame));
      root.style.setProperty("--base-zoom", String(base));
      root.style.setProperty("--sidebar-zoom", String(frame / base));
      // The window height in px: zoom scales px the same in every browser, unlike vh (Safari doesn't zoom vh, so 100vh / zoom overflowed).
      root.style.setProperty("--win-h", `${root.clientHeight}px`);
    };
    fit();
    window.addEventListener("resize", fit);
    const ro = new ResizeObserver(fit); // a scrollbar appearing changes the viewport without a resize event
    ro.observe(root);
    return () => {
      window.removeEventListener("resize", fit);
      ro.disconnect();
      root.style.removeProperty("--frame-zoom");
      root.style.removeProperty("--sidebar-zoom");
      root.style.removeProperty("--base-zoom");
      root.style.removeProperty("--win-h");
    };
  }, [pathname]);
}

/** Project setup and editor frames (Figma W02B-1 … W02F-4) and the community motion detail (943:1619) are full-bleed on
 *  bg/canvas; only the lab pages carry the sidebar. */
export function isFullBleed(pathname: string): boolean {
  return pathname.startsWith("/lab/new") || pathname.startsWith("/lab/p/") || pathname.startsWith("/lab/community/");
}

export function LabShell({ sidebar, children }: { sidebar: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  useFrameZoom(pathname);
  if (isFullBleed(pathname)) {
    return <main className="flex min-h-[var(--app-vh)] min-w-0 flex-col bg-[var(--home-canvas)]">{children}</main>;
  }
  return (
    <div className="flex min-h-[var(--app-vh)] bg-[var(--home-canvas)]">
      {sidebar}
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
