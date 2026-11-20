// Small card illustrations for guideline cards (block.figures keys). Flat shapes in token colours, 160 × 72 viewBox,
// no text-heavy art: each one shows the idea of its card at a glance.

const INK = "fill-[var(--home-ink)]";
const MID = "fill-[var(--sage-300)]";
const SOFT = "fill-[var(--sage-100)]";
const LINE = "fill-[var(--home-line)]";
const STROKE = "stroke-[var(--home-ink-3)]";
const S = { strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;

/** Arrowhead pointing along +x from (x, y), rotated by deg. */
const Head = ({ x, y, deg = 0 }: { x: number; y: number; deg?: number }) => (
  <path d="M-5 -4 L0 0 L-5 4" transform={`translate(${x} ${y}) rotate(${deg})`} className={STROKE} {...S} />
);

const FIGURES: Record<string, React.ReactNode> = {
  // Pattern → Component → Foundation, references only go down
  downward: (
    <>
      <rect x="34" y="6" width="76" height="14" rx="5" className={LINE} />
      <rect x="34" y="29" width="76" height="14" rx="5" className={MID} />
      <rect x="34" y="52" width="76" height="14" rx="5" className={INK} />
      <path d="M128 10 V60" className={STROKE} {...S} />
      <Head x={128} y={62} deg={90} />
    </>
  ),
  // value moves only inside the SHOULD band; MUST edges are fixed
  "values-only": (
    <>
      <rect x="14" y="33" width="132" height="6" rx="3" className={LINE} />
      <rect x="48" y="33" width="64" height="6" rx="3" className={MID} />
      <rect x="12" y="24" width="4" height="24" rx="2" className="fill-[var(--red-500)]" />
      <rect x="144" y="24" width="4" height="24" rx="2" className="fill-[var(--red-500)]" />
      <circle cx="88" cy="36" r="8" className={INK} />
      <path d="M66 18 H110" className={STROKE} {...S} />
      <Head x={112} y={18} />
      <Head x={64} y={18} deg={180} />
    </>
  ),
  // one behaviour → two different bodies
  body: (
    <>
      <circle cx="30" cy="36" r="11" className={MID} />
      <path d="M42 32 C62 22 74 18 92 18 M42 40 C62 50 74 54 92 54" className={STROKE} {...S} />
      <path d="M100 26 L114 12 L132 18 L146 10" className={STROKE} {...S} />
      {[[100, 26], [114, 12], [132, 18], [146, 10]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="4" className={INK} />)}
      <rect x="100" y="46" width="44" height="12" rx="6" className={INK} />
      <circle cx="108" cy="62" r="5" className={MID} />
      <circle cx="136" cy="62" r="5" className={MID} />
    </>
  ),
  // one JSON source → web page + AI input
  "one-source": (
    <>
      <rect x="12" y="18" width="40" height="36" rx="8" className={INK} />
      <path d="M26 28 C22 28 23 36 20 36 C23 36 22 44 26 44 M38 28 C42 28 41 36 44 36 C41 36 42 44 38 44" className="stroke-[var(--neutral-0)]" {...S} strokeWidth={1.8} />
      <path d="M56 36 C76 36 80 20 98 20 M56 36 C76 36 80 52 98 52" className={STROKE} {...S} />
      <rect x="102" y="8" width="46" height="24" rx="6" className={SOFT} />
      <rect x="108" y="15" width="24" height="3" rx="1.5" className={MID} />
      <rect x="108" y="22" width="32" height="3" rx="1.5" className={LINE} />
      <rect x="102" y="40" width="46" height="24" rx="6" className={MID} />
      <path d="M125 45 L127.5 51 L134 52 L127.5 54 L125 60 L122.5 54 L116 52 L122.5 51 Z" className="fill-[var(--neutral-0)]" />
    </>
  ),
  // stand · wheeled · legged
  "many-forms": (
    <>
      <rect x="22" y="22" width="24" height="16" rx="6" className={INK} />
      <path d="M34 38 V52" className={STROKE} {...S} />
      <rect x="22" y="52" width="24" height="10" rx="5" className={MID} />
      <rect x="64" y="34" width="34" height="18" rx="8" className={INK} />
      <circle cx="70" cy="56" r="6" className={MID} />
      <circle cx="92" cy="56" r="6" className={MID} />
      <rect x="114" y="20" width="30" height="20" rx="8" className={INK} />
      <path d="M118 40 L114 60 M126 40 L126 60 M134 40 L134 60 M140 40 L144 60" className={STROKE} {...S} />
    </>
  ),
  // video → AI → robot
  "ai-input": (
    <>
      <rect x="10" y="20" width="40" height="32" rx="6" className={SOFT} />
      <path d="M26 29 L37 36 L26 43 Z" className={MID} />
      <path d="M56 36 H70" className={STROKE} {...S} />
      <Head x={72} y={36} />
      <path d="M90 26 L93 33 L100 36 L93 39 L90 46 L87 39 L80 36 L87 33 Z" className={MID} />
      <path d="M106 36 H116" className={STROKE} {...S} />
      <Head x={118} y={36} />
      <rect x="124" y="22" width="28" height="28" rx="9" className={INK} />
      <rect x="131" y="31" width="5" height="9" rx="2.5" className="fill-[var(--neutral-0)]" />
      <rect x="140" y="31" width="5" height="9" rx="2.5" className="fill-[var(--neutral-0)]" />
    </>
  ),
  // same motion, two styles
  style: (
    <>
      <path d="M12 46 C40 46 46 26 80 26 C114 26 120 46 148 46" className="stroke-[var(--home-line)]" {...S} strokeWidth={3} />
      <path d="M12 46 C30 46 34 14 52 16 C66 18 62 34 76 30 C92 26 92 10 108 12 C124 14 124 46 148 46" className="stroke-[var(--sage-400)]" {...S} strokeWidth={3} />
      <circle cx="148" cy="46" r="5" className={INK} />
    </>
  ),
  // the same data, readable on the web
  web: (
    <>
      <rect x="26" y="8" width="108" height="58" rx="8" className={SOFT} />
      <rect x="26" y="8" width="108" height="14" rx="7" className={MID} />
      {[36, 44, 52].map((x) => <circle key={x} cx={x} cy="15" r="2.5" className="fill-[var(--neutral-0)]" />)}
      <rect x="38" y="32" width="52" height="5" rx="2.5" className={INK} />
      <rect x="38" y="43" width="72" height="4" rx="2" className={LINE} />
      <rect x="38" y="52" width="60" height="4" rx="2" className={LINE} />
      <circle cx="116" cy="46" r="9" className={INK} />
      <path d="M112 46 L115 49 L120 43" className="stroke-[var(--neutral-0)]" {...S} />
    </>
  ),
  // time and angle are absolute
  perceived: (
    <>
      <circle cx="48" cy="36" r="24" className={SOFT} />
      <path d="M48 36 V20 M48 36 L58 42" className="stroke-[var(--home-ink)]" {...S} strokeWidth={2.5} />
      <circle cx="48" cy="36" r="3" className={INK} />
      <path d="M100 58 H148" className={STROKE} {...S} />
      <path d="M100 58 L140 30" className="stroke-[var(--home-ink)]" {...S} strokeWidth={2.5} />
      <path d="M126 58 A26 26 0 0 0 122 44" className="stroke-[var(--sage-400)]" {...S} strokeWidth={2.5} />
    </>
  ),
  // distance as a ratio of body height
  "body-ratio": (
    <>
      <rect x="40" y="8" width="18" height="56" rx="6" className={INK} />
      <path d="M30 8 V64 M26 8 H34 M26 64 H34" className={STROKE} {...S} />
      <rect x="72" y="47" width="72" height="6" rx="3" className={LINE} />
      <rect x="72" y="47" width="22" height="6" rx="3" className={MID} />
      <circle cx="94" cy="50" r="6" className={INK} />
    </>
  ),
  // face size as a ratio of screen height
  "face-ratio": (
    <>
      <rect x="40" y="8" width="80" height="56" rx="16" className={INK} />
      <rect x="62" y="26" width="12" height="20" rx="6" className="fill-[var(--neutral-0)]" />
      <rect x="86" y="26" width="12" height="20" rx="6" className="fill-[var(--neutral-0)]" />
      <path d="M130 26 V46 M126 26 H134 M126 46 H134" className="stroke-[var(--sage-400)]" {...S} />
      <path d="M144 8 V64 M140 8 H148 M140 64 H148" className={STROKE} {...S} />
    </>
  ),
};

/** Evidence strength: n of 4 bars filled. */
function Strength({ n }: { n: number }) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={44 + i * 20} y={52 - i * 12} width="12" height={12 + i * 12} rx="4" className={i < n ? (n === 4 ? INK : MID) : LINE} />
      ))}
    </>
  );
}

export function Figure({ name }: { name?: string }) {
  if (!name) return null;
  const strength = name.match(/^strength-(\d)$/);
  const art = strength ? <Strength n={Number(strength[1])} /> : FIGURES[name];
  if (!art) return null;
  return (
    <div aria-hidden className="flex h-[96px] items-center justify-center rounded-[14px] bg-[var(--home-sidebar)]">
      <svg viewBox="0 0 160 72" width={160} height={72}>{art}</svg>
    </div>
  );
}
