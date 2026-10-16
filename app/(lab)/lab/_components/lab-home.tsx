"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ROBOT_TYPES } from "@/data/robot-types";
import { STRINGS, fmt } from "@/data/strings";
import type { Channel, Job, Project } from "@/lib/models";
import { api } from "@/lib/ui/api";
import { timeAgo } from "@/lib/ui/time";
import { Button } from "@/components/ui/button";
import { CHANNEL_LABEL } from "@/components/ui/channel-badges";
import { Icon, type IconName } from "@/components/ui/icons/icon";
import { Menu } from "@/components/ui/menu";
import { ConfirmModal, PromptModal } from "@/components/ui/modal";
import { EmptyState, Loading } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";

const S = STRINGS.lab;
const FILTER_KEY = "pure.lab.channels";
const POLL_MS = 1500;
const CHANNELS: Channel[] = ["motion", "face", "sound"];

function readFilter(): Channel[] {
  try {
    const raw = JSON.parse(localStorage.getItem(FILTER_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((c): c is Channel => CHANNELS.includes(c)) : [];
  } catch {
    return [];
  }
}

function writeFilter(channels: Channel[]) {
  try {
    localStorage.setItem(FILTER_KEY, JSON.stringify(channels));
  } catch {
    // storage blocked: filter just won't persist
  }
}

function projectHref(p: Project) {
  return p.status === "analyzing" ? `/lab/p/${p.id}/analyzing` : `/lab/p/${p.id}`;
}

// W02A-1~3: project grid, channel filter, card menu, analyzing progress, empty lab.
export function LabHome() {
  const router = useRouter();
  const toast = useToast();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const running = useRef<Record<string, number>>({});
  const [filter, setFilter] = useState<Channel[]>([]);
  const [renaming, setRenaming] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const load = useCallback(async () => {
    try {
      setProjects(await api<Project[]>("/api/projects"));
    } catch {
      setProjects((p) => p ?? []);
      toast(S.toast.failed);
    }
  }, [toast]);

  useEffect(() => {
    setFilter(readFilter());
    void load();
  }, [load]);

  // Analyzing cards: poll running jobs for progress; reload when one finishes.
  const analyzing = projects?.some((p) => p.status === "analyzing") ?? false;
  useEffect(() => {
    if (!analyzing) return;
    let active = true;
    const tick = async () => {
      try {
        const jobs = await api<Job[]>("/api/jobs?active=1");
        if (!active) return;
        const next: Record<string, number> = {};
        for (const j of jobs) if (j.projectId) next[j.projectId] = j.progress;
        const finished = Object.keys(running.current).some((id) => !(id in next));
        running.current = next;
        setProgress(next);
        if (finished) void load();
      } catch {
        // keep last progress
      }
    };
    void tick();
    const timer = setInterval(tick, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [analyzing, load]);

  const shown = useMemo(
    () =>
      (projects ?? [])
        .filter((p) => filter.every((c) => p.channelsUsed.includes(c)))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [projects, filter],
  );

  function toggle(c: Channel) {
    const next = filter.includes(c) ? filter.filter((x) => x !== c) : [...filter, c];
    setFilter(next);
    writeFilter(next);
  }

  async function rename(p: Project, name: string) {
    setRenaming(null);
    try {
      await api(`/api/projects/${p.id}`, { method: "PATCH", body: JSON.stringify({ name }) });
      toast(fmt(S.toast.renamed, { name }));
      await load();
    } catch {
      toast(S.toast.failed);
    }
  }

  async function duplicate(p: Project) {
    try {
      const copy = await api<Project>(`/api/projects/${p.id}/duplicate`, { method: "POST" });
      toast(fmt(S.toast.duplicated, { name: copy.name }));
      await load();
    } catch {
      toast(S.toast.failed);
    }
  }

  async function remove(p: Project) {
    setDeleting(null);
    try {
      await api(`/api/projects/${p.id}`, { method: "DELETE" });
      toast(fmt(S.toast.deleted, { name: p.name }));
      await load();
    } catch {
      toast(S.toast.failed);
    }
  }

  const actions = (
    <>
      <button
        onClick={() => router.push("/lab/new/import")}
        className="flex h-[56px] w-[152px] items-center justify-center gap-[var(--space-12)] rounded-[var(--radius-full)] bg-[var(--neutral-300)] text-[20px] leading-[26px] text-[var(--text-primary)] hover:bg-[var(--neutral-200)]"
      >
        <Icon name="download-minimalistic" size={25} className="text-[var(--neutral-800)]" />
        {S.import}
      </button>
      <button
        onClick={() => router.push("/lab/new/type")}
        className="flex h-[56px] w-[274px] items-center gap-[var(--space-12)] rounded-[var(--radius-full)] bg-[var(--neutral-800)] py-[var(--space-12)] pl-[var(--space-32)] pr-[var(--space-16)] text-[20px] font-medium leading-[26px] text-[var(--neutral-100)] hover:bg-[var(--neutral-700)]"
      >
        {S.tryRobot}
        <Icon name="arrow-right" size={37.6} className="text-[var(--neutral-0)]" />
      </button>
    </>
  );

  const clear = () => {
    setFilter([]);
    writeFilter([]);
  };

  // Figma W02A-1 (901:7762) ×2: header row at 49, grid of 498 square cards with 30 gaps from 134.
  return (
    <div className="flex flex-col gap-[29px] pb-[var(--space-32)] pl-[33px] pr-[var(--space-32)] pt-[49px]">
      <header className="flex h-[56px] items-center justify-between">
        <h1 className="sr-only">{S.title}</h1>
        <div className="flex items-center gap-[var(--space-8)]" role="group" aria-label={S.filterLabel}>
          {projects && projects.length > 0 &&
            CHANNELS.map((c) => (
              <FilterChip key={c} channel={c} pressed={filter.includes(c)} tinted={filter.length === 0 || filter.includes(c)} onClick={() => toggle(c)} />
            ))}
        </div>
        <div className="flex gap-[var(--space-16)]">{actions}</div>
      </header>

      {projects === null ? (
        <Loading label={STRINGS.common.loading} />
      ) : projects.length === 0 ? (
        <EmptyState title={S.empty.title} body={S.empty.body} />
      ) : shown.length === 0 ? (
        <EmptyState title={S.noMatch}>
          <Button onClick={clear}>{S.clearFilter}</Button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-3 gap-[30px]">
          {shown.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              progress={progress[p.id] ?? p.progress ?? 0}
              onRename={() => setRenaming(p)}
              onDuplicate={() => duplicate(p)}
              onReplace={() => router.push(`/lab/new/import?replace=${p.id}`)}
              onDelete={() => setDeleting(p)}
            />
          ))}
        </div>
      )}

      <PromptModal
        open={renaming !== null}
        title={S.rename.title}
        label={S.rename.label}
        initial={renaming?.name ?? ""}
        maxLength={60}
        submitLabel={S.rename.save}
        onSubmit={(name) => renaming && rename(renaming, name)}
        onCancel={() => setRenaming(null)}
      />
      <ConfirmModal
        open={deleting !== null}
        title={fmt(S.deleteConfirm.title, { name: deleting?.name ?? "" })}
        body={S.deleteConfirm.body}
        confirmLabel={STRINGS.common.delete}
        danger
        onConfirm={() => deleting && remove(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

// Channel chip colors: Figma web/* variables (fill at 20%, 1px stroke, darker label).
const CHIP: Record<Channel, { icon: IconName; base: string; ink: string }> = {
  motion: { icon: "running-round", base: "var(--web-75add7)", ink: "var(--web-3f77a1)" },
  face: { icon: "smile-square", base: "var(--web-e2a1c1)", ink: "var(--web-c35d8f)" },
  sound: { icon: "volume-loud", base: "var(--web-ecc377)", ink: "var(--web-ae7d24)" },
};

// Filter chip (Figma 901:8309). Tinted = shown (no filter, or selected); otherwise neutral outline.
function FilterChip({ channel, pressed, tinted, onClick }: { channel: Channel; pressed: boolean; tinted: boolean; onClick: () => void }) {
  const c = CHIP[channel];
  return (
    <button
      onClick={onClick}
      aria-pressed={pressed}
      style={
        tinted
          ? { background: `color-mix(in srgb, ${c.base} 20%, transparent)`, borderColor: c.base, color: c.ink }
          : { borderColor: "var(--neutral-300)", color: "var(--text-secondary)" }
      }
      className="flex h-[44px] items-center gap-[var(--space-12)] rounded-[var(--radius-sm)] border px-[var(--space-16)] text-[20px] leading-[26px]"
    >
      <Icon name={c.icon} size={26} />
      {CHANNEL_LABEL[channel]}
    </button>
  );
}

// Card robot art by project type (no per-project data): Figma W02A-1 card renders at ×2 natural size.
// joint-fixed 901:8214, jointless-driving 901:8030, joint-driving 901:8304, joint-walking 901:7849 (bear; file named project-thumb-desk);
// full-body has no card render in the frame → landing cut-out (W00-1 type card).
const TYPE_IMAGE: Record<string, { src: string; w: number; h: number }> = {
  "joint-fixed": { src: "/figma/lab/robot-joint-fixed@2x.png", w: 105, h: 232 },
  "jointless-driving": { src: "/figma/lab/robot-jointless-driving@2x.png", w: 163, h: 148 },
  "joint-driving": { src: "/figma/lab/robot-joint-driving@2x.png", w: 227, h: 269 },
  "joint-walking": { src: "/figma/project-thumb-desk@2x.png", w: 184, h: 184 },
  "full-body": { src: "/figma/landing/type-full-body.png", w: 180, h: 270 },
};

function ProjectCard({
  project: p,
  progress,
  onRename,
  onDuplicate,
  onReplace,
  onDelete,
}: {
  project: Project;
  progress: number;
  onRename: () => void;
  onDuplicate: () => void;
  onReplace: () => void;
  onDelete: () => void;
}) {
  const type = ROBOT_TYPES.find((t) => t.id === p.type);
  const isAnalyzing = p.status === "analyzing";
  const image = TYPE_IMAGE[p.type];
  // Card (Figma 901:8125) ×2: 498 square, 1px neutral/300 border, radius/2xl; floor grid + type robot art.
  return (
    <Link
      href={projectHref(p)}
      data-testid="project-card"
      className="relative aspect-square overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--neutral-300)] bg-[var(--bg-surface)] hover:border-[var(--neutral-500)]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/lab/card-floor.svg" alt="" aria-hidden className="pointer-events-none absolute bottom-[17px] left-[calc(50%-9px)] h-[278px] w-[655px] max-w-none -translate-x-1/2" />
      <img
        src="/figma/lab/card-shadow.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-[calc(50%-66px)] top-[360px] h-[35px] w-[202px] max-w-none rotate-[173.42deg]"
      />
      {image && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={image.src}
          alt={type?.name ?? ""}
          width={image.w}
          height={image.h}
          style={{ width: image.w, height: image.h }}
          className={`pointer-events-none absolute bottom-[108px] left-1/2 max-w-none -translate-x-1/2 object-contain ${isAnalyzing ? "opacity-40" : ""}`}
        />
      )}

      <div className="absolute left-[33px] right-[27px] top-[31px] flex items-start justify-between gap-[var(--space-12)]">
        <div className="flex min-w-0 flex-col gap-[6px]">
          <span className="truncate text-[24px] font-semibold leading-[30px] text-[var(--sage-800)]">{p.name}</span>
          <span className="text-[18px] leading-[22px] text-[var(--neutral-700)]">{fmt(S.updated, { when: timeAgo(p.updatedAt) })}</span>
        </div>
        <div className="flex shrink-0 items-center gap-[var(--space-12)]">
          <div className="flex items-center gap-[var(--space-16)] text-[var(--neutral-400)]">
            {CHANNELS.filter((c) => p.channelsUsed.includes(c)).map((c) => (
              <Icon key={c} name={CHIP[c].icon} size={25} label={CHANNEL_LABEL[c]} />
            ))}
          </div>
          <Menu
            label={`${p.name} menu`}
            triggerClassName="flex h-[32px] w-[24px] items-center justify-center rounded-[var(--radius-2xs)] text-[var(--sage-500)] hover:bg-[var(--neutral-100)]"
            trigger={<Icon name="more-vertical" size={24} />}
            items={[
              { label: S.cardMenu.rename, onSelect: onRename },
              { label: S.cardMenu.duplicate, onSelect: onDuplicate },
              { label: S.cardMenu.replace, onSelect: onReplace },
              { label: S.cardMenu.delete, onSelect: onDelete, danger: true },
            ]}
          />
        </div>
      </div>

      {isAnalyzing ? (
        <div className="absolute bottom-[var(--space-32)] left-[31px] right-[31px] flex flex-col gap-[var(--space-8)]">
          <span className="text-[18px] leading-[22px] text-[var(--text-primary)]">
            {S.status.analyzing} {Math.round(progress)}%
          </span>
          <div className="h-[8px] overflow-hidden rounded-[var(--radius-full)] bg-[var(--neutral-150)]">
            <div className="h-full bg-[var(--sage-500)] transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <span className="absolute left-[31px] top-[427px] rounded-[var(--radius-lg)] bg-[var(--sage-50)] px-[var(--space-16)] py-[var(--space-12)] text-[18px] leading-[22px] text-[var(--text-primary)]">
          {type?.name ?? p.type}
        </span>
      )}
    </Link>
  );
}
