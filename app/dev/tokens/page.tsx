// @implemented
import Link from "next/link";
import { EFFECTS, PRIMITIVES, RADIUS, SEMANTIC, SPACE, TYPOGRAPHY, cssVar } from "@/lib/ui/tokens";
import { ICONS, Icon, type IconName } from "@/components/ui/icons/icon";

const FIGMA_IMAGES = [
  "landing-hero", "landing-robot", "type-full-body", "type-joint-walking", "type-joint-driving",
  "type-jointless-driving", "type-joint-fixed", "project-thumb-desk", "project-thumb-bear", "stage-shadow", "robot-pure-desk",
];

// STEP 20 check page: every token rendered from its CSS variable, to compare 1:1 with Figma.
export default function DevTokensPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 p-10">
      <div className="flex items-baseline gap-4">
        <h1 className="text-2xl font-semibold">/dev/tokens</h1>
        <span className="text-sm text-neutral-500">Figma Design System 70:1520 · styles/tokens.css · docs/tokens.md</span>
        <Link href="/dev" className="ml-auto text-sm underline">/dev</Link>
      </div>

      <Section title="Color — semantic (Light)">
        <Chips names={Object.keys(SEMANTIC)} values={SEMANTIC} />
      </Section>
      <Section title="Color — primitives">
        <Chips names={Object.keys(PRIMITIVES)} values={PRIMITIVES} />
      </Section>

      <Section title="Typography — Google Sans Flex">
        <div className="flex flex-col gap-3">
          {Object.entries(TYPOGRAPHY).map(([key, t]) => (
            <div key={key} className="flex items-baseline gap-6 border-b border-neutral-100 pb-2">
              <span className="w-40 shrink-0 font-mono text-xs text-neutral-500">{t.figma}</span>
              <span
                style={{ fontFamily: "var(--font-family-pure)", fontSize: `var(--pure-${key}-size)`, lineHeight: `var(--pure-${key}-line-height)`, fontWeight: `var(--pure-${key}-weight)` }}
              >
                Pure motion, is its own signature.
              </span>
              <span className="ml-auto shrink-0 font-mono text-xs text-neutral-400">{t.size}/{t.lineHeight} · {t.weight}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Icons — ${Object.keys(ICONS).length} (F / Icon + web prototype)`}>
        <div className="grid grid-cols-8 gap-3" data-testid="icon-grid">
          {(Object.keys(ICONS) as IconName[]).map((name) => (
            <div key={name} className="flex flex-col items-center gap-2 rounded p-3" style={{ background: cssVar("bg/surface-muted") }}>
              <span style={{ color: cssVar("icon/primary") }}><Icon name={name} size={24} /></span>
              <span className="font-mono text-[10px]">{name}</span>
              <span className="font-mono text-[10px] text-neutral-400">{ICONS[name].width}×{ICONS[name].height}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span style={{ color: cssVar("icon/brand") }}><Icon name="smart_toy" /></span>
          <span style={{ color: cssVar("icon/secondary") }}><Icon name="settings" /></span>
          <span className="rounded p-1" style={{ background: cssVar("bg/brand"), color: cssVar("icon/on-brand") }}><Icon name="play_arrow" /></span>
          <span className="font-mono text-xs text-neutral-400">icon/brand · icon/secondary · icon/on-brand (currentColor)</span>
        </div>
      </Section>

      <Section title="Images — Figma @2x exports (public/figma)">
        <div className="grid grid-cols-4 gap-4">
          {FIGMA_IMAGES.map((name) => (
            <figure key={name} className="flex flex-col gap-1 text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/figma/${name}@2x.png`} alt={name} className="h-40 w-full rounded object-contain" style={{ background: cssVar("bg/canvas") }} />
              <figcaption className="font-mono">{name}@2x.png</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section title="Spacing — 4 px grid">
        <div className="flex flex-col gap-2">
          {SPACE.map((v) => (
            <div key={v} className="flex items-center gap-4">
              <span className="w-24 font-mono text-xs">space/{v}</span>
              <span className="h-6" style={{ width: `calc(var(--space-${v}) * 4)`, background: cssVar("bg/brand"), borderRadius: "6px" }} />
              <span className="font-mono text-xs text-neutral-400">{v}px (bar ×4)</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radius">
        <div className="flex flex-wrap gap-6">
          {Object.entries(RADIUS).map(([k, v]) => (
            <div key={k} className="flex flex-col items-center gap-1">
              <span className="h-20 w-20" style={{ background: cssVar("bg/brand-subtle"), border: `1px solid ${cssVar("bg/brand")}`, borderRadius: `var(--radius-${k})` }} />
              <span className="font-mono text-xs">radius/{k} · {v}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Effect">
        <div className="flex flex-wrap gap-8 p-6" style={{ background: cssVar("bg/canvas") }}>
          <Effect label={EFFECTS["shadow-card"].figma} style={{ boxShadow: "var(--pure-shadow-card)" }} />
          <Effect label={EFFECTS["shadow-float"].figma} style={{ boxShadow: "var(--pure-shadow-float)" }} />
          <div className="relative h-28 w-48 overflow-hidden rounded-md" style={{ background: `linear-gradient(135deg, ${cssVar("sage/400")}, ${cssVar("blue/300")})` }}>
            <div className="absolute inset-4 flex items-center justify-center rounded-md text-xs" style={{ background: cssVar("bg/overlay"), backdropFilter: "blur(var(--pure-blur-overlay))", color: cssVar("text/on-inverse") }}>
              {EFFECTS["blur-overlay"].figma} (TODO)
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Chips({ names, values }: { names: string[]; values: Record<string, string> }) {
  return (
    <div className="grid grid-cols-6 gap-3">
      {names.map((n) => (
        <div key={n} className="flex flex-col gap-1 text-xs">
          <span className="h-12 rounded border border-neutral-200" style={{ background: cssVar(n) }} />
          <span className="font-mono">{n}</span>
          <span className="font-mono text-neutral-400">{values[n]}</span>
        </div>
      ))}
    </div>
  );
}

function Effect({ label, style }: { label: string; style: React.CSSProperties }) {
  return (
    <div className="flex h-28 w-48 items-center justify-center rounded-md text-xs" style={{ background: cssVar("bg/surface"), ...style }}>
      {label}
    </div>
  );
}
