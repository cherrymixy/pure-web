"use client";

import { useEffect, useMemo, useState } from "react";
import { STRINGS } from "@/data/strings";
import type { Channel, SavedExpression } from "@/lib/models";
import { api } from "@/lib/ui/api";
import { timeAgo } from "@/lib/ui/time";
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
  // Library tab in the Context panel shell (Figma W02D 901:9922): same 301px column, canvas boxes, 16px body.
  return (
    <div className="flex w-[301px] flex-col gap-[var(--space-16)]">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={L.search}
        aria-label={L.search}
        className="h-[44px] rounded-[var(--radius-lg)] bg-[var(--bg-canvas)] px-[var(--space-16)] text-[16px] leading-[20px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
      />
      <div className="flex gap-[var(--space-8)]">
        {(["all", "motion", "face", "sound"] as const).map((f) => (
          <button
            key={f}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-[var(--radius-full)] px-[var(--space-16)] py-[var(--space-8)] text-[14px] leading-[18px] ${filter === f ? "bg-[var(--neutral-300)] text-[var(--text-primary)]" : "bg-[var(--bg-canvas)] text-[var(--text-secondary)]"}`}
          >
            {L.filters[f]}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="text-[14px] leading-[18px] text-[var(--text-tertiary)]">{L.empty}</p>
      ) : (
        shown.map((s) => (
          <div key={s.id} data-testid="library-card" className="flex flex-col gap-[var(--space-8)] rounded-[var(--radius-lg)] bg-[var(--bg-canvas)] px-[var(--space-20)] py-[var(--space-16)]">
            <div className="flex items-center justify-between gap-[var(--space-8)]">
              <span className="truncate text-[16px] font-semibold leading-[20px] text-[var(--text-primary)]">{s.name}</span>
              <ChannelBadges channels={s.channels} />
            </div>
            <span className="text-[14px] leading-[18px] text-[var(--text-secondary)]">{s.currentStatus}</span>
            <span className="text-[12px] leading-[15px] text-[var(--text-tertiary)]">{timeAgo(s.savedAt)}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => onApply(s)}
              className="mt-[var(--space-4)] h-[40px] rounded-[var(--radius-sm)] bg-[var(--neutral-800)] text-[14px] leading-[18px] text-[var(--text-on-inverse)] disabled:opacity-40"
            >
              {L.apply}
            </button>
          </div>
        ))
      )}
    </div>
  );
}
