"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { componentForSim, guidelineSlugFor } from "@/data/components";
import { CATEGORY_PATTERNS, COMMUNITY_REVIEWS, COMMUNITY_STAGE_VIEW } from "@/data/community";
import { SITUATION_PATTERNS } from "@/data/patterns";
import { PURE_DESK_STRUCTURE } from "@/data/pure-desk";
import { referenceSetFor, type ReferenceChannel } from "@/data/reference-sets";
import { ROBOT_TYPES } from "@/data/robot-types";
import { STRINGS, fmt } from "@/data/strings";
import type { RobotType, UserDataMotion } from "@/lib/models";
import { api } from "@/lib/ui/api";
import type { JointState, SimController } from "@/components/sim/sim-controller";
import { Viewport, type ViewportEvent } from "@/components/sim/Viewport";
import { Icon, type IconName } from "@/components/ui/icons/icon";
import { ReferencedSets } from "@/components/ui/referenced-sets";
import { Modal, ModalActions, ModalButton } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { JointTable } from "../../../p/[id]/_components/panels";
import { behaviorLabel, usesLabel } from "../../_components/community-browser";

const U = STRINGS.community;
const E = STRINGS.editor;
type Tab = "motion" | "face" | "sound";

const clock = (sec: number) => (Number.isFinite(sec) ? `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}` : "–:––");

// Community motion detail (Figma 943:1619 "UI", ×1 board): full-bleed stage (top 265 → bottom) playing the motion,
// left Context panel 343×1016 at 32,32 (Reference · Component · Situation Pattern · User Review), title block at 425,68,
// right panel 380 wide at right 32 (Motion / Face / Sound · Joint · Bring to Lab), play bar centred at bottom 61.
// Panels are placed against the viewport like the editor (root zoom 0.67). The frame's Timeline panel is opacity 0 — not built.
export function MotionDetail({ motion, projects }: { motion: UserDataMotion; projects: { id: string; name: string; type: RobotType }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [picking, setPicking] = useState(false);
  const [tab, setTab] = useState<Tab>("motion");
  const [joints, setJoints] = useState<JointState[]>([]);
  const [time, setTime] = useState({ t: 0, duration: 0 });
  const [paused, setPaused] = useState(false);
  const [ctrlReady, setCtrlReady] = useState(false);
  const ctrl = useRef<SimController | null>(null);
  const playable = useMemo(() => ({ motion: { mode: "recipe" as const, recipe: { ...motion.preview, loop: true } } }), [motion.preview]);
  const behaviors = motion.preview.steps.map((s) => s.behavior);
  // Component rows open the guideline page of the component each simulator step plays for (like the editor's Context)
  const components = [...new Map(behaviors.map((b) => componentForSim(b)).filter((c) => c !== undefined).map((c) => [c.id, c])).values()];
  const patterns = CATEGORY_PATTERNS[motion.category].map((id) => SITUATION_PATTERNS.find((p) => p.id === id)).filter((p) => p !== undefined);

  async function use(projectId: string) {
    await api(`/api/user-data/${motion.id}/use`, { method: "POST" }).catch(() => {});
    toast(fmt(U.attached, { name: motion.name }));
    router.push(`/lab/p/${projectId}?ref=${encodeURIComponent(motion.id)}`);
  }

  /** Back to where the detail was opened from (list tab / scroll); straight to the list when opened directly */
  function back() {
    if (window.history.length > 1) router.back();
    else router.push("/lab/community");
  }

  function onEvent(e: ViewportEvent) {
    if (e.type === "ready") {
      ctrl.current?.setView(COMMUNITY_STAGE_VIEW);
      setCtrlReady(true);
    }
    if (e.type === "tick") setTime({ t: e.t, duration: e.duration });
    if (e.type === "jointState") {
      setJoints(e.joints);
      setPaused(ctrl.current?.isPaused() ?? false);
    }
  }

  function togglePlay() {
    const c = ctrl.current;
    if (!c) return;
    if (paused) c.play();
    else c.pause();
    setPaused(!paused);
  }

  const progress = time.duration > 0 && Number.isFinite(time.duration) ? Math.min(time.t / time.duration, 1) : 0;
  const sectionTitle = "flex items-center gap-[var(--space-8)] text-[18px] leading-[23px] text-[var(--neutral-800)]";
  const box = "flex w-full flex-col gap-[var(--space-12)] rounded-[var(--radius-lg)] bg-[var(--bg-canvas)] px-[18px] py-[14px]";
  const row = "flex w-full items-center justify-between text-[16px] leading-[20px] text-[var(--neutral-800)]";
  const tabTint: Record<Tab, string> = { motion: "text-[var(--text-primary)]", face: "text-[var(--web-e2a1c1)]", sound: "text-[var(--web-ecc377)]" };

  return (
    <div className="relative h-[var(--app-vh)] overflow-hidden">
      {/* Stage (Frame 2147240453: full width, 265 → bottom), same slot as the editor */}
      <div className="absolute inset-x-0 bottom-0 top-[265px]">
        <Viewport controllerRef={ctrl} structure={PURE_DESK_STRUCTURE} expression={playable} autoPlay mode="preview" onEvent={onEvent} className="block size-full" />
      </div>

      {/* Title block (943:1891 / 2030 / 1890) */}
      <div className="absolute left-[425px] top-[68px] z-10 flex flex-col">
        <Link href="/lab/community" className="w-fit text-[20px] font-semibold leading-[25px] text-[var(--text-link)] hover:underline">
          {U.title}
        </Link>
        <div className="mt-[13px] flex items-center gap-[var(--space-16)]">
          <h1 className="text-[40px] font-semibold leading-[50px] tracking-[-0.8px] text-[var(--neutral-1000)]">{motion.name}</h1>
          <button type="button" onClick={() => setPicking(true)} aria-label={U.bringToLab} title={U.bringToLab} className="text-[var(--neutral-700)] hover:text-[var(--text-primary)]">
            <Icon name="inbox-in" size={24} />
          </button>
        </div>
        <span className="text-[19.7px] leading-[32.5px] tracking-[-0.39px] text-[var(--neutral-1000)] opacity-50">{usesLabel(motion.uses)}</span>
      </div>

      {/* Left panel: Context (943:1770) */}
      <aside className="absolute bottom-[32px] left-[32px] top-[32px] z-10 flex w-[343px] flex-col overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-surface)]">
        {/* Back, in the editor's menu slot (24 icon before the panel title) */}
        <div className="ml-[23px] mt-[26px] flex items-center gap-[var(--space-12)]">
          <button type="button" onClick={back} aria-label={U.back} title={U.back} className="flex size-[24px] items-center justify-center text-[var(--neutral-800)] hover:text-[var(--text-primary)]">
            <Icon name="chevron-right-small" size={24} className="rotate-180" />
          </button>
          <h2 className="text-[20px] font-semibold leading-[25px] text-[var(--neutral-800)] underline">{U.context}</h2>
        </div>
        <div className="mt-[37px] flex min-h-0 flex-1 flex-col gap-[56px] overflow-y-auto pb-[var(--space-32)] pl-[19px] pr-[23px]">
          <ReferencedSets behaviors={behaviors} variant="strip" />

          <section className="flex w-[301px] flex-col gap-[var(--space-16)]">
            <h3 className={sectionTitle}>
              <Icon name="widget" size={24} className="shrink-0" />
              {U.component}
            </h3>
            <div className={box}>
              {components.map((c) => (
                <Link key={c.id} href={`/lab/guideline/behavior/${guidelineSlugFor(c.id)}`} title={c.description} className={`${row} hover:text-[var(--text-primary)]`}>
                  {c.label}
                  <Icon name="chevron-right-thin" size={24} className="text-[var(--text-tertiary)]" />
                </Link>
              ))}
            </div>
          </section>

          <section className="flex w-[301px] flex-col gap-[var(--space-16)]">
            <h3 className={sectionTitle}>
              <Icon name="round-graph" size={24} className="shrink-0" />
              {U.pattern}
            </h3>
            <div className={box}>
              {patterns.map((p) => (
                <Link key={p.id} href={`/lab/guideline/situation/${p.id}`} className={`${row} hover:text-[var(--text-primary)]`} title={p.hint}>
                  {p.label}
                  <Icon name="chevron-right-thin" size={24} className="text-[var(--text-tertiary)]" />
                </Link>
              ))}
            </div>
          </section>

          <section className="-mt-[28px] flex w-[301px] flex-col gap-[var(--space-16)] border-t-2 border-[var(--border-default)] pt-[28px]">
            <h3 className={sectionTitle}>
              <Icon name="library" size={24} className="shrink-0" />
              <span className="flex-1">{U.reviews}</span>
              <Icon name="chevron-right-thin" size={24} className="text-[var(--text-tertiary)]" />
            </h3>
            <div className="relative -mr-[32px] overflow-hidden">
              <div className="flex gap-[var(--space-12)] overflow-x-auto pr-[32px] [scrollbar-width:none]">
                {COMMUNITY_REVIEWS.map((r) => (
                  <figure key={r.src} className="relative size-[123px] shrink-0 overflow-hidden rounded-[var(--radius-md)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.src} alt={r.alt} className="size-full object-cover" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/figma/community/review-more.svg" alt="" aria-hidden className="absolute left-[100px] top-[8px] h-[14px] w-[15px]" />
                  </figure>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-[64px] bg-gradient-to-l from-[var(--bg-surface)] from-[37%] to-transparent" />
            </div>
          </section>
        </div>
      </aside>

      {/* Right panel (943:1704): channel tabs · Joint / references · Bring to Lab */}
      <aside className="absolute bottom-[32px] right-[32px] top-[32px] z-10 flex w-[380px] flex-col gap-[29px] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-surface)] px-[var(--space-24)] pb-[29px] pt-[var(--space-24)]">
        <div className="grid h-[49px] w-[330px] shrink-0 grid-cols-3 gap-[var(--space-8)] rounded-[var(--radius-sm)] bg-[var(--bg-canvas)] px-[var(--space-8)] py-[7px]" role="tablist">
          {(["motion", "face", "sound"] as const).map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={tab === c}
              onClick={() => setTab(c)}
              className={`flex h-[36px] items-center justify-center rounded-[var(--radius-xs)] text-[15px] leading-[20px] ${tab === c ? "bg-[var(--neutral-300)] text-[var(--text-primary)]" : tabTint[c]}`}
            >
              {E.tabs[c]}
            </button>
          ))}
        </div>
        <div className="-mr-[var(--space-16)] min-h-0 flex-1 overflow-y-auto pr-[var(--space-16)]">
          {tab === "motion" ? <JointTable joints={joints} structure={PURE_DESK_STRUCTURE} /> : <ChannelReferences channel={tab} behaviors={behaviors} />}
        </div>
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="h-[55px] w-[332px] shrink-0 rounded-[var(--radius-lg)] bg-[var(--neutral-800)] text-[21px] leading-[21px] tracking-[-0.42px] text-[var(--text-on-inverse)] hover:bg-[var(--neutral-900)]"
        >
          {U.bringToLab}
        </button>
      </aside>

      {/* Play bar (943:2020): 52 play button · 404 progress (#92adb5, 20% track, 21 knob) · 0:03 / 0:12 · volume */}
      <div className="absolute bottom-[61px] left-[calc(50%-19px)] z-10 flex -translate-x-1/2 items-center gap-[33px]">
        <button
          type="button"
          disabled={!ctrlReady}
          onClick={togglePlay}
          aria-label={paused ? U.play : U.pause}
          title={paused ? U.play : U.pause}
          className="flex size-[52px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--community-pill)] text-[var(--icon-secondary)] disabled:opacity-40"
        >
          {paused ? (
            <Icon name="play-round" size={19} />
          ) : (
            <span className="flex gap-[4px]" aria-hidden>
              <span className="h-[16px] w-[4px] rounded-[var(--radius-2xs)] bg-current" />
              <span className="h-[16px] w-[4px] rounded-[var(--radius-2xs)] bg-current" />
            </span>
          )}
        </button>
        <div className="flex items-center gap-[14px]">
          <div className="relative h-[21px] w-[404px]">
            <div className="absolute inset-x-0 top-[6px] h-[9px] overflow-hidden rounded-[var(--radius-xs)]">
              <div className="absolute inset-0 rounded-[var(--radius-full)] bg-[var(--community-progress)] opacity-20" />
              <div className="absolute inset-y-0 left-0 bg-[var(--community-progress)]" style={{ width: `${progress * 100}%` }} />
            </div>
            <span
              aria-hidden
              className="absolute top-0 size-[21px] -translate-x-1/2 rounded-[var(--radius-full)] border-[5px] border-[var(--community-progress)] bg-[var(--bg-surface)]"
              style={{ left: `${Math.min(Math.max(progress * 404, 10.5), 393.5)}px` }}
            />
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(progress * 1000)}
              aria-label="Seek"
              disabled={!ctrlReady || !(time.duration > 0)}
              onChange={(e) => ctrl.current?.seek((Number(e.target.value) / 1000) * time.duration)}
              className="absolute inset-0 m-0 cursor-pointer appearance-none bg-transparent opacity-0"
            />
          </div>
          <span className="whitespace-nowrap text-[15px] leading-[24px] tracking-[-0.3px] text-[var(--neutral-600)] tabular-nums">
            {clock(time.t)} / {clock(time.duration)}
          </span>
        </div>
        <Icon name="volume-loud" size={32} className="text-[var(--neutral-600)]" />
      </div>

      <Modal open={picking} onClose={() => setPicking(false)} title={U.pickProject} description={U.pickBody}>
        {projects.length === 0 ? (
          <div className="flex flex-col gap-[var(--space-24)]">
            <span className="text-[16px] leading-[20px] text-[var(--text-secondary)]">{U.noProjects}</span>
            <ModalActions>
              <ModalButton onClick={() => setPicking(false)}>{STRINGS.common.cancel}</ModalButton>
              <ModalButton variant="primary" onClick={() => router.push("/lab/new/type")}>{STRINGS.lab.tryRobot}</ModalButton>
            </ModalActions>
          </div>
        ) : (
          <ul className="flex max-h-[360px] flex-col gap-[var(--space-8)] overflow-y-auto">
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => void use(p.id)}
                  className="flex w-full items-center justify-between gap-[var(--space-12)] rounded-[var(--radius-md)] bg-[var(--bg-canvas)] px-[var(--space-20)] py-[var(--space-16)] text-left hover:bg-[var(--neutral-150)]"
                >
                  <span className="truncate text-[16px] font-medium leading-[22px] text-[var(--text-primary)]">{p.name}</span>
                  <span className="shrink-0 text-[14px] leading-[20px] text-[var(--text-secondary)]">{ROBOT_TYPES.find((t) => t.id === p.type)?.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}

/** Face / Sound tab: what the motion's face or sound came from (reference set per behavior). */
function ChannelReferences({ channel, behaviors }: { channel: Exclude<ReferenceChannel, "motion">; behaviors: string[] }) {
  const items = [...new Set(behaviors)]
    .map((b) => ({ behavior: b, item: referenceSetFor(b)?.items.find((it) => it.channel === channel) }))
    .filter((x) => x.item !== undefined);
  const icon: IconName = channel === "face" ? "smile-square" : "sound";
  return (
    <section className="flex w-[332px] flex-col gap-[var(--space-16)]">
      <h3 className="text-[18px] leading-[23px] text-[var(--text-primary)]">{E.tabs[channel]}</h3>
      {items.length === 0 ? (
        <p className="text-[14px] leading-[18px] text-[var(--text-tertiary)]">{fmt(U.noChannel, { channel: E.tabs[channel].toLowerCase() })}</p>
      ) : (
        <div className="flex flex-col gap-[var(--space-16)] rounded-[var(--radius-lg)] bg-[var(--bg-canvas)] px-[18px] py-[14px]">
          {items.map(({ behavior, item }) => (
            <figure key={behavior} className="flex flex-col gap-[var(--space-8)]">
              <figcaption className="flex items-center gap-[var(--space-8)] text-[16px] leading-[20px] text-[var(--text-primary)]">
                <Icon name={icon} size={20} className="shrink-0 text-[var(--text-secondary)]" />
                <span className="truncate">{item!.title}</span>
                <span className="ml-auto shrink-0 text-[14px] text-[var(--text-secondary)]">{behaviorLabel(behavior)}</span>
              </figcaption>
              {item!.file.endsWith(".ogg") ? (
                <audio src={item!.file} controls className="h-[32px] w-full" />
              ) : item!.file.endsWith(".webm") ? (
                <video src={item!.file} poster={item!.poster ?? undefined} muted loop autoPlay playsInline className="aspect-video w-full rounded-[var(--radius-xs)] object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item!.file} alt={item!.title} className="aspect-video w-full rounded-[var(--radius-xs)] object-cover" />
              )}
              <span className="text-[13px] leading-[18px] text-[var(--text-link)]">{item!.note}</span>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
