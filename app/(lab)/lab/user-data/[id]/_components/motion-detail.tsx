"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PURE_DESK_STRUCTURE } from "@/data/pure-desk";
import { ROBOT_TYPES } from "@/data/robot-types";
import { STRINGS, fmt } from "@/data/strings";
import type { RobotType, UserDataMotion } from "@/lib/models";
import { api } from "@/lib/ui/api";
import { Viewport } from "@/components/sim/Viewport";
import { Button } from "@/components/ui/button";
import { ReferencedSets } from "@/components/ui/referenced-sets";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

const U = STRINGS.userData;

// W04-2 detail: player (loops the preview recipe), info, Use as reference → project picker → editor Context.
export function MotionDetail({ motion, projects }: { motion: UserDataMotion; projects: { id: string; name: string; type: RobotType }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [picking, setPicking] = useState(false);
  const playable = useMemo(
    () => ({ motion: { mode: "recipe" as const, recipe: { ...motion.preview, loop: true } } }),
    [motion.preview],
  );

  async function use(projectId: string) {
    await api(`/api/user-data/${motion.id}/use`, { method: "POST" }).catch(() => {});
    toast(fmt(U.attached, { name: motion.name }));
    router.push(`/lab/p/${projectId}?ref=${encodeURIComponent(motion.id)}`);
  }

  return (
    <div className="flex flex-col gap-6 p-10">
      <Link href="/lab/user-data" className="text-sm text-neutral-500">← {U.back}</Link>
      <div className="grid grid-cols-[1fr_360px] gap-8">
        <div className="overflow-hidden rounded border border-neutral-200">
          <Viewport mode="preview" structure={PURE_DESK_STRUCTURE} expression={playable} autoPlay className="aspect-[4/3] w-full" />
        </div>
        <aside className="flex flex-col gap-3 text-sm">
          <h1 className="text-2xl font-semibold">{motion.name}</h1>
          <span className="text-neutral-500">{motion.category} · {fmt(U.uses, { n: motion.uses })}</span>
          <div>
            <h2 className="text-xs text-neutral-500">{U.steps}</h2>
            <p>{motion.preview.steps.map((s) => s.behavior).join(" → ")}</p>
          </div>
          <Button variant="primary" onClick={() => setPicking(true)}>{U.useAsReference}</Button>
          <ReferencedSets behaviors={motion.preview.steps.map((st) => st.behavior)} />
        </aside>
      </div>

      <Modal open={picking} onClose={() => setPicking(false)} title={U.pickProject}>
        <p className="text-sm text-neutral-600">{U.pickBody}</p>
        {projects.length === 0 ? (
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-neutral-500">{U.noProjects}</span>
            <Button onClick={() => router.push("/lab/new/type")}>{STRINGS.lab.tryRobot}</Button>
          </div>
        ) : (
          <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
            {projects.map((p) => (
              <li key={p.id}>
                <button onClick={() => void use(p.id)} className="flex w-full justify-between rounded border border-neutral-200 px-3 py-2 text-left text-sm hover:border-neutral-500">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-xs text-neutral-500">{ROBOT_TYPES.find((t) => t.id === p.type)?.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
