"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JOINT_TAGS, LAB_SHOWCASE, type ShowcaseCard } from "@/data/lab-showcase";
import { STRINGS, fmt } from "@/data/strings";
import type { Channel, Project } from "@/lib/models";
import { api } from "@/lib/ui/api";
import { timeAgo } from "@/lib/ui/time";
import { Button } from "@/components/ui/button";
import { CHANNEL_LABEL } from "@/components/ui/channel-badges";
import { Icon } from "@/components/ui/icons/icon";
import { Menu } from "@/components/ui/menu";
import { RobotArtLayers } from "@/components/ui/robot-art";
import { EmptyState, Loading } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useFavourites } from "../../_components/favourites-context";

const S = STRINGS.lab;
const H = "/figma/lab/home";
const CHANNELS: Channel[] = ["motion", "face", "sound"];
const DAY_MS = 86_400_000;
function projectHref(p: Project) {
  return p.status === "analyzing" ? `/lab/p/${p.id}/analyzing` : `/lab/p/${p.id}`;
}

// Lab home (Figma 1095:6556 "Main"): title row with filters + view toggle, search/actions bar, 4-up card grid.
export function LabHome({ author }: { author: string }) {
  const router = useRouter();
  const toast = useToast();
  const search = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [query, setQuery] = useState("");
  const [module, setModule] = useState<Channel | null>(null);
  const [joint, setJoint] = useState<string | null>(null);
  const [days, setDays] = useState<number | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  // Stars are shared with the sidebar Favourites (no favourites API yet); seeded from data/lab-showcase.ts.
  const { stars, toggle: toggleStar } = useFavourites();

  const load = useCallback(async () => {
    try {
      setProjects(await api<Project[]>("/api/projects"));
    } catch {
      setProjects((p) => p ?? []);
      toast(S.toast.failed);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // ⌘K / Ctrl+K focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    return LAB_SHOWCASE.flatMap((card) => {
      const project = projects?.find((p) => p.id === card.projectId);
      return project ? [{ project, card }] : [];
    }).filter(
      ({ project: p, card }) =>
        (!q || p.name.toLowerCase().includes(q)) &&
        (!module || p.channelsUsed.includes(module)) &&
        (!joint || card.tag === joint) &&
        (!days || now - new Date(p.updatedAt).getTime() <= days * DAY_MS),
    );
  }, [projects, query, module, joint, days]);

  const clear = () => {
    setQuery("");
    setModule(null);
    setJoint(null);
    setDays(null);
  };

  const rangeLabel = S.updatedRanges.find((r) => r.days === days)?.label ?? S.filters.any;

  return (
    <div data-fit-frame className="relative flex flex-col gap-[var(--space-40)] px-[var(--space-40)] py-[42px] leading-normal">
      <img src={`${H}/glow.svg`} alt="" aria-hidden className="pointer-events-none absolute left-[26px] top-[-360px] h-[680px] w-[1360px] max-w-none" />

      <div className="relative flex flex-col gap-[var(--space-20)]">
        <div className="flex w-full items-center gap-[var(--space-12)]">
          <h1 className="text-[60px] font-semibold text-[var(--home-ink)]">{S.title}</h1>
          <span className="flex-1" />
          <button
            onClick={() => router.push("/lab/new/import")}
            className="flex items-center gap-[var(--space-8)] rounded-[var(--radius-sm)] bg-[var(--home-glass)] h-[44px] px-[var(--space-20)] text-[15px] font-medium text-[var(--home-ink)] hover:bg-[var(--neutral-0)]"
          >
            <img src={`${H}/import.svg`} alt="" aria-hidden width={20} height={20} />
            {S.import}
          </button>
          <button
            data-tour="try-robot"
            onClick={() => router.push("/lab/new/type")}
            className="flex items-center gap-[10px] rounded-[var(--radius-sm)] bg-[var(--home-ink)] h-[44px] px-[22px] text-[15px] font-medium text-[var(--neutral-0)] hover:bg-[var(--neutral-800)]"
          >
            {S.tryRobot}
            <img src={`${H}/arrow-right.svg`} alt="" aria-hidden width={20} height={20} />
          </button>
        </div>

        <div className="flex w-full items-center gap-[var(--space-12)]">
          <label className="flex h-[44px] w-[420px] items-center gap-[10px] rounded-[var(--radius-sm)] bg-[var(--home-glass)] px-[var(--space-16)]">
            <Icon name="search-18" size={18} className="shrink-0 text-[var(--home-ink-3)]" />
            <input
              ref={search}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={S.search}
              aria-label={S.search}
              className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--home-ink)] outline-none placeholder:text-[var(--home-ink-3)]"
            />
            <kbd className="shrink-0 rounded-[var(--radius-xs)] bg-[var(--home-pill)] px-[var(--space-8)] py-[2px] font-sans text-[12px] font-medium text-[var(--home-ink-2)]">{S.searchKey}</kbd>
          </label>
          <span className="flex-1" />
          <FilterMenu
            label={S.filters.module}
            value={module ? CHANNEL_LABEL[module] : S.filterAll}
            items={[{ label: S.filterAll, onSelect: () => setModule(null) }, ...CHANNELS.map((c) => ({ label: CHANNEL_LABEL[c], onSelect: () => setModule(c) }))]}
          />
          <FilterMenu
            label={S.filters.joint}
            value={joint ?? S.filterAll}
            items={[{ label: S.filterAll, onSelect: () => setJoint(null) }, ...JOINT_TAGS.map((j) => ({ label: j, onSelect: () => setJoint(j) }))]}
          />
          <FilterMenu
            label={S.filters.updated}
            value={rangeLabel}
            items={[{ label: S.filters.any, onSelect: () => setDays(null) }, ...S.updatedRanges.map((r) => ({ label: r.label, onSelect: () => setDays(r.days) }))]}
          />
          {/* View toggle (1095:6659): grid cards or the list (1104:972). */}
          <div className="flex items-start gap-[2px] rounded-[10px] bg-[var(--home-pill)] p-[3px]" role="group">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                aria-label={S.view[v]}
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`rounded-[var(--radius-xs)] p-[8px] ${view === v ? "bg-[var(--home-glass)] text-[var(--home-ink)]" : "text-[var(--home-ink-3)]"}`}
              >
                <Icon name={v === "grid" ? "view-grid" : "view-list"} size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {projects === null ? (
        <Loading label={STRINGS.common.loading} />
      ) : projects.length === 0 ? (
        <EmptyState title={S.empty.title} body={S.empty.body} />
      ) : shown.length === 0 ? (
        <EmptyState title={S.noMatch}>
          <Button onClick={clear}>{S.clearFilter}</Button>
        </EmptyState>
      ) : view === "list" ? (
        <ProjectList rows={shown} stars={stars} onStar={toggleStar} onOpen={(p) => router.push(projectHref(p))} />
      ) : (
        // Columns stretch so the last card ends where the toolbar ends.
        <div className="relative grid grid-cols-[repeat(auto-fill,minmax(357.638px,1fr))] gap-x-[16.483px] gap-y-[22px]">
          {shown.map(({ project: p, card }) => (
            <ProjectCard key={p.id} project={p} card={card} author={author} starred={stars.has(p.id)} onStar={() => toggleStar(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// Filter dropdown (1095:6644): glass fill, 1px #e6e8ea, radius 10. Type scale tuned after review: toolbar text 15 throughout;
// row 1 controls (filters, view toggle) 40 tall, row 2 (search, buttons) 44 tall.
export function FilterMenu({ label, value, items }: { label: string; value: string; items: { label: string; onSelect: () => void }[] }) {
  return (
    <Menu
      label={`${label} ${value}`}
      items={items}
      triggerClassName="flex items-center gap-[6px] overflow-clip rounded-[10px] border border-[var(--home-line)] bg-[var(--home-glass)] h-[40px] px-[14px] text-[15px] leading-normal hover:bg-[var(--neutral-0)]"
      trigger={
        <>
          <span className="text-[var(--home-ink-2)]">{label}</span>
          <span className="font-medium text-[var(--home-ink)]">{value}</span>
          <Icon name="chevron-down-16" size={16} className="text-[var(--home-ink-2)]" />
        </>
      }
    />
  );
}

const MODULE: Record<Channel, { icon: string; bg: string }> = {
  motion: { icon: `${H}/mod-motion.svg`, bg: "var(--home-mod-motion)" },
  face: { icon: `${H}/mod-face.svg`, bg: "var(--home-mod-face)" },
  sound: { icon: `${H}/mod-sound.svg`, bg: "var(--home-mod-sound)" },
};

// Card (1095:6686): min 357.638 wide (stretches with the grid column), white, 0.749 #e6e8ea, radius 14.985 — header · 16:9 picture · footer.
// Type scale tuned after review (Figma card text was 9.7–12.7, too small): title 15 / meta 13 / labels + tag 11, nothing under 11.
function ProjectCard({ project: p, card, author, starred, onStar }: { project: Project; card: ShowcaseCard; author: string; starred: boolean; onStar: () => void }) {
  const router = useRouter();
  return (
    <Link
      href={projectHref(p)}
      data-testid="project-card"
      className="group flex w-full min-w-0 flex-col overflow-clip rounded-[14.985px] border-[0.749px] border-[var(--home-line)] bg-[var(--neutral-0)]"
    >
      <div className="flex w-full items-center gap-[8.991px] px-[13.486px] py-[11.988px]">
        <span className="relative size-[29.97px] shrink-0 overflow-clip rounded-[7.492px] bg-[var(--home-avatar-bg)]">
          <RobotArtLayers art={card.avatar} />
        </span>
        <span className="flex min-w-0 flex-col gap-[2px] whitespace-nowrap">
          <span className="truncate text-[15px] font-semibold text-[var(--home-ink)]">{p.name}</span>
          <span className="text-[12px] text-[var(--home-ink-3)]">{fmt(S.by, { name: author })}</span>
        </span>
        <span className="flex-1" />
        <button
          aria-label={S.favourite}
          aria-pressed={starred}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onStar();
          }}
          className={`shrink-0 ${starred ? "text-[var(--sage-300)]" : "text-[var(--home-star-off)]"}`}
        >
          <Icon name="star" size={22} />
        </button>
        {/* ⋮ (user review, as in the list view): Open · favourite toggle. */}
        <Menu
          label={`${STRINGS.sidebar.more} ${p.name}`}
          items={[
            { label: STRINGS.sidebar.open, onSelect: () => router.push(projectHref(p)) },
            { label: starred ? S.unfavourite : S.favourite, onSelect: onStar },
          ]}
          triggerClassName="flex h-[22px] w-[18px] shrink-0 items-center justify-center rounded-[var(--radius-xs)] text-[var(--home-ink-3)] hover:text-[var(--home-ink)]"
          trigger={<Icon name="more-vertical" size={12} />}
        />
      </div>

      <div className="w-full px-[13.486px]">
        {/* 16:9 picture (330.665 × 186). Hover: grey → sage colour fades in and the robot zooms; no border change. */}
        <div className="relative aspect-video w-full overflow-clip rounded-[10.489px]" style={{ backgroundImage: "var(--home-thumb-grey)" }}>
          <div
            aria-hidden
            className="absolute inset-0 opacity-0 transition-opacity duration-[var(--motion-slow)] ease-[var(--ease-standard)] group-hover:opacity-100 motion-reduce:transition-none"
            style={{ backgroundImage: "var(--home-thumb-sage)" }}
          />
          <span className="absolute left-[8.99px] top-[8.99px] z-10 rounded-[6px] bg-[var(--neutral-0)] px-[8px] py-[4px] text-[11px] font-medium text-[var(--home-ink-2)]">
            {card.tag}
          </span>
          {/* Art keeps its Figma 134.863-tall layout, centred in the taller frame. */}
          <div className="absolute inset-0 transition-transform duration-[var(--motion-slow)] ease-[var(--ease-standard)] group-hover:scale-[1.06] motion-reduce:transition-none">
            <div className="absolute left-1/2 top-1/2 h-[134.863px] w-[330.665px] -translate-x-1/2 -translate-y-1/2">
              <RobotArtLayers art={card.thumb} alt={card.tag} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-end px-[13.486px] py-[11.988px]">
        <span className="flex flex-col gap-[3px] whitespace-nowrap">
          <span className="text-[11px] text-[var(--home-ink-3)]">{S.updatedLabel}</span>
          <span className="text-[13px] font-medium text-[var(--home-ink)]">{fmt(S.updated, { when: timeAgo(p.updatedAt) })}</span>
        </span>
        <span className="flex-1" />
        <span className="flex flex-col items-end gap-[3px]">
          <span className="text-[11px] text-[var(--home-ink-3)]">{S.modulesLabel}</span>
          <span className="flex gap-[4px]">
            {CHANNELS.filter((c) => p.channelsUsed.includes(c)).map((c) => (
              <span key={c} className="flex size-[22px] items-center justify-center rounded-[var(--radius-full)]" style={{ background: MODULE[c].bg }}>
                <img src={MODULE[c].icon} alt={CHANNEL_LABEL[c]} width={12} height={12} className="size-[12px]" />
              </span>
            ))}
          </span>
        </span>
      </div>
    </Link>
  );
}

// List view (Figma 1104:972 "Robot list"): white radius 24, p 12 — header row #f7f8f9 radius 12 (13 medium ink-3), rows px 16 py 10 with a
// #eceef0 hairline: 52 robot tile · 16 medium name · sage star when favourite | joint pill 180 | module chips 170 | updated 150 | ⋮ 36.
const COLS = { joint: "w-[180px]", modules: "w-[170px]", updated: "w-[150px]", more: "w-[36px]" };
const AVATAR_SCALE = 52 / 29.97;

function ProjectList({
  rows,
  stars,
  onStar,
  onOpen,
}: {
  rows: { project: Project; card: ShowcaseCard }[];
  stars: Set<string>;
  onStar: (id: string) => void;
  onOpen: (p: Project) => void;
}) {
  const head = "text-[13px] font-medium text-[var(--home-ink-3)]";
  return (
    <div className="relative flex flex-col rounded-[24px] bg-[var(--neutral-0)] p-[var(--space-12)]" role="table" aria-label={S.title}>
      <div role="row" className="flex items-center gap-[var(--space-12)] rounded-[var(--radius-sm)] bg-[var(--home-list-head)] px-[var(--space-16)] py-[10px]">
        <span role="columnheader" className={`min-w-0 flex-1 ${head}`}>{S.columns.name}</span>
        <span role="columnheader" className={`${COLS.joint} ${head}`}>{S.columns.joint}</span>
        <span role="columnheader" className={`${COLS.modules} ${head}`}>{S.columns.modules}</span>
        <span role="columnheader" className={`${COLS.updated} ${head}`}>{S.columns.updated}</span>
        <span role="columnheader" className={COLS.more} />
      </div>
      {rows.map(({ project: p, card }, i) => (
        <Link
          key={p.id}
          href={projectHref(p)}
          role="row"
          data-testid="project-row"
          className={`flex items-center gap-[var(--space-12)] px-[var(--space-16)] py-[10px] hover:bg-[var(--home-canvas)] ${i < rows.length - 1 ? "border-b border-[var(--home-list-line)]" : ""}`}
        >
          <span role="cell" className="flex min-w-0 flex-1 items-center gap-[14px]">
            <span className="relative size-[52px] shrink-0 overflow-clip rounded-[var(--radius-sm)] bg-[var(--home-avatar-bg)]">
              <span className="absolute left-0 top-0 size-[29.97px] origin-top-left" style={{ transform: `scale(${AVATAR_SCALE})` }}>
                <RobotArtLayers art={card.avatar} />
              </span>
            </span>
            <span className="truncate text-[16px] font-medium text-[var(--home-ink)]">{p.name}</span>
            {stars.has(p.id) && <Icon name="star" size={23.57} label={S.favourite} className="shrink-0 text-[var(--sage-300)]" />}
          </span>
          <span role="cell" className={`flex items-center ${COLS.joint}`}>
            <span className="rounded-[var(--radius-full)] bg-[var(--home-tag-bg)] px-[10px] py-[4px] text-[13px] font-medium text-[var(--home-tag-ink)]">{card.tag}</span>
          </span>
          <span role="cell" className={`flex items-center gap-[6px] ${COLS.modules}`}>
            {CHANNELS.filter((c) => p.channelsUsed.includes(c)).map((c) => (
              <span key={c} className="flex size-[28px] items-center justify-center rounded-[14px]" style={{ background: MODULE[c].bg }}>
                <img src={MODULE[c].icon} alt={CHANNEL_LABEL[c]} width={15.68} height={15.68} className="size-[15.68px]" />
              </span>
            ))}
          </span>
          <span role="cell" className={`text-[15px] text-[var(--home-ink-2)] ${COLS.updated}`}>{timeAgo(p.updatedAt)}</span>
          <span role="cell" className={`flex items-center ${COLS.more}`}>
            <Menu
              label={`${STRINGS.sidebar.more} ${p.name}`}
              items={[
                { label: STRINGS.sidebar.open, onSelect: () => onOpen(p) },
                { label: stars.has(p.id) ? S.unfavourite : S.favourite, onSelect: () => onStar(p.id) },
              ]}
              triggerClassName="flex size-[28px] items-center justify-center rounded-[var(--radius-xs)] text-[var(--home-ink-3)] hover:text-[var(--home-ink)]"
              trigger={<Icon name="more-vertical" size={13.5} />}
            />
          </span>
        </Link>
      ))}
    </div>
  );
}
