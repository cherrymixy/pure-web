"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROBOT_TYPES } from "@/data/robot-types";
import { STRINGS } from "@/data/strings";
import type { Job, Project } from "@/lib/models";
import { api } from "@/lib/ui/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const S = STRINGS.newType;

// W02B-1: five type cards, only Joint Fixed can be selected (others hover only).
export function TypePicker() {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState(false);
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
    <div className="flex flex-col gap-6 p-10">
      <Link href="/lab" className="text-sm text-neutral-500">← {STRINGS.sidebar.lab}</Link>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{S.title}</h1>
        <p className="text-sm text-neutral-500">{S.body}</p>
      </header>
      <div className="grid grid-cols-5 gap-4">
        {ROBOT_TYPES.map((t) => {
          const isSelected = t.selectable && selected;
          return (
            <button
              key={t.id}
              disabled={!t.selectable}
              aria-pressed={isSelected}
              onClick={() => t.selectable && setSelected(!selected)}
              title={t.selectable ? undefined : S.onlyFixed}
              className={`group flex flex-col gap-2 rounded border p-4 text-left disabled:cursor-default ${
                isSelected ? "border-neutral-900 ring-2 ring-neutral-900" : "border-neutral-200 hover:border-neutral-400"
              }`}
            >
              <div className="aspect-square rounded bg-neutral-100" />
              <span className="font-semibold">{t.name}</span>
              <span className="text-xs text-neutral-500">{t.dof}</span>
              <span className="text-xs text-neutral-600">{t.description}</span>
              {!t.selectable && <span className="text-xs text-neutral-400 opacity-0 group-hover:opacity-100">{S.onlyFixed}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <Link href="/lab/new/import" className="text-sm text-neutral-500 underline">{S.importInstead}</Link>
        <Button variant="primary" disabled={!selected || busy} onClick={start}>{S.continue}</Button>
      </div>
    </div>
  );
}
