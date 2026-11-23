"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { ROBOT_TYPES, type RobotTypeInfo } from "@/data/robot-types";
import { STRINGS } from "@/data/strings";
import type { Channel, Job, Project, RobotType } from "@/lib/models";
import { api } from "@/lib/ui/api";
import { CHANNEL_LABEL } from "@/components/ui/channel-badges";
import { Icon } from "@/components/ui/icons/icon";
import { useToast } from "@/components/ui/toast";

const S = STRINGS.newType;
const CHANNELS: Channel[] = ["motion", "face", "sound"];

// Figma W02B-1 (901:8370) card order; types missing from the list keep data order at the end.
const ORDERED: RobotTypeInfo[] = [
  ...(S.order as readonly string[]).flatMap((id) => ROBOT_TYPES.filter((t) => t.id === id)),
  ...ROBOT_TYPES.filter((t) => !(S.order as readonly string[]).includes(t.id)),
];

// Card art geometry from Figma, in 960-frame units of the 163 image square → percentages so it scales with the card.
const ART = 163;
const box = (left: number, top: number, width: number, height: number): CSSProperties => ({
  left: `${(left / ART) * 100}%`,
  top: `${(top / ART) * 100}%`,
  width: `${(width / ART) * 100}%`,
  height: `${(height / ART) * 100}%`,
});
const crop = (left: number, top: number, width: number, height: number): CSSProperties => ({
  left: `${left}%`,
  top: `${top}%`,
  width: `${width}%`,
  height: `${height}%`,
});

function CardArt({ type }: { type: RobotType }) {
  const img = (src: string, style?: CSSProperties) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" src={src} className="absolute max-w-none" style={style} />
  );
  switch (type) {
    case "full-body":
      return (
        <div className="absolute overflow-hidden" style={box(1.26, -0.5, 162, 163.5)}>
          {img("/figma/type/full-body.png", crop(-0.15, -0.18, 100.09, 148.76))}
        </div>
      );
    case "joint-walking":
      return (
        <div className="absolute overflow-hidden" style={box(18, 28.5, 128.76, 118.5)}>
          {img("/figma/type/joint-walking.png", crop(-0.14, -17.74, 100.28, 128.84))}
        </div>
      );
    case "joint-driving":
      return (
        <div className="absolute" style={box(17.56, 10, 128.618, 153)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src="/figma/type/joint-driving.png" className="absolute inset-0 size-full max-w-none object-cover" />
        </div>
      );
    case "jointless-driving":
      return (
        <>
          <div className="absolute bg-[var(--bg-surface)]" style={box(49.69, 57.66, 43.22, 28.228)} />
          <div className="absolute overflow-hidden" style={box(25, 30, 113.82, 103)}>
            {img("/figma/type/jointless-driving.png", crop(-8.27, -28.32, 118.64, 156.09))}
          </div>
        </>
      );
    case "joint-fixed":
      // Arm art runs past the card top (clipped by the card), eye patches painted on top.
      return (
        <div className="absolute overflow-hidden" style={box(41.82, -14.5, 82.5, 170.5)}>
          <div className="absolute left-0 h-[96.19%] w-[89.78%] overflow-hidden" style={{ top: `${(6.5 / 170.5) * 100}%` }}>
            {img("/figma/type/joint-fixed.png", crop(-101.32, 0, 395.58, 223.33))}
          </div>
          <div className="absolute h-[8.5%] w-[9.09%] rounded-[var(--radius-2xs)] bg-[var(--bg-surface)]" style={{ left: "44.24%", top: "26.69%" }} />
          <div className="absolute h-[8.5%] w-[9.09%] rounded-[var(--radius-2xs)] bg-[var(--bg-surface)]" style={{ left: "27.88%", top: "26.69%" }} />
        </div>
      );
  }
}

function TypeCard({ type, selected, onSelect }: { type: RobotTypeInfo; selected: boolean; onSelect: () => void }) {
  const copy = S.cards[type.id as keyof typeof S.cards];
  // Lab card style (user review: match the Lab home / import): white, thin home-line border, canvas picture, Lab type scale;
  // selected = ink outline + check instead of the dark sage fill.
  return (
    <button
      type="button"
      disabled={!type.selectable}
      aria-pressed={type.selectable ? selected : undefined}
      onClick={onSelect}
      title={type.selectable ? undefined : S.onlyFixed}
      data-testid={`type-card-${type.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-[24px] border bg-[var(--neutral-0)] p-[var(--space-12)] text-left transition-[border-color,box-shadow] disabled:cursor-default ${
        selected ? "border-[var(--home-ink)] shadow-[0_0_0_1px_var(--home-ink)]" : "border-[var(--home-line)] enabled:hover:border-[var(--home-ink-3)]"
      }`}
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-[16px] bg-[var(--home-canvas)]">
        <CardArt type={type.id} />
      </div>
      <div className="flex flex-col gap-[var(--space-16)] px-[var(--space-8)] pb-[var(--space-8)] pt-[var(--space-20)]">
        <div className="flex flex-col gap-[2px]">
          <span className="whitespace-nowrap text-[22px] font-semibold text-[var(--home-ink)]">{type.name}</span>
          <span className="whitespace-nowrap text-[13px] text-[var(--home-ink-3)]">{copy?.summary ?? type.description}</span>
        </div>
        <div className="flex flex-col gap-[2px] border-t border-dashed border-[var(--home-line)] pt-[var(--space-12)]">
          <span className="text-[12px] font-medium text-[var(--home-ink-3)]">{S.jointsLabel}</span>
          <span className="whitespace-nowrap text-[15px] font-medium text-[var(--home-ink)]">{copy?.joints ?? type.dof}</span>
        </div>
        <div className="flex flex-col gap-[6px]">
          <span className="text-[12px] font-medium text-[var(--home-ink-3)]">{S.channelsLabel}</span>
          <span className="flex flex-wrap gap-[6px]">
            {CHANNELS.filter((c) => type.channels.includes(c)).map((c) => (
              <span key={c} className="rounded-[var(--radius-full)] bg-[var(--home-tag-bg)] px-[10px] py-[4px] text-[13px] font-medium text-[var(--home-tag-ink)]">
                {CHANNEL_LABEL[c]}
              </span>
            ))}
          </span>
        </div>
      </div>
      {selected && (
        <span className="absolute right-[var(--space-24)] top-[var(--space-24)] flex size-[36px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--home-ink)]">
          <Icon name="check-badge" size={18} className="text-[var(--neutral-0)]" />
        </span>
      )}
    </button>
  );
}

// W02B-1: five type cards, only Joint Fixed can be selected (others hover only).
// Figma 901:8370 ×2 (full-bleed, no sidebar): back pill at (48,40); content column 103→1817; title 52/semibold;
// cards 326.5 wide with 20.4 gaps from y 286; note + Continue (right-aligned to the last card) at y 959.
export function TypePicker({ initialSelected = false }: { initialSelected?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState(initialSelected);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      const project = await api<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: S.untitled, type: "joint-fixed", source: "pure-desk", status: "analyzing" }),
      });
      await api<Job>(`/api/projects/${project.id}/analyze`, { method: "POST", body: JSON.stringify({ source: "pure-desk" }) });
      router.push(`/lab/p/${project.id}/analyzing`);
    } catch {
      toast(STRINGS.lab.toast.failed);
      setBusy(false);
    }
  }

  // Lab UI (user review: same mood as the Lab home and the import sheet): Lab canvas + glow, glass back link, 60 title,
  // Lab cards, footer with a quiet note, a text link and the Lab dark button.
  return (
    <div data-fit-frame className="relative flex min-h-[var(--app-vh)] flex-col overflow-hidden bg-[var(--home-canvas)] px-[var(--space-40)] pb-[var(--space-40)] pt-[42px] leading-normal">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/lab/home/glow.svg" alt="" aria-hidden className="pointer-events-none absolute left-[26px] top-[-360px] h-[680px] w-[1360px] max-w-none" />
      <div className="relative flex flex-1 flex-col gap-[var(--space-40)]">
        <div className="flex flex-col gap-[var(--space-20)]">
          <Link
            href="/lab"
            className="flex h-[44px] w-fit items-center gap-[var(--space-8)] rounded-[var(--radius-sm)] bg-[var(--home-glass)] px-[var(--space-20)] text-[15px] font-medium text-[var(--home-ink)] hover:bg-[var(--neutral-0)]"
          >
            <span aria-hidden>←</span>
            {STRINGS.sidebar.lab}
          </Link>
          <header className="flex flex-col gap-[var(--space-8)]">
            <h1 className="text-[60px] font-semibold leading-[1.15] text-[var(--home-ink)]">{S.title}</h1>
            <p className="text-[17px] text-[var(--home-ink-2)]">{S.body}</p>
          </header>
        </div>

        <div className="grid grid-cols-5 gap-[16.483px]">
          {ORDERED.map((t) => (
            <TypeCard key={t.id} type={t} selected={t.selectable && selected} onSelect={() => t.selectable && setSelected(!selected)} />
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <p className="flex items-center gap-[var(--space-8)] text-[15px] text-[var(--home-ink-3)]">
            <Icon name="info-small" size={18} />
            {S.note}
          </p>
          <div className="flex items-center gap-[var(--space-24)]">
            <Link href="/lab/new/import" className="text-[15px] font-medium text-[var(--home-ink-2)] underline underline-offset-4 hover:text-[var(--home-ink)]">
              {S.importInstead}
            </Link>
            <button
              type="button"
              data-tour="type-continue"
              disabled={!selected || busy}
              onClick={start}
              className="flex h-[44px] items-center rounded-[var(--radius-sm)] bg-[var(--home-ink)] px-[22px] text-[15px] font-medium text-[var(--neutral-0)] hover:bg-[var(--neutral-800)] disabled:cursor-not-allowed disabled:border disabled:border-[var(--home-line)] disabled:bg-[var(--neutral-0)] disabled:text-[var(--home-ink-3)]"
            >
              {S.continue}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
