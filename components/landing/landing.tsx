"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  start: { up: [12.6, 13.4], circle: [13.3, 14.0], text: [13.8, 14.2] }, // up: words rise, dot drops to centre
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
  // Layers overlap the whole stage, so they let clicks through; links opt back in (pointer-events-auto).
  return <div className="pointer-events-none absolute h-[1080px] w-[1920px]" style={{ ...style, left: off(x, s.w, W), top: off(y, s.h, H) }}>{children}</div>;
}

export function Landing() {
  const [t, setT] = useState(0);
  const [fit, setFit] = useState<{ scale: number; w: number; h: number } | null>(null);
  const [reduced, setReduced] = useState(false);
  const router = useRouter();

  // "Press Enter ↵" on the last slide starts too, once Click to Start is showing.
  const ready = seg(t, T.start.text) > 0.5;
  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      allowWelcomeAgain();
      router.push(L.outro.href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, router]);

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
  const pill = "pointer-events-auto absolute flex items-center justify-center p-[10px] text-[16px] font-bold leading-[1.4] whitespace-nowrap transition-colors";
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
      <p className="absolute right-[81px] top-[514px] whitespace-nowrap text-right text-[21px] font-medium leading-[51.387px] text-black" style={{ opacity: settle }}>
        {items[active]?.caption}
      </p>
      </Layer>
    </section>
  );
}

// Slide 4 (1067:3131) as designed: 8 frames around the Upload box, every frame filled with a robot (user review).
// Frames: centre (x, y) of each wrapper, inner size, rotation, radius — clockwise from the top.
const FRAMES = [
  { x: 960.5, y: 206.81, size: 193.797, rot: 0, r: 50.387 },
  { x: 1193.46, y: 303.3, size: 206.716, rot: 22, r: 53.746 },
  { x: 1289.96, y: 536.27, size: 200.256, rot: -6, r: 52.067 },
  { x: 1193.46, y: 769.22, size: 206.716, rot: 18, r: 53.746 },
  { x: 960.5, y: 865.72, size: 193.797, rot: -4, r: 50.387 },
  { x: 727.54, y: 769.22, size: 213.176, rot: -14, r: 55.426 },
  { x: 631.05, y: 536.27, size: 200.256, rot: 6, r: 52.067 },
  { x: 727.54, y: 303.3, size: 206.716, rot: -28, r: 53.746 },
];
const CX = 960.12;
const CY = 540.12;
const RING_STEP = 360 / FRAMES.length; // one frame per hold
const TOP = -90; // degrees: the slot whose robot is named

const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x));

/** Slide 4: frames whoosh straight in from off-screen to their slots (no spin), then the ring turns smoothly with
 *  scroll — a robot grows as it nears the top and its name cross-fades in bottom-right. */
function Robots({ t, reduced }: { t: number; reduced: boolean }) {
  const enter = seg(t, T.robots.in);
  const out = seg(t, T.robots.out);
  if (enter <= 0 || out >= 1) return null;
  const spin = easeInOut(seg(t, T.robots.run)) * (FRAMES.length - 1) * RING_STEP; // continuous, clockwise
  const polar = FRAMES.map((f) => ({ a: (Math.atan2(f.y - CY, f.x - CX) * 180) / Math.PI, d: Math.hypot(f.x - CX, f.y - CY) }));
  const gap = (a: number) => Math.abs(((((a + spin - TOP) % 360) + 540) % 360) - 180); // degrees from the top slot
  const ready = enter >= 1 ? 1 : 0;
  const near = polar.map((p) => ready * Math.max(0, Math.cos(Math.min(90, (gap(p.a) / RING_STEP) * 90) * (Math.PI / 180)))); // 1 at top → 0 a slot away

  return (
    <section className="absolute inset-0" style={{ opacity: 1 - out }}>
      <Layer>
        <div
          className="absolute size-[242.246px] -translate-x-1/2 -translate-y-1/2 rounded-[49.874px] border-[1.781px] border-[var(--landing-upload-border)] bg-[var(--landing-upload)] shadow-[var(--landing-upload-shadow)]"
          style={{ left: CX, top: CY, opacity: Math.min(1, enter * 2) }}
        />
        {FRAMES.map((f, i) => {
          const frame = L.robots.frames[L.robots.ring[i]];
          // Whoosh: straight in along its own direction from 3.4× out, fast then settling (expo ease), staggered.
          const e = reduced ? 1 : easeOutExpo(clamp((enter - i * 0.04) / 0.55));
          const ang = ((polar[i].a + spin) * Math.PI) / 180;
          const rad = polar[i].d * (1 + 2.4 * (1 - e));
          return (
            <div
              key={i}
              className="absolute overflow-hidden bg-[var(--landing-frame)] shadow-[var(--landing-frame-shadow)]"
              style={{
                width: f.size,
                height: f.size,
                borderRadius: f.r,
                left: CX + Math.cos(ang) * rad - f.size / 2,
                top: CY + Math.sin(ang) * rad - f.size / 2,
                rotate: `${f.rot}deg`,
                opacity: Math.min(1, e * 1.4) * (ready ? 0.55 + 0.45 * near[i] : 1),
                scale: (0.7 + 0.3 * e) * (1 + 0.14 * near[i]),
                zIndex: near[i] > 0.5 ? 1 : 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={frame.image} alt={frame.caption} className="size-full object-cover" />
            </div>
          );
        })}
      </Layer>
      <Layer x="start" y="end">
        <div className="absolute left-[81px] top-[913px] text-[40.023px] font-medium leading-[62.535px] text-black" style={{ opacity: Math.min(1, enter * 2) }}>
          {L.robots.lines.map((l) => (
            <p key={l} className="h-[54px] whitespace-nowrap">{l}</p>
          ))}
        </div>
      </Layer>
      <Layer x="end" y="end">
        {/* Names of the frames near the top cross-fade, drifting up as they leave. */}
        {FRAMES.map((_, i) =>
          near[i] > 0.02 ? (
            <p
              key={i}
              className="absolute right-[81px] top-[953px] whitespace-nowrap text-right text-[21px] font-medium leading-[51.387px] text-black"
              style={{ opacity: near[i] ** 2, translate: `0 ${(1 - near[i]) * 10}px` }}
            >
              {L.robots.frames[L.robots.ring[i]].caption}
            </p>
          ) : null,
        )}
      </Layer>
    </section>
  );
}

/** Slides 5–6 (1067:3151 / 3160), restyled (user review, ref "VANTE"): on black, a split headline — PURE WEB slides
 *  in from the left, SIMULATION from the right — with a tiny caption and dot between, a short blurb bottom-left and a
 *  small menu bottom-right. Then it all rises away and the white circle opens with Click to Start. */
// Click to Start (user review: much smaller than Figma's 1287 circle, no lines): the caption dot drops to the centre
// and grows into a 520 circle holding a quiet uppercase CLICK TO START with an ink dot above. Enter still starts.
const DOT = 6;
const CIRCLE = 520;
const CIRCLE_LEFT = 960 - CIRCLE / 2;
const CIRCLE_TOP = 540 - CIRCLE / 2;

function Outro({ t }: { t: number }) {
  const slide = easeOut(seg(t, T.dark.slide));
  if (slide <= 0) return null;
  const small = seg(t, [11.6, 12.2]); // caption, dot, blurb and menu fade in after the words land
  const up = easeInOut(seg(t, T.start.up)) * -922;
  const circle = easeOut(seg(t, T.start.circle));
  const text = seg(t, T.start.text);
  const word = "absolute top-[540px] whitespace-nowrap font-[family-name:var(--font-landing-display)] text-[96px] font-medium uppercase leading-none tracking-[-0.01em] text-white";
  const mono = "font-mono text-[11px] uppercase leading-[15px] tracking-[0.08em] text-[var(--landing-label)]";
  const o = L.outro;
  return (
    <>
    <Layer>
      <div style={{ transform: `translateY(${up}px)` }}>
        {/* Gap 760 → 1160 holds the caption; words hug it from both sides. */}
        <p className={word} style={{ right: 1920 - 760, translate: `${-(1 - slide) * 900}px -50%`, opacity: slide }}>{o.left}</p>
        <p className={word} style={{ left: 1160, translate: `${(1 - slide) * 900}px -50%`, opacity: slide }}>{o.right}</p>
        <div className={`absolute left-[760px] top-[540px] w-[400px] -translate-y-1/2 text-center ${mono}`} style={{ opacity: small }}>
          {o.caption.map((c) => <p key={c}>{c}</p>)}
        </div>
      </div>
      {/* The caption dot: stays while the words rise, drops to the centre, then the circle grows out of it. */}
      <span
        aria-hidden
        className="absolute rounded-full bg-white"
        style={{ width: DOT, height: DOT, left: 960 - DOT / 2, top: 383 + (540 - 383) * easeInOut(seg(t, T.start.up)) - DOT / 2, opacity: small }}
      />
      {circle > 0 && (
        <Link
          href={o.href}
          onClick={allowWelcomeAgain}
          aria-label={o.start}
          className="group absolute flex flex-col items-center justify-center rounded-full text-[var(--landing-ink)]"
          style={{ left: CIRCLE_LEFT, top: CIRCLE_TOP, width: CIRCLE, height: CIRCLE, pointerEvents: text > 0.5 ? "auto" : "none" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={o.circle}
            alt=""
            width={CIRCLE}
            height={CIRCLE}
            className="absolute inset-0 size-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            style={{ scale: DOT / CIRCLE + (1 - DOT / CIRCLE) * circle }}
          />
          <span className="relative flex flex-col items-center" style={{ opacity: text, transform: `translateY(${(1 - text) * 12}px)` }}>
            <span aria-hidden className="mb-[22px] rounded-full bg-[var(--landing-ink)]" style={{ width: DOT, height: DOT }} />
            <span className="whitespace-nowrap font-[family-name:var(--font-landing-display)] text-[40px] font-medium uppercase leading-none tracking-[-0.01em]">{o.start}</span>
          </span>
        </Link>
      )}
    </Layer>
    <Layer x="start" y="end">
      {/* Same slot and size as the first slide's footer copy (left 38 / right edge 1884, top 994, 14px), sentence case. */}
      <p className="absolute left-[38px] top-[994px] w-[514px] text-[14px] font-medium leading-[1.4] text-white" style={{ opacity: small * (1 - seg(t, T.start.up) * 2) }}>{o.blurb}</p>
    </Layer>
    <Layer x="end" y="end">
      <p className="absolute right-[36px] top-[994px] flex gap-[28px] text-[14px] font-medium leading-[1.4] text-white" style={{ opacity: small * (1 - seg(t, T.start.up) * 2) }}>
        {o.menu.map((m) => <span key={m}>{m}</span>)}
      </p>
    </Layer>
    </>
  );
}
