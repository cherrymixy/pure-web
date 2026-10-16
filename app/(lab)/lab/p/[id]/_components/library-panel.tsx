"use client";

import { useEffect, useMemo, useState } from "react";
import { STRINGS } from "@/data/strings";
import type { Channel, SavedExpression } from "@/lib/models";
import { api } from "@/lib/ui/api";
import { timeAgo } from "@/lib/ui/time";
import { Button } from "@/components/ui/button";
import { ChannelBadges } from "@/components/ui/channel-badges";
import { Loading } from "@/components/ui/states";

const L = STRINGS.editor.libraryPanel;
type Filter = "all" | Channel;

// W02D Library tab: account-wide saved expressions, search, channel filter, Apply to this robot.
export function LibraryPanel({ busy, onApply }: { busy: boolean; onApply: (saved: SavedExpression) => void }) {
  const [items, setItems] = useState<SavedExpression[] | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    api<SavedExpression[]>("/api/library").then(setItems, () => setItems([]));
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter(
      (s) => (filter === "all" || s.channels.includes(filter)) && (!q || s.name.toLowerCase().includes(q) || s.currentStatus.toLowerCase().includes(q)),
    );
  }, [items, query, filter]);

  if (!items) return <Loading label={STRINGS.common.loading} />;
  return (
    <div className="flex flex-col gap-3">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={L.search} className="rounded border border-neutral-300 px-2 py-1.5" />
      <div className="flex gap-1">
        {(["all", "motion", "face", "sound"] as const).map((f) => (
          <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)} className={`rounded-full border px-2.5 py-0.5 text-xs ${filter === f ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}>
            {L.filters[f]}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="text-xs text-neutral-500">{L.empty}</p>
      ) : (
        shown.map((s) => (
          <div key={s.id} data-testid="library-card" className="flex flex-col gap-1.5 rounded border border-neutral-200 p-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{s.name}</span>
              <ChannelBadges channels={s.channels} />
            </div>
            <span className="text-xs text-neutral-500">{s.currentStatus}</span>
            <span className="text-xs text-neutral-400">{timeAgo(s.savedAt)}</span>
            <Button disabled={busy} onClick={() => onApply(s)}>{L.apply}</Button>
          </div>
        ))
      )}
    </div>
  );
}
