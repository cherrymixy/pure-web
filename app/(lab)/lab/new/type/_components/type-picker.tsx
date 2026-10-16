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
  return (
    <button
      type="button"
      disabled={!type.selectable}
      aria-pressed={type.selectable ? selected : undefined}
      onClick={onSelect}
      title={type.selectable ? undefined : S.onlyFixed}
      data-testid={`type-card-${type.id}`}
      className={`relative flex flex-col overflow-hidden rounded-[var(--radius-xl)] text-left transition-shadow disabled:cursor-default ${
        selected ? "bg-[var(--sage-800)]" : "bg-[var(--bg-surface)] hover:shadow-[var(--pure-shadow-card)]"
      }`}
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-[var(--sage-50)]">
        <CardArt type={type.id} />
      </div>
      <div className="flex flex-col pb-[23.5px] pl-[28.5px] pr-[var(--space-16)] pt-[23px]">
        <span className={`whitespace-nowrap text-[28px] font-semibold leading-[36px] ${selected ? "text-[var(--text-on-inverse)]" : "text-[var(--sage-800)]"}`}>
          {type.name}
        </span>
        <span className={`whitespace-nowrap text-[16px] leading-[20px] ${selected ? "text-[var(--text-tertiary)]" : "text-[var(--sage-500)]"}`}>
          {copy?.summary ?? type.description}
        </span>
        <span className="mt-[21px] text-[14px] leading-[18px] text-[var(--text-tertiary)]">{S.jointsLabel}</span>
        <span className={`mt-[2.4px] whitespace-nowrap text-[18px] font-medium leading-[22px] ${selected ? "text-[var(--text-on-inverse)]" : "text-[var(--sage-800)]"}`}>
          {copy?.joints ?? type.dof}
        </span>
        <span className="mt-[20.85px] text-[14px] leading-[18px] text-[var(--text-tertiary)]">{S.channelsLabel}</span>
        <span className="mt-[6.5px] flex flex-wrap gap-[var(--space-8)]">
          {CHANNELS.filter((c) => type.channels.includes(c)).map((c) => (
            <span
              key={c}
              className={`rounded-[var(--radius-sm)] px-[var(--space-12)] py-[var(--space-8)] text-[14px] leading-[18px] ${
                selected ? "bg-[var(--neutral-700)] text-[var(--text-on-inverse)]" : "bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
              }`}
            >
              {CHANNEL_LABEL[c]}
            </span>
          ))}
        </span>
      </div>
      {selected && (
        <>
          <span className="pointer-events-none absolute inset-0 rounded-[var(--radius-xl)] border-[3px] border-[var(--sage-800)]" />
          <span className="absolute right-[24.5px] top-[20.4px] flex size-[41px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--sage-800)]">
            <Icon name="check-badge" size={20.4} className="text-[var(--icon-on-inverse)]" />
          </span>
        </>
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

  return (
    <div className="flex min-h-screen flex-col pl-[48px] pt-[var(--space-40)]">
      <Link
        href="/lab"
        className="flex w-fit items-center gap-[var(--space-12)] h-[48px] rounded-[var(--radius-full)] border-2 border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-16)] text-[16px] leading-[20px] font-medium text-[var(--text-link)] hover:bg-[var(--neutral-50)]"
      >
        <span aria-hidden>←</span>
        <span>{STRINGS.sidebar.lab}</span>
      </Link>

      <div className="ml-[55px] flex w-[1714px] flex-1 flex-col">
      <header className="mt-[21px] flex flex-col gap-[12px]">
        <h1 className="text-[52px] font-semibold leading-[66px] text-[var(--sage-800)]">{S.title}</h1>
        <p className="text-[22px] leading-[28px] text-[var(--sage-500)]">{S.body}</p>
      </header>

      <div className="mt-[72px] grid grid-cols-[repeat(5,326.5px)] gap-[20.4px]">
        {ORDERED.map((t) => (
          <TypeCard key={t.id} type={t} selected={t.selectable && selected} onSelect={() => t.selectable && setSelected(!selected)} />
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pb-[65px] pt-[var(--space-40)]">
        <p className="flex items-center gap-[var(--space-8)] text-[18px] leading-[22px] text-[var(--sage-500)]">
          <Icon name="info-small" size={20} className="text-[var(--sage-500)]" />
          {S.note}
        </p>
        <div className="flex items-center gap-[var(--space-32)]">
          <Link href="/lab/new/import" className="text-[18px] leading-[22px] text-[var(--text-link)] underline">
            {S.importInstead}
          </Link>
          <button
            type="button"
            disabled={!selected || busy}
            onClick={start}
            className="flex h-[56px] w-[335px] items-center gap-[var(--space-12)] rounded-[var(--radius-full)] bg-[var(--neutral-800)] py-[var(--space-12)] pl-[var(--space-32)] pr-[var(--space-16)] text-[20px] font-medium leading-[26px] text-[var(--neutral-100)] hover:bg-[var(--neutral-700)] disabled:cursor-not-allowed disabled:bg-[var(--bg-disabled)] disabled:text-[var(--text-disabled)]"
          >
            {S.continue}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
