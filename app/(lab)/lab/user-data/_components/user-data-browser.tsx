"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STRINGS, fmt } from "@/data/strings";
import { USER_DATA_CATEGORIES, type UserDataMotion } from "@/lib/models";
import { api } from "@/lib/ui/api";
import { EmptyState, Loading } from "@/components/ui/states";

const U = STRINGS.userData;
type Tab = "all" | "popular" | "recent" | "uploaded";

// W04-1~3: browse motions (tabs, categories, search), cards → detail, no results.
export function UserDataBrowser() {
  const [tab, setTab] = useState<Tab>("all");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<UserDataMotion[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ tab, ...(category ? { category } : {}), ...(q.trim() ? { q: q.trim() } : {}) });
    const timer = setTimeout(() => api<UserDataMotion[]>(`/api/user-data?${params}`).then(setItems, () => setItems([])), 150);
    return () => clearTimeout(timer);
  }, [tab, category, q]);

  return (
    <div className="flex flex-col gap-6 p-10">
      <h1 className="text-2xl font-semibold">{U.title}</h1>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {(Object.keys(U.tabs) as Tab[]).map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)} className={`rounded-full border px-3 py-1 ${tab === t ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}>
            {U.tabs[t]}
          </button>
        ))}
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="ml-4 rounded border border-neutral-300 px-2 py-1" aria-label="Category">
          <option value="">{U.allCategories}</option>
          {USER_DATA_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={U.search} className="ml-auto w-64 rounded border border-neutral-300 px-2 py-1" />
      </div>
      {items === null ? (
        <Loading label={STRINGS.common.loading} />
      ) : items.length === 0 ? (
        <EmptyState title={U.noResults} />
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {items.map((m) => (
            <Link key={m.id} href={`/lab/user-data/${m.id}`} data-testid="motion-card" className="flex flex-col gap-2 rounded border border-neutral-200 p-3 hover:border-neutral-400">
              {/* Thumbnail = capture PNG in the design pass (rule 14); gray box for now. */}
              <div className="flex aspect-video items-center justify-center rounded bg-neutral-100 px-2 text-center text-xs text-neutral-400">
                {m.preview.steps.map((s) => s.behavior).join(" → ")}
              </div>
              <span className="font-semibold">{m.name}</span>
              <span className="flex justify-between text-xs text-neutral-500">
                <span>{m.category}{m.source === "user" ? ` · ${U.tabs.uploaded}` : ""}</span>
                <span>{fmt(U.uses, { n: m.uses })}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
