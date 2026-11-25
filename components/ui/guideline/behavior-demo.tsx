// A front-view robot acting out a Components behavior (globals.css .bhv-*). Amplitude = --amp on any parent (Intensity level).
// It rests on the behavior's key pose and plays inside a hovered .group or a playing [data-playing="true"] stage.

/** behavior slug → which part moves (head / body / eyes) and its keyframes; several parts may move. */
const MOVES: Record<string, Partial<Record<"head" | "body" | "eyes", string>>> = {
  approach: { body: "bhv-approach" },
  bow: { head: "bhv-bow" },
  close: { head: "bhv-sink", eyes: "bhv-close" },
  curious: { head: "bhv-tilt" },
  doze: { head: "bhv-doze", eyes: "bhv-close" },
  fear: { body: "bhv-fear" },
  joy: { body: "bhv-hop" },
  "keep-distance": { body: "bhv-back" },
  laugh: { body: "bhv-laugh", eyes: "bhv-squint" },
  nod: { head: "bhv-nod" },
  point: { head: "bhv-point" },
  rub: { body: "bhv-rub" },
  sad: { head: "bhv-sink", eyes: "bhv-squint" },
  shake: { head: "bhv-shake" },
  stretch: { body: "bhv-stretch" },
  surprise: { body: "bhv-jump", eyes: "bhv-wide" },
};

export const hasBehaviorDemo = (slug?: string) => Boolean(slug && slug in MOVES);

export function BehaviorDemo({ slug, className = "block h-full w-full" }: { slug: string; className?: string }) {
  const m = MOVES[slug];
  if (!m) return null;
  return (
    <svg aria-hidden viewBox="0 0 200 96" className={className}>
      <ellipse cx={100} cy={88} rx={34} ry={4} fill="var(--home-ink)" opacity={0.08} />
      <g className={m.body ? `bhv ${m.body}` : undefined} style={{ transformOrigin: "100px 88px" }}>
        <rect x={80} y={78} width={40} height={9} rx={4.5} fill="var(--home-ink)" opacity={0.85} />
        <line x1={100} y1={78} x2={100} y2={66} stroke="var(--home-ink)" strokeWidth={4} strokeLinecap="round" />
        <g className={m.head ? `bhv ${m.head}` : undefined} style={{ transformOrigin: "100px 66px" }}>
          <rect x={72} y={30} width={56} height={38} rx={13} fill="var(--home-ink)" />
          <g className={m.eyes ? `bhv ${m.eyes}` : undefined} style={{ transformOrigin: "100px 50px" }}>
            <rect x={87} y={43} width={8} height={14} rx={3} fill="var(--neutral-0)" />
            <rect x={105} y={43} width={8} height={14} rx={3} fill="var(--neutral-0)" />
          </g>
        </g>
      </g>
    </svg>
  );
}
