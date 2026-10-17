"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { STRINGS, fmt } from "@/data/strings";
import type { Channel, Joint, Structure } from "@/lib/models";
import { api } from "@/lib/ui/api";
import type { SimController } from "@/components/sim/sim-controller";
import { Viewport } from "@/components/sim/Viewport";
import { CHANNEL_LABEL } from "@/components/ui/channel-badges";
import { Icon } from "@/components/ui/icons/icon";
import { StageSteps } from "@/components/ui/stage-steps";
import { useToast } from "@/components/ui/toast";
import { useUnsavedChanges } from "@/components/ui/use-unsaved";

const S = STRINGS.structure;
const CHANNELS: Channel[] = ["motion", "face", "sound"];
const ANCHOR_MS = 100;

type Anchor = { id: string; x: number; y: number; visible: boolean };

/** Edit limits only narrow: clamp into the rig and keep min < max. */
function narrow(j: Joint, edge: "min" | "max", value: number): Joint {
  if (!Number.isFinite(value)) return j;
  const v = Math.round(value);
  if (edge === "min") return { ...j, min: Math.min(Math.max(v, j.rigMin), j.max - 1) };
  return { ...j, max: Math.max(Math.min(v, j.rigMax), j.min + 1) };
}

// W02B-4 (Figma 901:8568 ×2): full-width stage with the Viewport + joint numbers (click → highlight), ← Lab pill, PREVIEW label,
// Structure panel (joint list, channel toggles, Edit limits, Confirm), bottom stage steps.
export function StructureEditor({ projectId, name, initial }: { projectId: string; name: string; initial: Structure }) {
  const router = useRouter();
  const toast = useToast();
  const ctrl = useRef<SimController | null>(null);
  const [structure, setStructure] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(structure) !== JSON.stringify(initial), [structure, initial]);
  useUnsavedChanges(dirty && !saving);

  // Joint numbers follow the model (projectJoints is in CSS px of the canvas).
  useEffect(() => {
    const timer = setInterval(() => {
      if (ctrl.current) setAnchors(ctrl.current.projectJoints());
    }, ANCHOR_MS);
    return () => clearInterval(timer);
  }, []);

  function select(id: string | null) {
    const next = id === selected ? null : id;
    setSelected(next);
    ctrl.current?.highlightJoint(next);
  }

  function setJoint(id: string, edge: "min" | "max", value: number) {
    setStructure((s) => ({ ...s, joints: s.joints.map((j) => (j.id === id ? narrow(j, edge, value) : j)) }));
  }

  function toggleChannel(c: Channel) {
    setStructure((s) => {
      const has = s.channels.includes(c);
      if (has && s.channels.length === 1) return s;
      return { ...s, channels: has ? s.channels.filter((x) => x !== c) : CHANNELS.filter((x) => x === c || s.channels.includes(x)) };
    });
  }

  async function confirm() {
    setSaving(true);
    try {
      await api(`/api/projects/${projectId}/structure`, { method: "PUT", body: JSON.stringify(structure) });
      toast(S.saved);
      router.push(`/lab/p/${projectId}/signature`);
    } catch {
      toast(STRINGS.lab.toast.failed);
      setSaving(false);
    }
  }

  const index = new Map(structure.joints.map((j, i) => [j.id, i + 1]));

  return (
    <div className="relative min-h-[var(--app-vh)] overflow-hidden">
      {/* Stage (Figma 901:8569 ×2: full width, 265 → bottom). The sim draws its own floor; never zoom/transform it. */}
      <div className="absolute inset-x-0 bottom-0 top-[265px]">
        <Viewport controllerRef={ctrl} structure={structure} mode="structure" className="block size-full" />
        {anchors
          .filter((a) => a.visible && index.has(a.id))
          .map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => select(a.id)}
              style={{ left: a.x, top: a.y }}
              aria-label={a.id}
              aria-pressed={selected === a.id}
              className={`absolute flex size-[42px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[var(--radius-full)] text-[20px] font-medium leading-[25px] text-[var(--text-on-inverse)] ${
                selected === a.id ? "bg-[var(--bg-inverse)] outline-2 outline-offset-2 outline-[var(--bg-inverse)]" : "bg-[var(--neutral-700)]"
              }`}
            >
              {index.get(a.id)}
            </button>
          ))}
      </div>

      <Link
        href="/lab"
        className="absolute left-[48px] top-[var(--space-40)] flex h-[48px] w-fit items-center gap-[var(--space-12)] rounded-[var(--radius-full)] border-2 border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-16)] text-[16px] font-medium leading-[20px] text-[var(--text-link)] hover:bg-[var(--neutral-50)]"
      >
        <span aria-hidden>←</span>
        <span>{STRINGS.sidebar.lab}</span>
      </Link>
      <p className="absolute left-[168px] top-[55px] text-[12px] font-semibold leading-[15px] text-[var(--text-tertiary)]">{S.preview}</p>

      {/* Structure panel (Figma 901:8646 ×2): 428×927 at 50,92, padding 32, radius xl. */}
      <section
        aria-label={name}
        className="absolute bottom-[61px] left-[50px] top-[92px] flex w-[428px] flex-col justify-between gap-[var(--space-32)] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-surface)] p-[var(--space-32)]"
      >
        <div className="flex min-h-0 flex-col gap-[var(--space-40)]">
          <header className="flex flex-col gap-[var(--space-16)]">
            <h1 className="text-[30px] font-semibold leading-[38px] text-[var(--sage-800)]">{S.title}</h1>
            <p className="text-[16px] leading-[20px] text-[var(--sage-500)]">{S.body}</p>
            {structure.source === "import" && <p className="text-[12px] leading-[15px] text-[var(--text-secondary)]">{S.previewNote}</p>}
          </header>

          <div className="-mr-[var(--space-16)] flex min-h-0 flex-col gap-[var(--space-48)] overflow-y-auto pr-[var(--space-16)]">
            <section className="flex flex-col gap-[var(--space-16)] text-[16px] leading-[20px]">
              <h2 className="whitespace-pre font-medium text-[var(--text-link)]">{`${S.joints}  ${structure.joints.length}`}</h2>
              {editing && <p className="text-[var(--text-secondary)]">{S.narrowOnly}</p>}
              <ul className="flex flex-col gap-[var(--space-16)]">
                {structure.joints.map((j, i) => (
                  <li
                    key={j.id}
                    className={`flex flex-col gap-[var(--space-12)] rounded-[var(--radius-md)] px-[var(--space-16)] py-[var(--space-12)] ${
                      selected === j.id ? "bg-[var(--neutral-150)] outline-2 -outline-offset-2 outline-[var(--border-strong)]" : "bg-[var(--bg-canvas)]"
                    }`}
                  >
                    <button type="button" className="flex items-start justify-between whitespace-nowrap text-left" onClick={() => select(j.id)} title={j.label}>
                      <span className="font-medium text-[var(--sage-800)]">{`${i + 1}. ${j.id}`}</span>
                      <span className="text-[var(--sage-500)]">{fmt(S.jointRange, { min: j.min, max: j.max })}</span>
                    </button>
                    {editing && (
                      <div className="flex flex-col gap-[var(--space-8)]">
                        {(["min", "max"] as const).map((edge) => (
                          <label key={edge} className="flex items-center gap-[var(--space-8)]">
                            <span className="w-[32px] text-[12px] leading-[15px] text-[var(--text-secondary)]">{edge}</span>
                            <input
                              type="range"
                              min={j.rigMin}
                              max={j.rigMax}
                              value={j[edge]}
                              onChange={(e) => setJoint(j.id, edge, Number(e.target.value))}
                              className="min-w-0 flex-1 accent-[var(--sage-800)]"
                              aria-label={`${j.id} ${edge}`}
                            />
                            <input
                              type="number"
                              min={j.rigMin}
                              max={j.rigMax}
                              value={j[edge]}
                              onChange={(e) => setJoint(j.id, edge, Number(e.target.value))}
                              className="w-[72px] rounded-[var(--radius-xs)] border-2 border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-8)] py-[var(--space-4)] text-[16px] leading-[20px] text-[var(--text-primary)]"
                            />
                          </label>
                        ))}
                        <span className="text-[12px] leading-[15px] text-[var(--text-tertiary)]">{fmt(S.rigRange, { min: j.rigMin, max: j.rigMax })}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex flex-col gap-[var(--space-24)]">
              <section className="flex flex-col gap-[var(--space-16)]">
                <h2 className="text-[16px] font-medium leading-[20px] text-[var(--text-link)]">{S.channels}</h2>
                <div className="flex gap-[var(--space-12)]">
                  {CHANNELS.map((c) => {
                    const on = structure.channels.includes(c);
                    return (
                      <label
                        key={c}
                        className={`flex cursor-pointer items-start rounded-[var(--radius-md)] px-[var(--space-16)] py-[var(--space-8)] text-[16px] leading-[20px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--sage-800)] ${
                          on ? "bg-[var(--sage-800)] text-[var(--text-on-inverse)]" : "bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
                        }`}
                      >
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleChannel(c)} />
                        {CHANNEL_LABEL[c]}
                      </label>
                    );
                  })}
                </div>
              </section>
              <button
                type="button"
                onClick={() => setEditing(!editing)}
                className="self-start text-[16px] font-medium leading-[20px] text-[var(--sage-800)] hover:underline"
              >
                {editing ? S.done : S.editLimits}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={saving || editing}
          onClick={confirm}
          className="flex h-[63px] w-full shrink-0 items-center justify-center gap-[var(--space-12)] rounded-[var(--radius-md)] bg-[var(--sage-800)] px-[var(--space-28)] text-[20px] font-medium leading-[25px] text-[var(--text-on-inverse)] hover:bg-[var(--sage-700)] disabled:bg-[var(--bg-disabled)] disabled:text-[var(--text-disabled)]"
        >
          <span>{S.confirm}</span>
          <Icon name="arrow" size={20} />
        </button>
      </section>

      <StageSteps current={0} className="absolute bottom-[67px] left-[calc(50%-341px)]" />
    </div>
  );
}
