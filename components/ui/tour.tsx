"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TOUR_LABELS, TOUR_STEPS } from "@/data/tour";
import { fmt } from "@/data/strings";

// Guided tour overlay: dims the page except the current target, blocks clicks outside it, bubble next to it.
// Step index lives in sessionStorage so a reload resumes; the welcome popup starts it via startTour().
// No Figma frame yet — styled after the welcome popup (1066:545).
const KEY = "pure.tour.step";
const EVENT = "pure:tour";
const PAD = 8; // spotlight margin around the target
const BUBBLE_W = 360;

export function startTour() {
  try {
    sessionStorage.setItem(KEY, "0");
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function load(): number | null {
  try {
    const v = sessionStorage.getItem(KEY);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}
function save(step: number | null) {
  try {
    if (step === null) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, String(step));
  } catch {}
}

type Box = { top: number; left: number; width: number; height: number };

export function Tour() {
  const pathname = usePathname();
  const router = useRouter();
  const [step, setStepState] = useState<number | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [view, setView] = useState({ w: 0, h: 0 });
  const prevPath = useRef(pathname);

  const setStep = (s: number | null) => {
    const next = s !== null && s >= TOUR_STEPS.length ? null : s;
    save(next);
    setStepState(next);
  };

  // Resume after reload; start on request (always from Lab home).
  useEffect(() => {
    setStepState(load());
    const onStart = () => {
      setStepState(0);
      if (window.location.pathname !== "/lab") router.push("/lab");
    };
    window.addEventListener(EVENT, onStart);
    return () => window.removeEventListener(EVENT, onStart);
  }, [router]);

  // A page change moves forward to the first later step that belongs to the new page.
  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    setStepState((s) => {
      if (s === null || TOUR_STEPS[s].path.test(pathname)) return s;
      const i = TOUR_STEPS.findIndex((t, j) => j > s && t.path.test(pathname));
      if (i === -1) return s;
      save(i);
      return i;
    });
  }, [pathname]);

  const current = step === null ? null : TOUR_STEPS[step];
  const onPage = current !== null && current.path.test(pathname);

  // Follow the target: it can mount late, move or resize (panels, loading results).
  useEffect(() => {
    if (!current?.target || !onPage) {
      setBox(null);
      return;
    }
    const measure = () => {
      // html has CSS zoom (--app-zoom); rects come back in screen px, fixed positions here are in zoomed px.
      const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
      setView({ w: window.innerWidth / z, h: window.innerHeight / z });
      const el = document.querySelector(current.target!);
      const r = el?.getBoundingClientRect();
      setBox((b) => {
        if (!r || r.width === 0) return null;
        const n = { top: r.top / z - PAD, left: r.left / z - PAD, width: r.width / z + PAD * 2, height: r.height / z + PAD * 2 };
        return b && b.top === n.top && b.left === n.left && b.width === n.width && b.height === n.height ? b : n;
      });
    };
    measure();
    const id = window.setInterval(measure, 150);
    window.addEventListener("resize", measure);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", measure);
    };
  }, [current, onPage]);

  // Click (or form submit) inside the target advances. ESC ends the tour.
  useEffect(() => {
    if (step === null || !current) return;
    const el = current.advance === "click" && current.target ? document.querySelector(current.target) : null;
    const inTarget = (e: Event) => !!el && e.target instanceof Node && el.contains(e.target);
    const onClick = (e: MouseEvent) => el?.tagName !== "FORM" && inTarget(e) && setStep(step + 1); // forms move on submit
    const onSubmit = (e: Event) => inTarget(e) && setStep(step + 1);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setStep(null);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("keydown", onKey);
    };
  });

  if (step === null || !current || !onPage) return null;

  const waiting = current.target && !box;
  const below = box ? box.top + box.height + 220 < view.h : false;
  const bubbleStyle: React.CSSProperties = box
    ? {
        left: Math.min(Math.max(box.left, 16), view.w - BUBBLE_W - 16),
        ...(below ? { top: box.top + box.height + 12 } : { bottom: view.h - box.top + 12 }),
      }
    : { left: `calc(50% - ${BUBBLE_W / 2}px)`, bottom: 48 };

  return (
    <div className="fixed inset-0 z-[55] pointer-events-none" role="dialog" aria-label={current.title}>
      {box && (
        <>
          {/* Four blockers around the hole: dim the page and stop clicks outside the target. */}
          <div className="pointer-events-auto absolute inset-x-0 top-0 bg-[var(--bg-overlay)]" style={{ height: Math.max(box.top, 0) }} />
          <div className="pointer-events-auto absolute inset-x-0 bottom-0 bg-[var(--bg-overlay)]" style={{ top: box.top + box.height }} />
          <div className="pointer-events-auto absolute left-0 bg-[var(--bg-overlay)]" style={{ top: box.top, height: box.height, width: Math.max(box.left, 0) }} />
          <div className="pointer-events-auto absolute right-0 bg-[var(--bg-overlay)]" style={{ top: box.top, height: box.height, left: box.left + box.width }} />
          <div className="absolute rounded-[var(--radius-sm)] ring-2 ring-[var(--home-ink-3)]" style={box} />
        </>
      )}
      <div
        key={step}
        className="anim-pop-in pointer-events-auto absolute flex flex-col gap-[var(--space-12)] rounded-[var(--radius-md)] bg-[var(--welcome-bg)] px-[20px] pb-[16px] pt-[20px] shadow-[var(--pure-shadow-modal)]"
        style={{ ...bubbleStyle, width: BUBBLE_W }}
      >
        <p className="text-[18px] font-semibold leading-[26px] tracking-[-0.1px] text-[var(--welcome-title)]">{current.title}</p>
        <p className="text-[15px] leading-[23px] text-[var(--welcome-body)]">{waiting && current.waiting ? current.waiting : current.body}</p>
        <div className="mt-[var(--space-4)] flex items-center justify-between">
          <span className="font-mono text-[13px] text-[var(--welcome-key-text)]">{fmt(TOUR_LABELS.count, { n: step + 1, total: TOUR_STEPS.length })}</span>
          <div className="flex items-center gap-[var(--space-12)]">
            {current.advance !== "done" && (
              <button type="button" onClick={() => setStep(null)} className="text-[14px] text-[var(--welcome-key-text)] hover:text-[var(--welcome-title)]">
                {TOUR_LABELS.skip}
              </button>
            )}
            {(current.advance === "next" && !waiting) || current.advance === "done" ? (
              <button
                type="button"
                onClick={() => setStep(current.advance === "done" ? null : step + 1)}
                className="rounded-[var(--radius-xs)] bg-[var(--home-ink-2)] px-[14px] py-[8px] font-mono text-[14px] font-medium leading-[20px] text-white hover:bg-[var(--neutral-800)]"
              >
                {current.advance === "done" ? TOUR_LABELS.done : TOUR_LABELS.next}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
