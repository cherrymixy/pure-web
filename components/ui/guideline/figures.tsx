// Card illustrations for guideline cards (block.figures keys). Line art, 240 × 120 viewBox:
// one 1.5 stroke, round caps/joins · closed shapes filled with the frame colour so lines never cross ·
// ink = objects, ink-3 = ground and guides, sage = motion only (cues, arrows, keypoints, curves).
// Motion classes (fig-*) live in app/globals.css and stop under prefers-reduced-motion.

import type { ReactNode } from "react";

const INK = "stroke-[var(--home-ink)]";
const SUB = "stroke-[var(--home-ink-3)]";
const ACC = "stroke-[var(--sage-400)]";
const BG = "fill-[var(--home-sidebar)]";
const WHITE = "fill-[var(--neutral-0)]";
const SOLID = "fill-[var(--home-ink)]";
const L = { fill: "none", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
/** Line props for a closed shape whose fill comes from its class. */
const F = { ...L, fill: undefined };
const pivot = (x: number, y: number) => ({ transformBox: "view-box", transformOrigin: `${x}px ${y}px` }) as const;

/* ── kit ─────────────────────────────────────────────────────────────────────────────── */

function Eyes({ x, y }: { x: number; y: number }) {
  return (
    <g className="fig-blink">
      <rect x={x - 5} y={y - 3} width={2.8} height={6} rx={1.4} className={SOLID} />
      <rect x={x + 2.2} y={y - 3} width={2.8} height={6} rx={1.4} className={SOLID} />
    </g>
  );
}

/** Screen face: shell + inset screen + eyes. */
function Face({ x, y, w, h, r }: { x: number; y: number; w: number; h: number; r: number }) {
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={r} className={`${BG} ${INK}`} {...F} />
      <rect x={x - w / 2 + 4} y={y - h / 2 + 4} width={w - 8} height={h - 8} rx={r - 4} className={`${WHITE} ${INK}`} {...F} />
      <Eyes x={x} y={y} />
    </g>
  );
}

/** PURE Desk: dome base, two-part arm, screen head (x = dome centre, ground y = 100). */
function Desk({ x, nod = false }: { x: number; nod?: boolean }) {
  return (
    <g>
      <path d={`M${x - 15} 100 V92 A15 15 0 0 1 ${x + 15} 92 V100`} className={`${BG} ${INK}`} {...F} />
      <path d={`M${x - 18} 100 H${x + 18}`} className={INK} {...L} />
      <path d={`M${x - 4} 80.5 Q${x} 79 ${x + 4} 80.5`} className={INK} {...L} />
      <rect x={-3.5} y={-30} width={7} height={31} rx={3.5} transform={`translate(${x} 82) rotate(12)`} className={`${BG} ${INK}`} {...F} />
      <g className={nod ? "fig-nod" : "fig-sway"} style={pivot(x + 6, 51)}>
        <rect x={x + 4} y={47.5} width={20} height={7} rx={3.5} className={`${BG} ${INK}`} {...F} />
        <circle cx={x + 6.3} cy={51} r={4} className={`${BG} ${INK}`} {...F} />
        <Face x={x + 32} y={40} w={30} h={26} r={10} />
      </g>
    </g>
  );
}

/** Wheeled rover (x = centre, ground y = 100). */
function Rover({ x, roll = true }: { x: number; roll?: boolean }) {
  return (
    <g className={roll ? "fig-roll" : undefined}>
      <Face x={x} y={79} w={44} h={28} r={12} />
      {[x - 13, x + 13].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={93.5} r={6.5} className={`${BG} ${INK}`} {...F} />
          <circle cx={cx} cy={93.5} r={1.4} className={SOLID} />
        </g>
      ))}
    </g>
  );
}

/** Two-legged walker with ears (x = centre, ground y = 100). */
function Walker({ x }: { x: number }) {
  return (
    <g className="fig-bob">
      {[x - 10, x + 10].map((cx) => (
        <g key={cx}>
          <rect x={cx - 4} y={82} width={8} height={14} rx={4} className={`${BG} ${INK}`} {...F} />
          <rect x={cx - 7} y={94} width={14} height={6} rx={3} className={`${BG} ${INK}`} {...F} />
        </g>
      ))}
      <circle cx={x - 15} cy={50} r={5.5} className={`${BG} ${INK}`} {...F} />
      <circle cx={x + 15} cy={50} r={5.5} className={`${BG} ${INK}`} {...F} />
      <Face x={x} y={67} w={40} h={34} r={15} />
    </g>
  );
}

const Ground = ({ x1 = 18, x2 = 222, y = 100 }: { x1?: number; x2?: number; y?: number }) => (
  <path d={`M${x1} ${y} H${x2}`} className={SUB} {...L} strokeDasharray="1 5" />
);

/** Dashed sage arrow along a path ending at (x, y) heading `deg`. */
function Arrow({ d, x, y, deg = 0 }: { d: string; x: number; y: number; deg?: number }) {
  return (
    <g>
      <path d={d} className={`fig-flow ${ACC}`} {...L} />
      <path d="M-4 -3.5 L0 0 L-4 3.5" transform={`translate(${x} ${y}) rotate(${deg})`} className={ACC} {...L} />
    </g>
  );
}

/** Check badge (the one filled accent). */
function Check({ x, y }: { x: number; y: number }) {
  return (
    <g className="fig-pop">
      <circle cx={x} cy={y} r={7.5} className="fill-[var(--sage-500)]" />
      <path d={`M${x - 3.5} ${y + 0.2} L${x - 1} ${y + 2.7} L${x + 3.5} ${y - 2.4}`} className="stroke-[var(--neutral-0)]" {...L} strokeWidth={1.7} />
    </g>
  );
}

/** `{ }` document card. */
function Source({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 22} y={y - 16} width={44} height={32} rx={8} className={`${BG} ${INK}`} {...F} />
      <path d={`M${x - 7} ${y - 7} C${x - 11} ${y - 7} ${x - 10} ${y} ${x - 13} ${y} C${x - 10} ${y} ${x - 11} ${y + 7} ${x - 7} ${y + 7} M${x + 7} ${y - 7} C${x + 11} ${y - 7} ${x + 10} ${y} ${x + 13} ${y} C${x + 10} ${y} ${x + 11} ${y + 7} ${x + 7} ${y + 7}`} className={INK} {...L} />
    </g>
  );
}

/** Browser window: top bar with three dots. */
function Browser({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} className={`${BG} ${INK}`} {...F} />
      <path d={`M${x} ${y + 10} H${x + w}`} className={INK} {...L} />
      {[7, 13, 19].map((dx) => <circle key={dx} cx={x + dx} cy={y + 5} r={1.2} className={SOLID} />)}
    </g>
  );
}

/** Four-point sparkle (AI). */
const Sparkle = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path
    d="M0 -8 L2.2 -2.2 L8 0 L2.2 2.2 L0 8 L-2.2 2.2 L-8 0 L-2.2 -2.2 Z"
    transform={`translate(${x} ${y}) scale(${s})`}
    className={`${INK} fig-pulse`}
    {...L}
  />
);

/** Vertical dimension bracket. */
const VBracket = ({ x, y1, y2, cls = SUB }: { x: number; y1: number; y2: number; cls?: string }) => (
  <path d={`M${x} ${y1} V${y2} M${x - 4} ${y1} H${x + 4} M${x - 4} ${y2} H${x + 4}`} className={cls} {...L} />
);

// Dog pose shared by the video frame and the keypoint skeleton (side view, facing right).
const DOG = { tail: [-26, -15], hip: [-20, -6], shoulder: [0, -7], neck: [5, -13], head: [12, -17], f1: [-27, 9], f2: [-15, 9], f3: [-5, 9], f4: [7, 9] } as const;
const BONES: [keyof typeof DOG, keyof typeof DOG][] = [["tail", "hip"], ["hip", "shoulder"], ["shoulder", "neck"], ["neck", "head"], ["hip", "f1"], ["hip", "f2"], ["shoulder", "f3"], ["shoulder", "f4"]];

function Dog({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M-26 -15 C-24 -10 -22 -7 -19 -6 C-12 -8 -4 -8 1 -7 C3 -11 5 -14 8 -17 L11 -21 L13 -17 L17 -15 C18 -13 16 -12 13 -12 C10 -11 8 -9 6 -6 C5 -2 3 0 1 1 L1 9 M-3 1 L-2 9 M-18 0 L-22 9 M-14 1 L-15 9 M-19 -1 C-12 1 -6 1 -2 1"
        className={INK}
        {...L}
      />
      <circle cx={12.5} cy={-15} r={0.9} className={SOLID} />
    </g>
  );
}

function Skeleton({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(1.2)`}>
      {BONES.map(([a, b]) => <path key={a + b} d={`M${DOG[a][0]} ${DOG[a][1]} L${DOG[b][0]} ${DOG[b][1]}`} className={SUB} {...L} strokeWidth={1.2} />)}
      {Object.entries(DOG).map(([k, [cx, cy]], i) => (
        <circle key={k} cx={cx} cy={cy} r={2.4} className={`${WHITE} ${ACC} fig-pulse`} {...F} style={{ animationDelay: `${-i * 0.22}s` }} />
      ))}
    </g>
  );
}

/* ── figures ─────────────────────────────────────────────────────────────────────────── */

const STYLE_PATH = "M16 88 C30 88 34 36 56 38 C74 40 70 64 90 60 C112 56 108 24 130 26 C152 28 148 88 168 88";

const FIGURES: Record<string, ReactNode> = {
  // Pattern → Component → Foundation: references only go down
  downward: (
    <>
      {[16, 48, 80].map((y, i) => (
        <g key={y}>
          <rect x="66" y={y} width="96" height="24" rx="8" className={`${BG} ${INK}`} {...F} />
          {i === 0 && [82, 90, 98].map((cx) => <circle key={cx} cx={cx} cy={y + 12} r={2.2} className={SOLID} />)}
          {i === 1 && <rect x="77" y={y + 6} width="20" height="12" rx="5" className={INK} {...L} />}
          {i === 2 && <path d={`M77 ${y + 15} L83 ${y + 9} L89 ${y + 15} L95 ${y + 9}`} className={INK} {...L} />}
          <path d={`M108 ${y + 9} H148 M108 ${y + 15} H136`} className={SUB} {...L} />
        </g>
      ))}
      <Arrow d="M182 22 V40" x={182} y={42} deg={90} />
      <Arrow d="M182 54 V72" x={182} y={74} deg={90} />
      <path d="M46 98 V24" className={SUB} {...L} strokeDasharray="1 5" />
      <path d="M42 28 L46 22 L50 28" className={SUB} {...L} />
      <path d="M40 54 L52 66 M52 54 L40 66" className={INK} {...L} />
    </>
  ),
  // the value moves only inside the SHOULD band; MUST edges are fixed
  "values-only": (
    <>
      <path d="M30 70 H210" className={INK} {...L} />
      {[30, 210].map((x) => (
        <g key={x}>
          <rect x={x - 4} y="50" width="8" height="40" rx="3" className={`${BG} ${INK}`} {...F} />
          {[56, 64, 72, 80].map((y) => <path key={y} d={`M${x - 3} ${y + 4} L${x + 3} ${y}`} className={INK} {...L} strokeWidth={1} />)}
        </g>
      ))}
      <path d="M80 70 H160" className={ACC} {...L} strokeWidth={3} />
      <path d="M80 62 V78 M160 62 V78" className={ACC} {...L} />
      <g className="fig-slide">
        <circle cx="120" cy="70" r="8" className={`${BG} ${INK}`} {...F} />
        <circle cx="120" cy="70" r="2.2" className={SOLID} />
      </g>
      <path d="M100 44 H140" className={ACC} {...L} strokeDasharray="1 5" />
      <path d="M104 40 L100 44 L104 48 M136 40 L140 44 L136 48" className={ACC} {...L} />
    </>
  ),
  // one behaviour → two different bodies
  body: (
    <>
      <Ground x1={92} />
      <rect x="14" y="40" width="52" height="36" rx="8" className={`${BG} ${INK}`} {...F} />
      <path d="M22 64 C30 64 32 50 40 50 C48 50 50 64 58 64" className={ACC} {...L} />
      <Arrow d="M70 52 C86 52 90 38 104 36" x={106} y={36} deg={-10} />
      <Arrow d="M70 64 C88 64 100 76 150 80" x={152} y={80} deg={6} />
      <g transform="translate(98 0) scale(0.82) translate(0 22)">
        <Desk x={20} nod />
      </g>
      <Rover x={192} />
    </>
  ),
  // one JSON source → web page + AI input
  "one-source": (
    <>
      <Source x={120} y={24} />
      <path d="M108 42 C108 54 68 50 68 62" className={`fig-flow ${ACC}`} {...L} />
      <path d="M132 42 C132 54 172 50 172 62" className={`fig-flow ${ACC}`} {...L} />
      <Browser x={24} y={62} w={88} h={48} />
      <path d="M33 82 H66" className={INK} {...L} strokeWidth={2.4} />
      <path d="M33 90 H92 M33 96 H80" className={SUB} {...L} />
      <rect x="33" y="101" width="20" height="5" rx="2.5" className={ACC} {...L} />
      <rect x="128" y="62" width="88" height="48" rx="8" className={`${BG} ${INK}`} {...F} />
      <Sparkle x={146} y={84} />
      <path d="M162 76 H200 M168 84 H206 M168 92 H194" className={SUB} {...L} />
      <path d="M162 84 H164 M162 92 H164" className={INK} {...L} />
      <Check x={120} y={86} />
    </>
  ),
  // many robot forms
  "many-forms": (
    <>
      <Ground />
      <Desk x={46} />
      <path d="M92 26 A14 14 0 0 1 96 40" className={ACC} {...L} />
      <Rover x={128} />
      <path d="M96 78 H102 M94 85 H100" className={ACC} {...L} />
      <Walker x={192} />
      <path d="M172 40 l-3 -4 M192 34 V29 M212 40 l3 -4" className={ACC} {...L} />
    </>
  ),
  // dog video → keypoints → robot motion
  "ai-input": (
    <>
      <rect x="8" y="32" width="64" height="52" rx="9" className={`${BG} ${INK}`} {...F} />
      <Dog x={44} y={64} />
      <path d="M16 77 H64" className={SUB} {...L} />
      <path d="M16 77 H34" className={ACC} {...L} />
      <path d="M15.5 38.5 L20 41.5 L15.5 44.5 Z" className={SOLID} />
      <Arrow d="M78 58 H92" x={94} y={58} />
      <Skeleton x={126} y={62} />
      <Arrow d="M146 58 H160" x={162} y={58} />
      <g transform="translate(164 0) scale(0.82) translate(0 22)">
        <Desk x={20} nod />
      </g>
    </>
  ),
  // the same motion, two styles
  style: (
    <>
      <path d="M14 96 H170" className={SUB} {...L} />
      {[40, 66, 92, 118, 144].map((x) => <path key={x} d={`M${x} 96 V99`} className={SUB} {...L} />)}
      <path d="M16 88 C50 88 58 60 92 60 C126 60 134 88 168 88" className={SUB} {...L} strokeDasharray="1 5" />
      <path d={STYLE_PATH} pathLength={100} className={`fig-draw ${ACC}`} {...L} strokeWidth={2} />
      <circle r="3.6" className={`${SOLID} fig-ride`} style={{ offsetPath: `path("${STYLE_PATH}")` }} />
      <g className="fig-hop" style={pivot(206, 92)}>
        <Face x={206} y={72} w={38} h={32} r={13} />
        <path d="M190 48 l-4 -6 M206 45 V38 M222 48 l4 -6" className={ACC} {...L} />
      </g>
      <path d="M190 100 H222" className={SUB} {...L} />
    </>
  ),
  // people read it on the web
  web: (
    <>
      <Browser x={36} y={12} w={168} h={98} />
      <path d="M78 22 V110" className={SUB} {...L} />
      <path d="M46 34 H68 M46 44 H64 M46 54 H68 M46 64 H60" className={SUB} {...L} />
      <path d="M46 34 H68" className={INK} {...L} strokeWidth={2.2} />
      <rect x="88" y="30" width="104" height="44" rx="6" className={`${WHITE} ${SUB}`} {...F} />
      <g transform="translate(93 18) scale(0.52)">
        <Desk x={20} />
      </g>
      <path d="M150 42 H182 M150 50 H176 M150 58 H170" className={SUB} {...L} />
      <path d="M88 86 H140" className={INK} {...L} strokeWidth={2.2} />
      <path d="M88 96 H180 M88 103 H160" className={SUB} {...L} />
      <g className="fig-tap">
        <path d="M176 70 L176 90 L181 85.5 L185 94 L188.5 92.5 L184.5 84 L191 83.5 Z" className={`${WHITE} ${INK}`} {...F} />
      </g>
      <path d="M168 64 l-4 -4 M176 61 V55 M184 64 l4 -4" className={`${ACC} fig-pulse`} {...L} />
    </>
  ),
  // time and angle are absolute
  perceived: (
    <>
      <circle cx="70" cy="64" r="30" className={`${BG} ${INK}`} {...F} />
      <path d="M64 30 H76 M70 30 V34" className={INK} {...L} />
      <path d="M93 41 L98 36" className={INK} {...L} />
      {[0, 90, 180, 270].map((a) => <path key={a} d="M70 38 V42" transform={`rotate(${a} 70 64)`} className={SUB} {...L} />)}
      <path d="M70 64 V44 A20 20 0 0 1 88 56" className={ACC} {...L} strokeWidth={2} />
      <g className="fig-tick" style={pivot(70, 64)}>
        <path d="M70 64 V46" className={INK} {...L} strokeWidth={2} />
      </g>
      <circle cx="70" cy="64" r="2.4" className={SOLID} />
      <path d="M132 96 H214" className={SUB} {...L} />
      <g className="fig-tilt" style={pivot(140, 96)}>
        <path d="M140 96 L198 58" className={INK} {...L} strokeWidth={2} />
        <Face x={202} y={52} w={22} h={18} r={7} />
      </g>
      <path d="M170 96 A30 30 0 0 0 165 80" className={ACC} {...L} strokeWidth={2} />
      <circle cx="140" cy="96" r="2.4" className={SOLID} />
    </>
  ),
  // distance as a ratio of body height
  "body-ratio": (
    <>
      <Ground x1={16} />
      <VBracket x={22} y1={28} y2={100} />
      <Desk x={50} />
      <path d="M104 100 V88 M104 92 H200" className={ACC} {...L} />
      <path d="M196 88 L200 92 L196 96" className={ACC} {...L} />
      <path d="M108 88 L104 92 L108 96" className={ACC} {...L} />
      <path d="M104 80 H140" className={SUB} {...L} strokeDasharray="1 5" />
      <g className="fig-bob">
        <circle cx="200" cy="72" r="7" className={`${BG} ${INK}`} {...F} />
        <path d="M200 79 V100" className={INK} {...L} />
      </g>
    </>
  ),
  // pipeline 1: the dog clip is read as one behaviour out of the candidates
  recognize: (
    <>
      <rect x="10" y="34" width="64" height="52" rx="9" className={`${BG} ${INK}`} {...F} />
      <Dog x={46} y={66} />
      <path d="M18 79 H66" className={SUB} {...L} />
      <path d="M18 79 H38" className={ACC} {...L} />
      <Arrow d="M80 60 H94" x={96} y={60} />
      <rect x="104" y="22" width="118" height="76" rx="10" className={`${WHITE} ${SUB}`} {...F} />
      {[38, 60, 82].map((y) => (
        <g key={y}>
          <circle cx="118" cy={y} r="4" className={`${y === 60 ? SOLID : BG} ${INK}`} {...F} />
          <path d={`M130 ${y} H${y === 60 ? 186 : 170}`} className={y === 60 ? INK : SUB} {...L} strokeWidth={y === 60 ? 2.2 : 1.5} />
        </g>
      ))}
      <rect x="109" y="50" width="108" height="20" rx="7" className={ACC} {...L} />
      <Check x={204} y={60} />
    </>
  ),
  // pipeline 2: keypoints → six measured signature values (P1 to P6)
  measure: (
    <>
      <Skeleton x={62} y={68} />
      <Ground x1={24} x2={96} y={84} />
      <Arrow d="M100 60 H112" x={114} y={60} />
      <path d="M122 98 H220" className={SUB} {...L} />
      {[44, 30, 56, 22, 40, 50].map((h, i) => (
        <rect
          key={i}
          x={126 + i * 15.5}
          y={96 - h}
          width={10}
          height={h}
          rx={4}
          className={`fig-grow ${i % 2 ? BG : WHITE} ${INK}`}
          {...F}
          style={{ ...pivot(131 + i * 15.5, 96), animationDelay: `${-i * 0.3}s` }}
        />
      ))}
      <path d="M126 30 C150 22 170 40 216 24" className={ACC} {...L} strokeDasharray="1 5" />
    </>
  ),
  // pipeline 3: source parts map onto this robot's roles
  retarget: (
    <>
      <Skeleton x={60} y={64} />
      <Ground x1={20} x2={92} y={80} />
      <Arrow d="M78 42 C110 26 150 30 176 40" x={178} y={41} deg={14} />
      <Arrow d="M38 56 C80 98 120 100 152 96" x={154} y={96} deg={-4} />
      <Ground x1={148} x2={226} />
      <g transform="translate(150 0) scale(0.9) translate(0 11)">
        <Desk x={20} nod />
      </g>
    </>
  ),
  // pipeline 5: an irregular source is clamped back inside the allowed band
  guardrail: (
    <>
      <path d="M14 34 H226 M14 86 H226" className={SUB} {...L} strokeDasharray="1 5" />
      <path d="M14 30 V38 M14 82 V90 M226 30 V38 M226 82 V90" className={INK} {...L} />
      <path d="M18 60 L30 42 L38 70 L48 18 L58 76 L70 30 L80 100 L92 44 L104 72 L116 22 L128 64 L140 98 L152 50 L164 70 L176 24 L188 84 L200 60" className={SUB} {...L} />
      <path d="M18 60 C38 60 38 36 58 36 C78 36 78 84 98 84 C118 84 118 36 138 36 C158 36 158 84 178 84 C194 84 194 60 206 60" pathLength={100} className={`fig-draw ${ACC}`} {...L} strokeWidth={2} />
      <Check x={214} y={60} />
    </>
  ),
  // face size as a ratio of screen height
  "face-ratio": (
    <>
      <rect x="62" y="14" width="104" height="92" rx="26" className={`${BG} ${INK}`} {...F} />
      <rect x="72" y="24" width="84" height="72" rx="18" className={`${WHITE} ${INK}`} {...F} />
      <g className="fig-blink">
        <rect x="94" y="46" width="12" height="28" rx="6" className={SOLID} />
        <rect x="122" y="46" width="12" height="28" rx="6" className={SOLID} />
      </g>
      <VBracket x={182} y1={24} y2={96} />
      <VBracket x={46} y1={46} y2={74} cls={ACC} />
      <path d="M52 46 H86 M52 74 H86" className={ACC} {...L} strokeDasharray="1 5" />
    </>
  ),
};

/** Evidence strength: n of 4 bars filled. */
function Strength({ n }: { n: number }) {
  return (
    <>
      <Ground x1={60} x2={180} y={100} />
      {[0, 1, 2, 3].map((i) => {
        const h = 20 + i * 18;
        const on = i < n;
        return (
          <rect
            key={i}
            x={76 + i * 24}
            y={96 - h}
            width={16}
            height={h}
            rx={5}
            className={on ? `${i === n - 1 ? "fig-grow" : ""} ${SOLID} ${INK}` : `${BG} ${SUB}`}
            {...F}
            strokeDasharray={on ? undefined : "1 4"}
            style={on ? pivot(84 + i * 24, 96) : undefined}
          />
        );
      })}
    </>
  );
}

/** fit: scale the art to the card width (narrow cards, e.g. the five pipeline steps) instead of a fixed 300 px. */
export function Figure({ name, fit }: { name?: string; fit?: boolean }) {
  if (!name) return null;
  const strength = name.match(/^strength-(\d)$/);
  const art = strength ? <Strength n={Number(strength[1])} /> : FIGURES[name];
  if (!art) return null;
  return (
    <div aria-hidden className={`flex items-center justify-center overflow-hidden rounded-[14px] bg-[var(--home-sidebar)] ${fit ? "aspect-[2/1] p-[var(--space-8)]" : "h-[148px]"}`}>
      <svg viewBox="0 0 240 120" {...(fit ? { className: "h-full w-full" } : { width: 300, height: 150 })}>{art}</svg>
    </div>
  );
}
