"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { LANDING as L } from "@/data/landing";
import { allowWelcomeAgain } from "@/components/ui/welcome-popup";

// Scroll-driven landing (Figma slides 1067:3102 → 3160). One sticky 1920×1080 stage scaled to the window;
// scroll position (in screens) drives every scene. Figma px are used as-is inside the stage.
// Timeline, in screens of scroll:
const T = {
  hero: { scrub: [0, 1.6], out: [1.4, 2.2] },
  moments: { in: [2, 2.3], enter: [2.1, 2.7], run: [2.7, 6.2], out: [6.2, 6.6] },
  robots: { in: [6.6, 7.8], run: [7.8, 10.6], out: [10.6, 11] },
  dark: { bg: [10.8, 11.3], slide: [11.2, 12.4] },
  start: { up: [12.6, 13.4], circle: [12.9, 13.9], text: [13.6, 14.1] },
  end: 14.6,
} as const;

const W = 1920;
const H = 1080;
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const seg = (t: number, [a, b]: readonly [number, number]) => clamp((t - a) / (b - a));
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
/** Stepped progress: holds on each whole step, then snaps to the next ("덜컥"). */
const notch = (x: number, hold = 0.55) => {
  const i = Math.floor(x);
  return i + easeInOut(clamp((x - i - hold) / (1 - hold)));
};

// Stage size in Figma px: the window at a scale where the whole 1920×1080 frame fits (text never grows past Figma,
// nothing is cropped). The spare room goes to the sides or top/bottom; a Layer is one 1920×1080 Figma frame pinned to
// an edge or the centre of the stage on each axis, so children keep Figma coordinates and margins.
const Stage = createContext({ w: W, h: H });
type Pin = "start" | "center" | "end";
function Layer({ x = "center", y = "center", children, style }: { x?: Pin; y?: Pin; children: React.ReactNode; style?: React.CSSProperties }) {
  const s = useContext(Stage);
  const off = (pin: Pin, size: number, frame: number) => (pin === "start" ? 0 : pin === "center" ? (size - frame) / 2 : size - frame);
  return <div className="absolute h-[1080px] w-[1920px]" style={{ ...style, left: off(x, s.w, W), top: off(y, s.h, H) }}>{children}</div>;
}

export function Landing() {
  const [t, setT] = useState(0);
  const [fit, setFit] = useState<{ scale: number; w: number; h: number } | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setT(window.scrollY / window.innerHeight);
      const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
      setFit({ scale, w: window.innerWidth / scale, h: window.innerHeight / scale });
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    update();
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const dark = Math.max(seg(t, T.dark.bg), 0);

  return (
    <main data-landing className="relative font-[family-name:var(--font-landing)]" style={{ height: `${(T.end + 1) * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-white">
        <div aria-hidden className="absolute inset-0 bg-[var(--landing-ink)]" style={{ opacity: dark }} />
        <Stage.Provider value={{ w: fit?.w ?? W, h: fit?.h ?? H }}>
          <div className="relative origin-top-left overflow-hidden" style={{ width: fit?.w ?? W, height: fit?.h ?? H, transform: `scale(${fit?.scale ?? 1})`, opacity: fit ? 1 : 0 }}>
            <Hero t={t} reduced={reduced} />
            <Moments t={t} />
            <Robots t={t} reduced={reduced} />
            <Outro t={t} />
            <Nav inverted={dark > 0.5} />
          </div>
        </Stage.Provider>
      </div>
    </main>
  );
}

function Nav({ inverted }: { inverted: boolean }) {
  const pill = "absolute flex items-center justify-center p-[10px] text-[16px] font-bold leading-[1.4] whitespace-nowrap transition-colors";
  const solid = inverted ? "bg-white text-[var(--landing-ink)]" : "bg-[var(--landing-ink)] text-white";
  const line = inverted ? "border border-white text-white" : "border border-[var(--landing-ink)] text-[var(--landing-ink)]";
  const ext = (item: { label: string; href: string }, cls: string) =>
    item.href ? (
      <a href={item.href} target="_blank" rel="noreferrer" className={cls}>{item.label}</a>
    ) : (
      <span className={cls}>{item.label}</span>
    );
  return (
    <Layer x="end" y="start" style={{ zIndex: 20 }}>
    <nav aria-label="PURE">
      {ext(L.nav.simulation, `${pill} ${solid} left-[1649px] top-[30px]`)}
      {ext(L.nav.behance, `${pill} ${line} left-[1716px] top-[81px]`)}
      {ext(L.nav.github, `${pill} ${line} left-[1810px] top-[81px]`)}
    </nav>
    </Layer>
  );
}

/** Slide 1 (1067:3102): the robot scrubs frame by frame (video when set), then blurs out. */
function Hero({ t, reduced }: { t: number; reduced: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const scrub = seg(t, T.hero.scrub);
  const out = seg(t, T.hero.out);

  useEffect(() => {
    const v = video.current;
    if (v?.duration) v.currentTime = scrub * v.duration;
  }, [scrub]);

  if (out >= 1) return null;
  const h = L.hero;
  return (
    <section className="absolute inset-0" style={{ opacity: 1 - out, filter: reduced ? undefined : `blur(${out * 24}px)` }}>
      <Layer y="end">
      <div className="absolute bottom-0 left-[418px] h-[1029px] w-[1018.435px] overflow-hidden">
        {h.video ? (
          <video ref={video} src={h.video} muted playsInline preload="auto" className="size-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={h.image}
            alt=""
            className="absolute left-[-102.09%] top-[-16.94%] h-[169.12%] w-[304.17%] max-w-none"
            style={{ transform: `scale(${1 + scrub * 0.04})`, transformOrigin: "50% 60%" }}
          />
        )}
      </div>
      </Layer>
      <Layer x="start" y="end">
      <p className="absolute left-[38px] top-[955px] w-[514px] text-[14px] font-bold leading-[1.4] text-[var(--landing-strong)]">{h.leftTitle}</p>
      <p className="absolute left-[38px] top-[994px] w-[514px] text-[14px] font-medium leading-[1.4] text-[var(--landing-muted)]">{h.leftBody}</p>
      </Layer>
      <Layer x="end" y="end">
      <p className="absolute left-[1370px] top-[955px] w-[514px] text-right text-[14px] font-bold leading-[1.4] text-[var(--landing-strong)]">{h.rightTitle}</p>
      <p className="absolute left-[1370px] top-[994px] w-[514px] text-right text-[14px] font-medium leading-[1.4] text-[var(--landing-muted)]">{h.rightBody}</p>
      </Layer>
      <Layer x="start">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={h.wordmark} alt="PURE" width={197} height={43.935} className="absolute left-[157px] top-[472.06px] h-[43.935px] w-[197px]" />
      </Layer>
      <Layer x="end">
      <p className="absolute left-[1315px] top-[467px] whitespace-nowrap text-[32.888px] font-medium leading-[51.387px] text-black">{h.tagline}</p>
      </Layer>
    </section>
  );
}

/** Slide 3 (1067:3116): a column of photos steps down one at a time; the centre one grows and its caption shows. */
function Moments({ t }: { t: number }) {
  const fadeIn = seg(t, T.moments.in);
  const out = seg(t, T.moments.out);
  if (fadeIn <= 0 || out >= 1) return null;
  const items = L.moments.items;
  // Starts 2 slots above centre: the first photo glides down from the top edge, then each one steps down ("덜컥").
  const enter = seg(t, T.moments.enter);
  const c = enter < 1 ? -2 + 2 * easeOut(enter) : notch(seg(t, T.moments.run) * (items.length - 1));
  const active = Math.round(c);
  const settle = 1 - Math.min(1, Math.abs(c - active) * 3); // caption fades while a photo is moving

  // Slot by offset from centre (Figma: centre 645×406 at y 337; neighbours 387×244 at 71 / 770, 27 apart).
  const slot = (d: number) => {
    const a = Math.min(1, Math.abs(d));
    const w = 645 + (387 - 645) * a;
    const h = 406 + (244 - 406) * a;
    const near = d >= 0 ? 337 + (770 - 337) * a : 337 + (71 - 337) * a;
    const top = Math.abs(d) <= 1 ? near : d > 0 ? 770 + (d - 1) * 271 : 71 + (d + 1) * 271;
    return { width: w, height: h, top, left: 959.5 - w / 2 };
  };

  return (
    <section className="absolute inset-0" style={{ opacity: fadeIn * (1 - out) }}>
      <Layer>
      {items.map((it, k) => {
        const d = c - k;
        if (Math.abs(d) > 2.6) return null;
        return (
          <div key={k} className="absolute overflow-hidden bg-[var(--landing-photo)]" style={slot(d)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {it.image && <img src={it.image} alt="" className="size-full object-cover" />}
          </div>
        );
      })}
      </Layer>
      <Layer x="start">
      <div className="absolute left-[81px] top-[455px] text-[40.023px] font-medium leading-[62.535px] text-black">
        {L.moments.lines.map((parts, i) => (
          <p key={i} className="h-[54px] whitespace-nowrap">
            {parts.map((p, j) => (j === 1 && parts.length === 3 ? <b key={j} className="font-bold">{p}</b> : <span key={j}>{p}</span>))}
          </p>
        ))}
      </div>
      </Layer>
      <Layer x="end">
      <p className="absolute left-[1610px] top-[514px] whitespace-nowrap text-[21px] font-medium leading-[51.387px] text-black" style={{ opacity: settle }}>
        {items[active]?.caption}
      </p>
      </Layer>
    </section>
  );
}

const CX = 960.12;
const CY = 540.12;
// Slide 4 (1067:3131): the 5 robot types on an even ring (user review: 5 frames, not Figma's 8), clockwise from the top.
// Ring radius 333 = Figma top frame → centre; frame 206.716 / radius 53.746 and tilts taken from Figma's frames.
const TILTS = [0, 22, -6, -14, 18];
const FRAMES = TILTS.map((rot, i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / TILTS.length;
  return { x: CX + Math.cos(a) * 333, y: CY + Math.sin(a) * 333, size: 206.716, rot, r: 53.746 };
});

/** Slide 4: frames spin in around the centre, then each robot type is shown in turn. */
function Robots({ t, reduced }: { t: number; reduced: boolean }) {
  const enter = seg(t, T.robots.in);
  const out = seg(t, T.robots.out);
  if (enter <= 0 || out >= 1) return null;
  const typed = L.robots.frames.filter((f) => f.image).length;
  const run = seg(t, T.robots.run);
  const active = run > 0 ? Math.min(typed - 1, Math.floor(run * typed)) : -1;

  return (
    <section className="absolute inset-0" style={{ opacity: (reduced ? 1 : Math.min(1, enter * 3)) * (1 - out) }}>
      <Layer>
      <div
        className="absolute size-[242.246px] -translate-x-1/2 -translate-y-1/2 rounded-[49.874px] border-[1.781px] border-[var(--landing-upload-border)] bg-[var(--landing-upload)] shadow-[var(--landing-upload-shadow)]"
        style={{ left: CX, top: CY }}
      />
      {FRAMES.map((f, i) => {
        const frame = L.robots.frames[i];
        const e = reduced ? 1 : easeOut(clamp((enter - i * 0.05) / 0.6));
        // Orbit in: half a turn around the centre while moving out to the ring, spinning on its own axis.
        const dx = f.x - CX;
        const dy = f.y - CY;
        const ang = Math.atan2(dy, dx) - (1 - e) * Math.PI;
        const rad = Math.hypot(dx, dy) * (0.25 + 0.75 * e);
        const on = i === active;
        return (
          <div
            key={i}
            className="absolute overflow-hidden bg-[var(--landing-frame)] shadow-[var(--landing-frame-shadow)] transition-[opacity,scale] duration-300"
            style={{
              width: f.size,
              height: f.size,
              borderRadius: f.r,
              left: CX + Math.cos(ang) * rad - f.size / 2,
              top: CY + Math.sin(ang) * rad - f.size / 2,
              rotate: `${f.rot - (1 - e) * 180}deg`,
              opacity: e * (active === -1 || on ? 1 : 0.45),
              scale: on ? 1.12 : 1,
              zIndex: on ? 1 : 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {frame.image && <img src={frame.image} alt={frame.caption} className="size-full object-cover" />}
          </div>
        );
      })}
      </Layer>
      <Layer x="start" y="end">
      <div className="absolute left-[81px] top-[913px] text-[40.023px] font-medium leading-[62.535px] text-black">
        {L.robots.lines.map((l) => (
          <p key={l} className="h-[54px] whitespace-nowrap">{l}</p>
        ))}
      </div>
      </Layer>
      <Layer x="end" y="end">
      <p key={active} className="anim-fade-in absolute left-[1610px] top-[953px] whitespace-nowrap text-[21px] font-medium leading-[51.387px] text-black">
        {active >= 0 ? L.robots.frames[active].caption : ""}
      </p>
      </Layer>
    </section>
  );
}

/** Slides 5–6 (1067:3151 / 3160): on black, PURE slides in from the right and Web Simulation from the left;
 *  then both rise away and the white circle opens with Click to Start. */
function Outro({ t }: { t: number }) {
  const slide = easeOut(seg(t, T.dark.slide));
  if (slide <= 0) return null;
  const up = easeInOut(seg(t, T.start.up)) * -922;
  const circle = easeOut(seg(t, T.start.circle));
  const text = seg(t, T.start.text);
  const display = "absolute whitespace-nowrap font-[family-name:var(--font-landing-display)] text-[176.625px] font-bold leading-[275.977px] text-white";
  return (
    <Layer>
      <p className={display} style={{ left: 1210.31, top: 333, transform: `translate(${(1 - slide) * 900}px, ${up}px)`, opacity: slide }}>{L.outro.top}</p>
      <p className={display} style={{ left: 244, top: 471.84, transform: `translate(${-(1 - slide) * 1400}px, ${up}px)`, opacity: slide }}>{L.outro.bottom}</p>
      {circle > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={L.outro.circle} alt="" width={1287} height={1287} className="absolute left-[316px] top-[-104px] size-[1287px]" style={{ scale: circle }} />
      )}
      {text > 0 && (
        <Link
          href={L.outro.href}
          onClick={allowWelcomeAgain}
          className="absolute left-[658px] top-[402px] whitespace-nowrap font-[family-name:var(--font-landing-display)] text-[100px] font-bold leading-[275.977px] text-[var(--landing-ink)] underline decoration-from-font hover:opacity-80"
          style={{ opacity: text, pointerEvents: text > 0.5 ? "auto" : "none" }}
        >
          {L.outro.start}
        </Link>
      )}
    </Layer>
  );
}
