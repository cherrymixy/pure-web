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
  const unsavedGuard = useUnsavedChanges(dirty && !saving);

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

      {/* Lab UI (user review, same as the import / type / analyzing sheets): glass back link + preview tag, white panel with a
          thin home-line border, Lab rows and chips, Lab buttons. The sim stage keeps its own colours. */}
      <div className="absolute left-[var(--space-40)] top-[42px] flex items-center gap-[var(--space-12)]">
        <Link
          href="/lab"
          className="flex h-[44px] items-center gap-[var(--space-8)] rounded-[var(--radius-sm)] bg-[var(--home-glass)] px-[var(--space-20)] text-[15px] font-medium text-[var(--home-ink)] hover:bg-[var(--neutral-0)]"
        >
          <span aria-hidden>←</span>
          {STRINGS.sidebar.lab}
        </Link>
        <span className="rounded-[var(--radius-full)] bg-[var(--home-glass)] px-[10px] py-[4px] text-[12px] font-semibold tracking-[0.04em] text-[var(--home-ink-3)]">{S.preview}</span>
      </div>

      <section
        aria-label={name}
        className="absolute bottom-[var(--space-40)] left-[var(--space-40)] top-[104px] flex w-[428px] flex-col justify-between gap-[var(--space-24)] overflow-hidden rounded-[24px] border border-[var(--home-line)] bg-[var(--neutral-0)] p-[var(--space-32)] shadow-[0_24px_48px_var(--effect-shadow)]"
      >
        <div className="flex min-h-0 flex-col gap-[var(--space-32)]">
          <header className="flex flex-col gap-[var(--space-8)]">
            <h1 className="text-[32px] font-semibold leading-[1.2] text-[var(--home-ink)]">{S.title}</h1>
            <p className="text-[15px] leading-[1.45] text-[var(--home-ink-2)]">{S.body}</p>
            {structure.source === "import" && <p className="text-[13px] leading-[1.45] text-[var(--home-ink-3)]">{S.previewNote}</p>}
          </header>

          <div className="-mr-[var(--space-16)] flex min-h-0 flex-col gap-[var(--space-32)] overflow-y-auto pr-[var(--space-16)]">
            <section className="flex flex-col gap-[var(--space-12)] text-[15px]">
              <h2 className="flex items-center gap-[var(--space-8)] text-[13px] font-medium text-[var(--home-ink-3)]">
                {S.joints}
                <span className="rounded-[var(--radius-full)] bg-[var(--home-canvas)] px-[8px] py-[1px] text-[12px] font-semibold tabular-nums text-[var(--home-ink-2)]">{structure.joints.length}</span>
              </h2>
              {editing && <p className="text-[13px] text-[var(--home-ink-2)]">{S.narrowOnly}</p>}
              <ul className="flex flex-col gap-[var(--space-8)]">
                {structure.joints.map((j, i) => (
                  <li
                    key={j.id}
                    className={`flex flex-col gap-[var(--space-12)] rounded-[12px] border px-[var(--space-16)] py-[var(--space-12)] ${
                      selected === j.id ? "border-[var(--home-ink)] bg-[var(--neutral-0)]" : "border-transparent bg-[var(--home-canvas)] hover:border-[var(--home-line)]"
                    }`}
                  >
                    <button type="button" className="flex items-start justify-between whitespace-nowrap text-left" onClick={() => select(j.id)} title={j.label}>
                      <span className="font-medium text-[var(--home-ink)]">{`${i + 1}. ${j.id}`}</span>
                      <span className="text-[14px] tabular-nums text-[var(--home-ink-3)]">{fmt(S.jointRange, { min: j.min, max: j.max })}</span>
                    </button>
                    {editing && (
                      <div className="flex flex-col gap-[var(--space-8)]">
                        {(["min", "max"] as const).map((edge) => (
                          <label key={edge} className="flex items-center gap-[var(--space-8)]">
                            <span className="w-[32px] text-[12px] text-[var(--home-ink-3)]">{edge}</span>
                            <input
                              type="range"
                              min={j.rigMin}
                              max={j.rigMax}
                              value={j[edge]}
                              onChange={(e) => setJoint(j.id, edge, Number(e.target.value))}
                              className="min-w-0 flex-1 accent-[var(--home-ink)]"
                              aria-label={`${j.id} ${edge}`}
                            />
                            <input
                              type="number"
                              min={j.rigMin}
                              max={j.rigMax}
                              value={j[edge]}
                              onChange={(e) => setJoint(j.id, edge, Number(e.target.value))}
                              className="w-[72px] rounded-[var(--radius-sm)] border border-[var(--home-line)] bg-[var(--neutral-0)] px-[var(--space-8)] py-[var(--space-4)] text-[15px] tabular-nums text-[var(--home-ink)]"
                            />
                          </label>
                        ))}
                        <span className="text-[12px] text-[var(--home-ink-3)]">{fmt(S.rigRange, { min: j.rigMin, max: j.rigMax })}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex flex-col gap-[var(--space-24)]">
              <section className="flex flex-col gap-[var(--space-12)]">
                <h2 className="text-[13px] font-medium text-[var(--home-ink-3)]">{S.channels}</h2>
                <div className="flex gap-[var(--space-8)]">
                  {CHANNELS.map((c) => {
                    const on = structure.channels.includes(c);
                    return (
                      <label
                        key={c}
                        className={`flex cursor-pointer items-center rounded-[var(--radius-full)] px-[var(--space-16)] py-[6px] text-[14px] font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--home-ink)] ${
                          on ? "bg-[var(--home-ink)] text-[var(--neutral-0)]" : "bg-[var(--home-canvas)] text-[var(--home-ink-3)] hover:text-[var(--home-ink)]"
                        }`}
                      >
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleChannel(c)} />
                        {CHANNEL_LABEL[c]}
                      </label>
                    );
                  })}
                </div>
              </section>
              {/* A clear button (user review): Lab secondary, dark while editing ("Done") */}
              <button
                type="button"
                aria-pressed={editing}
                onClick={() => setEditing(!editing)}
                className={`flex h-[44px] w-full items-center justify-center gap-[var(--space-8)] rounded-[var(--radius-sm)] border text-[15px] font-medium ${
                  editing
                    ? "border-[var(--home-ink)] bg-[var(--home-ink)] text-[var(--neutral-0)] hover:bg-[var(--neutral-800)]"
                    : "border-[var(--home-line)] bg-[var(--neutral-0)] text-[var(--home-ink)] hover:border-[var(--home-ink-3)]"
                }`}
              >
                <Icon name={editing ? "check" : "settings"} size={18} />
                {editing ? S.done : S.editLimits}
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          data-tour="structure-confirm"
          disabled={saving || editing}
          onClick={confirm}
          className="flex h-[52px] w-full shrink-0 items-center justify-center gap-[var(--space-8)] rounded-[var(--radius-sm)] bg-[var(--home-ink)] px-[var(--space-24)] text-[16px] font-medium text-[var(--neutral-0)] hover:bg-[var(--neutral-800)] disabled:bg-[var(--home-canvas)] disabled:text-[var(--home-ink-3)]"
        >
          <span>{S.confirm}</span>
          <Icon name="arrow" size={18} />
        </button>
      </section>

      <StageSteps current={0} className="absolute bottom-[67px] left-[calc(50%-341px)]" />
      {unsavedGuard}
    </div>
  );
}
