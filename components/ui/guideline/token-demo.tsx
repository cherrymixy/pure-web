import type { CSSProperties, ReactNode } from "react";
import { parseSize } from "./parse-size";

// Primitive token examples: one small looping picture per size row, drawn from the row's value
// (tilt 12° tilts the head 12°, eye.size 0.24 opens the eyes to 24% of the screen, length 0.8 s draws a 0.8 s bar …).
// Motion is CSS (globals.css .tok-*), so reduced motion shows the end pose. max rows draw in red (--home-ink swapped).

const INK = "var(--home-ink)";
const MUTED = "var(--home-ink-3)";
const LINE = "var(--home-line)";
const PILL = "var(--home-pill)";
const W = 200;
const H = 120;

type Demo = (p: { value: string; i: number }) => ReactNode;

const num = (v: string, fallback = 0) => parseSize(v)?.[1] ?? fallback;
const to = (t: string, origin: string, extra: CSSProperties = {}): CSSProperties => ({ ["--t" as string]: t, transformOrigin: origin, ...extra });

/* ── body ───────────────────────────────────────────────────────────────────────────── */

/** Front view: base, neck, head with eyes. Children go inside the head group. */
function Head({ x = 100, style }: { x?: number; style?: CSSProperties }) {
  return (
    <>
      <rect x={x - 22} y={98} width={44} height={8} rx={4} fill={PILL} />
      <line x1={x} y1={98} x2={x} y2={82} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <g className="tok-to" style={style}>
        <rect x={x - 30} y={44} width={60} height={38} rx={13} fill={INK} />
        <rect x={x - 14} y={56} width={8} height={13} rx={3} fill="var(--neutral-0)" />
        <rect x={x + 6} y={56} width={8} height={13} rx={3} fill="var(--neutral-0)" />
      </g>
    </>
  );
}

const tilt: Demo = ({ value }) => (
  <>
    <line x1={100} y1={28} x2={100} y2={82} stroke={LINE} strokeWidth={1.5} strokeDasharray="3 4" />
    <Head style={to(`rotate(${num(value)}deg)`, "100px 82px")} />
  </>
);

/** Top view: body circle with a gaze wedge that turns. */
function TopBody({ deg, cy = 78, delay, swing = false }: { deg: number; cy?: number; delay?: string; swing?: boolean }) {
  return (
    <>
      <line x1={100} y1={cy} x2={100} y2={cy - 62} stroke={LINE} strokeWidth={1.5} strokeDasharray="3 4" />
      <g className={swing ? "tok-swing" : "tok-to"} style={{ ...to(`rotate(${deg}deg)`, `100px ${cy}px`), ["--a" as string]: `${deg}deg`, animationDelay: delay }}>
        <path d={`M100 ${cy} L88 ${cy - 54} Q100 ${cy - 60} 112 ${cy - 54} Z`} fill={INK} opacity={0.12} />
        <circle cx={100} cy={cy - 20} r={3.5} fill={INK} />
      </g>
      <circle cx={100} cy={cy} r={16} fill={INK} />
    </>
  );
}

const rotate: Demo = ({ value }) => {
  const p = parseSize(value);
  return <TopBody deg={p && p[2] === "°" ? p[1] : 60} />;
};

const track: Demo = ({ value }) => {
  const lag = /lag/.test(value) ? `${((parseSize(value)?.[0] ?? 0.2) + (parseSize(value)?.[1] ?? 0.4)) / 2}s` : "0.3s";
  const deg = /±/.test(value) ? num(value) : 24;
  return (
    <>
      <g className="tok-swing" style={{ ["--a" as string]: `${deg}deg`, transformOrigin: "100px 92px" }}>
        <circle cx={100} cy={30} r={6} fill="var(--sage-400)" />
      </g>
      <TopBody deg={deg} cy={92} delay={lag} swing />
    </>
  );
};

/** Side view: a person on the right, the robot moving toward or away from them. */
function SideScene({ dx, squash = 1 }: { dx: number; squash?: number }) {
  const robot = (
    <>
      <rect x={52} y={92} width={32} height={10} rx={5} fill={INK} />
      <rect x={56} y={58} width={24} height={34} rx={9} fill={INK} />
      <rect x={70} y={66} width={5} height={8} rx={2} fill="var(--neutral-0)" />
    </>
  );
  return (
    <>
      <line x1={20} y1={102} x2={180} y2={102} stroke={LINE} strokeWidth={1.5} />
      <circle cx={162} cy={46} r={9} fill={MUTED} />
      <rect x={154} y={58} width={16} height={44} rx={8} fill={MUTED} />
      <g opacity={0.15}>{robot}</g>
      <g className="tok-to" style={to(`translate(${dx}px, 0) scale(1, ${squash})`, "68px 102px")}>{robot}</g>
    </>
  );
}

const BH = 110; // px per body height
const approach: Demo = ({ value }) => <SideScene dx={num(value) * BH} />;
const retreat: Demo = ({ value }) => {
  const bh = parseFloat(value.match(/([\d.]+)\s*BH/)?.[1] ?? "0.25");
  const drop = parseFloat(value.replace(/−/g, "-").match(/-(\d+)%/)?.[1] ?? "10");
  return (
    <g transform="translate(40 0)">
      <SideScene dx={-bh * BH} squash={1 - drop / 100} />
    </g>
  );
};

/* ── time: a motion curve over seconds, with a playhead ─────────────────────────────── */

const X0 = 18;
const X1 = 182;
const BASE = 92;
const TOP = 40;

function Timeline({ span, d, band, ticks }: { span: number; d: string; band?: [number, number]; ticks?: number[] }) {
  const x = (s: number) => X0 + (s / span) * (X1 - X0);
  return (
    <>
      {band && <rect x={x(band[0])} y={TOP - 8} width={Math.max(2, x(band[1]) - x(band[0]))} height={BASE - TOP + 8} rx={6} fill="var(--sage-400)" opacity={0.22} />}
      <line x1={X0} y1={BASE} x2={X1} y2={BASE} stroke={LINE} strokeWidth={1.5} />
      {(ticks ?? [0, span]).map((t) => (
        <text key={t} x={x(t)} y={BASE + 16} textAnchor="middle" fontSize={10} fill={MUTED} fontFamily="var(--font-mono, monospace)">{t}s</text>
      ))}
      <path d={d} fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <line className="tok-sweep" x1={X0} y1={TOP - 12} x2={X0} y2={BASE} stroke="var(--sage-500)" strokeWidth={1.5} style={{ ["--w" as string]: `${X1 - X0}px` }} />
    </>
  );
}

/** A bump (rise · fall) starting at s seconds, lasting len, of height h (0..1). */
const bump = (x: (s: number) => number, s: number, len: number, h = 1) => {
  const y = BASE - h * (BASE - TOP);
  return `L${x(s)} ${BASE} C${x(s + len * 0.3)} ${BASE} ${x(s + len * 0.25)} ${y} ${x(s + len / 2)} ${y} C${x(s + len * 0.75)} ${y} ${x(s + len * 0.7)} ${BASE} ${x(s + len)} ${BASE}`;
};
const scaleX = (span: number) => (s: number) => X0 + (s / span) * (X1 - X0);

const pause: Demo = ({ value }) => {
  const gap = num(value, 0.3);
  const span = 1.2;
  const x = scaleX(span);
  const end = 0.3 + gap;
  return <Timeline span={span} band={[0.3, end]} d={`M${X0} ${BASE} ${bump(x, 0, 0.3)} L${x(end)} ${BASE} ${bump(x, end, 0.3)} L${X1} ${BASE}`} />;
};

const hold: Demo = ({ value }) => {
  const p = parseSize(value);
  const len = p ? (p[0] + p[1]) / 2 : 2.6;
  const span = 3.4;
  const x = scaleX(span);
  const y = TOP;
  return <Timeline span={span} band={[0.3, 0.3 + len]} d={`M${X0} ${BASE} C${x(0.15)} ${BASE} ${x(0.1)} ${y} ${x(0.3)} ${y} L${x(0.3 + len)} ${y} C${x(0.45 + len)} ${y} ${x(0.4 + len)} ${BASE} ${x(0.6 + len)} ${BASE} L${X1} ${BASE}`} />;
};

const delay: Demo = ({ value }) => {
  const p = parseSize(value);
  const wait = value.startsWith("+") ? 0.5 + num(value) : p ? (p[0] === p[1] ? p[1] : (p[0] + p[1]) / 2) : 0.5;
  const span = 1.2;
  const x = scaleX(span);
  return (
    <>
      <Timeline span={span} band={[0, wait]} d={`M${X0} ${BASE} L${x(wait)} ${BASE} ${bump(x, wait, 0.4)} L${X1} ${BASE}`} />
      <path d={`M${X0 + 2} ${TOP - 6} l-5 12 h6 l-4 12`} fill="none" stroke="var(--sage-500)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
};

const pulse: Demo = () => {
  const span = 1.6;
  const x = scaleX(span);
  const beat = 60 / 105;
  return <Timeline span={span} d={`M${X0} ${BASE} ${bump(x, 0.1, beat * 0.8)} ${bump(x, 0.1 + beat, beat * 0.8, 0.7)} L${X1} ${BASE}`} ticks={[0, 0.8, 1.6]} />;
};

const drift: Demo = () => {
  const span = 10;
  const x = scaleX(span);
  const mid = BASE - 18;
  const pts = Array.from({ length: 41 }, (_, k) => {
    const s = (k / 40) * span;
    return `${k ? "L" : "M"}${x(s).toFixed(1)} ${(mid - Math.sin((s / 4) * Math.PI * 2) * 7).toFixed(1)}`;
  });
  return <Timeline span={span} d={pts.join(" ")} ticks={[0, 4, 8]} />;
};

/* ── face: a screen with two eyes ───────────────────────────────────────────────────── */

function Screen({ children }: { children: ReactNode }) {
  return (
    <>
      <rect x={46} y={18} width={108} height={84} rx={20} fill={INK} />
      {children}
    </>
  );
}

const EYE = { w: 16, l: 78, r: 106, cy: 60 };
const eyeRect = (cx: number, h: number, style?: CSSProperties, className?: string) => (
  <rect className={className} x={cx} y={EYE.cy - h / 2} width={EYE.w} height={h} rx={Math.min(6, h / 2)} fill="var(--neutral-0)" style={style} />
);

const eyeSize: Demo = ({ value }) => {
  const h = num(value, 0.24) * 84;
  return <Screen>{eyeRect(EYE.l, h)}{eyeRect(EYE.r, h)}</Screen>;
};

const eyeAngle: Demo = ({ value }) => {
  const a = num(value);
  const eye = (cx: number, sign: number) =>
    eyeRect(cx, 20, { ["--t" as string]: `rotate(${sign * a}deg)`, transformOrigin: `${cx + EYE.w / 2}px ${EYE.cy}px` }, "tok-to");
  return <Screen>{eye(EYE.l, 1)}{eye(EYE.r, -1)}</Screen>;
};

const eyeShape: Demo = ({ i }) => {
  const smile = (cx: number) => <path d={`M${cx} ${EYE.cy + 5} Q${cx + EYE.w / 2} ${EYE.cy - 12} ${cx + EYE.w} ${EYE.cy + 5}`} fill="none" stroke="var(--neutral-0)" strokeWidth={5} strokeLinecap="round" />;
  const closed = (cx: number) => <line x1={cx} y1={EYE.cy} x2={cx + EYE.w} y2={EYE.cy} stroke="var(--neutral-0)" strokeWidth={4} strokeLinecap="round" />;
  if (i === 1) return <Screen>{smile(EYE.l)}{smile(EYE.r)}</Screen>;
  if (i === 2) return <Screen>{closed(EYE.l)}{closed(EYE.r)}</Screen>;
  return <Screen>{eyeRect(EYE.l, 20)}{eyeRect(EYE.r, 20)}</Screen>;
};

const blink: Demo = ({ i }) => {
  const cls = i === 2 ? "tok-blink2" : "tok-blink";
  const style = (cx: number): CSSProperties => ({ transformOrigin: `${cx + EYE.w / 2}px ${EYE.cy}px`, animationDuration: i === 0 ? "4.2s" : "2.6s" });
  return <Screen>{eyeRect(EYE.l, 20, style(EYE.l), cls)}{eyeRect(EYE.r, 20, style(EYE.r), cls)}</Screen>;
};

/* ── sound ──────────────────────────────────────────────────────────────────────────── */

const pitch: Demo = ({ value }) => {
  const st = num(value.replace(/^±/, "+"));
  const down = value.trim().startsWith("−") || value.trim().startsWith("-");
  const shift = (down ? -1 : 1) * Math.abs(st);
  const y0 = 64;
  const y1 = y0 - shift * 6;
  return (
    <>
      {[34, 46, 58, 70, 82, 94].map((y) => <line key={y} x1={30} y1={y} x2={170} y2={y} stroke={LINE} strokeWidth={1} />)}
      <ellipse cx={70} cy={y0} rx={9} ry={7} fill={MUTED} />
      <path d={`M82 ${y0} C100 ${y0} 104 ${y1} 118 ${y1}`} fill="none" stroke="var(--sage-500)" strokeWidth={2} strokeDasharray="3 3" />
      <g className="tok-to" style={to(`translate(0px, ${y1 - y0}px)`, "130px 64px")}>
        <ellipse cx={130} cy={y0} rx={9} ry={7} fill={INK} />
      </g>
    </>
  );
};

/** A sine wave across the panel: cycles, amplitude. */
const wave = (cycles: number, amp: number, x0 = 22, x1 = 178, mid = 62, shape: "sine" | "saw" = "sine") =>
  Array.from({ length: 121 }, (_, k) => {
    const t = k / 120;
    const ph = t * cycles;
    const v = shape === "saw" ? 2 * (ph - Math.floor(ph + 0.5)) : Math.sin(ph * Math.PI * 2);
    return `${k ? "L" : "M"}${(x0 + t * (x1 - x0)).toFixed(1)} ${(mid - v * amp).toFixed(1)}`;
  }).join(" ");

const tempo: Demo = ({ value }) => {
  const k = num(value, 1);
  return (
    <>
      <path d={wave(3, 12, 22, 178, 40)} fill="none" stroke={MUTED} strokeWidth={2} opacity={0.5} />
      <text x={22} y={20} fontSize={10} fill={MUTED} fontFamily="var(--font-mono, monospace)">1×</text>
      <path d={wave(3 * k, 14, 22, 178, 84)} fill="none" stroke={INK} strokeWidth={2.5} />
      <text x={22} y={110} fontSize={10} fill={INK} fontFamily="var(--font-mono, monospace)">{k}×</text>
    </>
  );
};

const timbre: Demo = () => (
  <>
    {(
      [
        ["Bright", wave(3, 12, 22, 70, 60, "saw")],
        ["Soft", wave(2, 12, 76, 124, 60)],
        ["Quiet", wave(2, 5, 130, 178, 60)],
      ] as const
    ).map(([label, d], k) => (
      <g key={label}>
        <path d={d} fill="none" stroke={k ? MUTED : INK} strokeWidth={2.5} strokeLinejoin="round" />
        <text x={46 + k * 54} y={100} textAnchor="middle" fontSize={10} fill={MUTED}>{label}</text>
      </g>
    ))}
  </>
);

const length: Demo = ({ value }) => {
  const s = num(value, 0.4);
  const x = scaleX(1);
  return (
    <>
      <defs>
        <linearGradient id={`fade-${s}`} x1="0" x2="1">
          <stop offset="0.75" stopColor="var(--home-ink)" />
          <stop offset="1" stopColor="var(--home-ink)" stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <path d={wave(s * 9, 16, X0, x(s), 62)} fill="none" stroke={`url(#fade-${s})`} strokeWidth={2.5} />
      <line x1={X0} y1={BASE} x2={X1} y2={BASE} stroke={LINE} strokeWidth={1.5} />
      {[0, 0.5, 1].map((t) => (
        <text key={t} x={x(t)} y={BASE + 16} textAnchor="middle" fontSize={10} fill={MUTED} fontFamily="var(--font-mono, monospace)">{t}s</text>
      ))}
    </>
  );
};

const DEMOS: Record<string, Demo> = {
  tilt, rotate, track, approach, retreat,
  pause, hold, delay, pulse, drift,
  "eye-size": eyeSize, "eye-angle": eyeAngle, "eye-shape": eyeShape, blink,
  pitch, tempo, timbre, length,
};

export const hasTokenDemo = (slug?: string) => Boolean(slug && DEMOS[slug]);

export function TokenDemo({ slug, value, i, max }: { slug: string; value: string; i: number; max?: boolean }) {
  const Draw = DEMOS[slug];
  if (!Draw) return null;
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} className="block h-[150px] w-full" style={max ? { ["--home-ink" as string]: "var(--red-500)" } : undefined}>
      {Draw({ value, i })}
    </svg>
  );
}
