"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { STRINGS, fmt } from "@/data/strings";
import type { Channel, Joint, Structure } from "@/lib/models";
import { api } from "@/lib/ui/api";
import type { SimController } from "@/components/sim/sim-controller";
import { Viewport } from "@/components/sim/Viewport";
import { Button } from "@/components/ui/button";
import { CHANNEL_LABEL } from "@/components/ui/channel-badges";
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

// W02B-4: viewport with joint numbers (click → highlight), joint list, channel toggles, Edit limits, Confirm.
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
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col gap-6 p-10">
        <Link href="/lab" className="text-sm text-neutral-500">← {STRINGS.sidebar.lab}</Link>
        <header className="flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold">{S.title}</h1>
          <span className="text-sm text-neutral-500">{name}</span>
        </header>

        <div className="grid grid-cols-[1fr_420px] gap-8">
          <div className="flex flex-col gap-2">
            <div className="relative overflow-hidden rounded border border-neutral-200">
              <Viewport controllerRef={ctrl} structure={structure} mode="structure" className="aspect-[4/3] w-full" />
              {anchors
                .filter((a) => a.visible && index.has(a.id))
                .map((a) => (
                  <button
                    key={a.id}
                    onClick={() => select(a.id)}
                    style={{ left: a.x, top: a.y }}
                    aria-label={a.id}
                    className={`absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-xs ${
                      selected === a.id ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-400 bg-white"
                    }`}
                  >
                    {index.get(a.id)}
                  </button>
                ))}
            </div>
            {structure.source === "import" && <p className="text-xs text-neutral-500">{S.previewNote}</p>}
          </div>

          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{S.joints} {structure.joints.length}</h2>
                <Button variant={editing ? "primary" : "default"} onClick={() => setEditing(!editing)}>{editing ? S.done : S.editLimits}</Button>
              </div>
              {editing && <p className="text-xs text-neutral-500">{S.narrowOnly}</p>}
              <ul className="flex flex-col divide-y divide-neutral-100 text-sm">
                {structure.joints.map((j, i) => (
                  <li key={j.id} className={`flex flex-col gap-1.5 py-2 ${selected === j.id ? "bg-neutral-50" : ""}`}>
                    <button className="flex items-center gap-3 text-left" onClick={() => select(j.id)}>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 text-xs">{i + 1}</span>
                      <span className="flex-1">
                        {j.label} <span className="font-mono text-xs text-neutral-400">{j.id}</span>
                      </span>
                      <span className="font-mono">{j.min}° … {j.max}°</span>
                    </button>
                    {editing && (
                      <div className="flex flex-col gap-1 pl-8">
                        {(["min", "max"] as const).map((edge) => (
                          <label key={edge} className="flex items-center gap-2">
                            <span className="w-8 text-xs text-neutral-500">{edge}</span>
                            <input
                              type="range"
                              min={j.rigMin}
                              max={j.rigMax}
                              value={j[edge]}
                              onChange={(e) => setJoint(j.id, edge, Number(e.target.value))}
                              className="flex-1"
                              aria-label={`${j.id} ${edge}`}
                            />
                            <input
                              type="number"
                              min={j.rigMin}
                              max={j.rigMax}
                              value={j[edge]}
                              onChange={(e) => setJoint(j.id, edge, Number(e.target.value))}
                              className="w-16 rounded border border-neutral-300 px-1 py-0.5 font-mono"
                            />
                          </label>
                        ))}
                        <span className="text-xs text-neutral-400">{fmt(S.rigRange, { min: j.rigMin, max: j.rigMax })}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="font-semibold">{S.channels}</h2>
              <div className="flex gap-2">
                {CHANNELS.map((c) => (
                  <label key={c} className="flex items-center gap-1.5 rounded border border-neutral-200 px-3 py-1.5 text-sm">
                    <input type="checkbox" checked={structure.channels.includes(c)} onChange={() => toggleChannel(c)} />
                    {CHANNEL_LABEL[c]}
                  </label>
                ))}
              </div>
            </section>

            <Button variant="primary" className="self-end" disabled={saving || editing} onClick={confirm}>{S.confirm}</Button>
          </div>
        </div>
      </div>

      <StageSteps current={0} />
    </div>
  );
}
