"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ROBOT_TYPES } from "@/data/robot-types";
import { STRINGS, fmt } from "@/data/strings";
import type { Channel, Job, Project } from "@/lib/models";
import { timeAgo } from "@/lib/ui/time";
import { Button } from "@/components/ui/button";
import { CHANNEL_LABEL, ChannelBadges } from "@/components/ui/channel-badges";
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

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
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
      <Button onClick={() => router.push("/lab/new/import")}>{S.import}</Button>
      <Button variant="primary" onClick={() => router.push("/lab/new/type")}>{S.tryRobot}</Button>
    </>
  );

  return (
    <div className="flex flex-col gap-6 p-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{S.title}</h1>
        <div className="flex gap-2">{actions}</div>
      </header>

      {projects === null ? (
        <Loading label={STRINGS.common.loading} />
      ) : projects.length === 0 ? (
        <EmptyState title={S.empty.title} body={S.empty.body}>{actions}</EmptyState>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm" role="group" aria-label={S.filterLabel}>
            <span className="text-neutral-500">{S.filterLabel}</span>
            <button
              onClick={() => { setFilter([]); writeFilter([]); }}
              aria-pressed={filter.length === 0}
              className={`rounded-full border px-3 py-1 ${filter.length === 0 ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}
            >
              {S.filterAll}
            </button>
            {CHANNELS.map((c) => (
              <button
                key={c}
                onClick={() => toggle(c)}
                aria-pressed={filter.includes(c)}
                className={`rounded-full border px-3 py-1 ${filter.includes(c) ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}
              >
                {CHANNEL_LABEL[c]}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <EmptyState title={S.noMatch}>
              <Button onClick={() => { setFilter([]); writeFilter([]); }}>{S.clearFilter}</Button>
            </EmptyState>
          ) : (
            <div className="grid grid-cols-3 gap-5">
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
        </>
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
  return (
    <Link href={projectHref(p)} data-testid="project-card" className="flex flex-col gap-3 rounded border border-neutral-200 p-4 hover:border-neutral-400">
      <div className="relative flex aspect-video items-center justify-center rounded bg-neutral-100 text-xs text-neutral-400">
        {isAnalyzing ? `${S.status.analyzing} ${Math.round(progress)}%` : type?.name}
      </div>
      {isAnalyzing && (
        <div className="h-1 overflow-hidden rounded bg-neutral-200">
          <div className="h-full bg-neutral-700 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-semibold">{p.name}</span>
          <span className="text-xs text-neutral-500">{fmt(S.updated, { when: timeAgo(p.updatedAt) })}</span>
        </div>
        <Menu
          label={`${p.name} menu`}
          trigger="⋮"
          items={[
            { label: S.cardMenu.rename, onSelect: onRename },
            { label: S.cardMenu.duplicate, onSelect: onDuplicate },
            { label: S.cardMenu.replace, onSelect: onReplace },
            { label: S.cardMenu.delete, onSelect: onDelete, danger: true },
          ]}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 text-xs">
          <span className="rounded bg-neutral-100 px-1.5 py-0.5">{type?.name ?? p.type}</span>
          <span className="rounded border border-neutral-200 px-1.5 py-0.5 text-neutral-500">{S.status[p.status]}</span>
        </div>
        <ChannelBadges channels={p.channelsUsed} />
      </div>
    </Link>
  );
}
