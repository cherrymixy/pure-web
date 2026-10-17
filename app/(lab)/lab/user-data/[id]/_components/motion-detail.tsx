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
import { Icon } from "@/components/ui/icons/icon";
import { ReferencedSets } from "@/components/ui/referenced-sets";
import { Modal, ModalActions, ModalButton } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { behaviorLabel } from "../../_components/user-data-browser";

const U = STRINGS.userData;

// W04-2 detail: player (loops the preview recipe), info, Use as reference → project picker → editor Context.
// No Figma frame: lab paddings, Viewport on a rounded bg/canvas stage (editor stage), white info card (sidebar panel).
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
    <div className="flex flex-col gap-[var(--space-24)] pb-[var(--space-32)] pl-[33px] pr-[var(--space-32)] pt-[var(--space-32)]">
      <Link
        href="/lab/user-data"
        className="flex h-[48px] w-fit items-center gap-[var(--space-12)] rounded-[var(--radius-full)] border-2 border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-16)] text-[16px] font-medium leading-[20px] text-[var(--text-link)] hover:bg-[var(--neutral-100)]"
      >
        <Icon name="back" size={20} />
        {U.back}
      </Link>
      <div className="grid grid-cols-[1fr_440px] gap-[var(--space-24)]">
        <div className="relative h-[calc(var(--app-vh)-168px)] min-h-[640px] overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--bg-canvas)]">
          <Viewport mode="preview" structure={PURE_DESK_STRUCTURE} expression={playable} autoPlay className="block size-full" />
        </div>
        <aside className="flex flex-col gap-[var(--space-32)] self-start rounded-[var(--radius-xl)] bg-[var(--bg-surface)] p-[var(--space-32)]">
          <div className="flex flex-col gap-[var(--space-12)]">
            <h1 className="text-[32px] font-semibold leading-[40px] text-[var(--sage-800)]">{motion.name}</h1>
            <div className="flex flex-wrap items-center gap-[var(--space-8)]">
              <span className="rounded-[var(--radius-lg)] bg-[var(--sage-50)] px-[var(--space-16)] py-[var(--space-8)] text-[16px] leading-[20px] text-[var(--text-primary)]">{motion.category}</span>
              <span className="text-[16px] leading-[20px] text-[var(--text-secondary)]">{fmt(U.uses, { n: motion.uses })}</span>
            </div>
          </div>
          <div className="flex flex-col gap-[var(--space-8)]">
            <h2 className="text-[13px] leading-[18px] text-[var(--text-secondary)]">{U.steps}</h2>
            <p className="text-[18px] leading-[24px] text-[var(--text-primary)]">{motion.preview.steps.map((s) => behaviorLabel(s.behavior)).join(" → ")}</p>
          </div>
          <Button variant="primary" onClick={() => setPicking(true)} className="w-full">
            {U.useAsReference}
            <Icon name="arrow-right" size={20} />
          </Button>
          <div className="border-t border-[var(--border-default)] pt-[var(--space-24)]">
            <ReferencedSets behaviors={motion.preview.steps.map((st) => st.behavior)} />
          </div>
        </aside>
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
