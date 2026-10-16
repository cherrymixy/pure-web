"use client";

import { useEffect, useRef, useState } from "react";
import { ROBOT_TYPES } from "@/data/robot-types";
import { STRINGS, fmt } from "@/data/strings";
import type { RobotDevice, RobotType } from "@/lib/models";
import { api } from "@/lib/ui/api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Loading } from "@/components/ui/states";

const TS = STRINGS.test;
const CONNECT_MS = 1200;

type Phase = { kind: "list" } | { kind: "connecting"; robot: RobotDevice } | { kind: "offline"; robot: RobotDevice } | { kind: "playing"; robot: RobotDevice };

/**
 * W02F-1~2 Test on your robot (dummy robots): list → Connect → "Playing on …" card while the
 * viewport plays. Offline robots show E2. A limit stop closes the card; the editor's limit modal takes over.
 */
export function TestModal({
  open,
  projectType,
  t,
  playing,
  limitHit,
  onPlay,
  onStop,
  onExportInstead,
  onClose,
}: {
  open: boolean;
  projectType: RobotType;
  t: number;
  playing: boolean;
  limitHit: boolean;
  onPlay: () => void;
  onStop: () => void;
  onExportInstead: () => void;
  onClose: () => void;
}) {
  const [robots, setRobots] = useState<RobotDevice[] | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "list" });
  // The editor re-renders ~10×/s (joint state); keep callbacks out of effect deps.
  const cb = useRef({ onPlay, onClose });
  cb.current = { onPlay, onClose };

  useEffect(() => {
    if (!open) return;
    setPhase({ kind: "list" });
    api<RobotDevice[]>("/api/robots").then(setRobots, () => setRobots([]));
  }, [open]);

  useEffect(() => {
    if (phase.kind !== "connecting") return;
    const timer = setTimeout(() => {
      if (phase.robot.online) {
        setPhase({ kind: "playing", robot: phase.robot });
        cb.current.onPlay();
      } else setPhase({ kind: "offline", robot: phase.robot });
    }, CONNECT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // Limit stop: hand over to the editor's limit modal.
  useEffect(() => {
    if (limitHit && phase.kind === "playing") cb.current.onClose();
  }, [limitHit, phase.kind]);

  const close = () => {
    if (phase.kind === "playing") onStop();
    onClose();
  };
  const typeName = (type: RobotType) => ROBOT_TYPES.find((r) => r.id === type)?.name ?? type;

  return (
    <Modal open={open} onClose={close} title={phase.kind === "offline" ? fmt(TS.cantReach.title, { robot: phase.robot.name }) : TS.title}>
      {phase.kind === "list" &&
        (robots === null ? (
          <Loading label={STRINGS.common.loading} />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-neutral-600">{TS.body}</p>
            {robots.map((r) => (
              <div key={r.id} data-testid="robot-row" className="flex items-center gap-3 rounded border border-neutral-200 p-3 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${r.online ? "bg-green-600" : "bg-neutral-300"}`} />
                <span className="flex flex-1 flex-col">
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-xs text-neutral-500">
                    {typeName(r.type)} · {r.online ? TS.online : TS.offline}
                  </span>
                  {r.type !== projectType && <span className="text-xs text-amber-700">{fmt(TS.typeWarning, { type: typeName(r.type) })}</span>}
                </span>
                <Button variant="primary" onClick={() => setPhase({ kind: "connecting", robot: r })}>{TS.connect}</Button>
              </div>
            ))}
          </div>
        ))}

      {phase.kind === "connecting" && <Loading label={fmt(TS.connecting, { robot: phase.robot.name })} />}

      {phase.kind === "offline" && (
        <div role="alert" className="flex flex-col gap-3">
          <p className="text-sm text-neutral-600">{TS.cantReach.body}</p>
          <div className="flex justify-end gap-2">
            <Button onClick={onExportInstead}>{TS.exportInstead}</Button>
            <Button variant="primary" onClick={() => setPhase({ kind: "connecting", robot: phase.robot })}>{TS.retry}</Button>
          </div>
        </div>
      )}

      {phase.kind === "playing" && (
        <div className="flex flex-col gap-3" data-testid="playing-card">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${playing ? "animate-pulse bg-green-600" : "bg-neutral-400"}`} />
            <b>{fmt(TS.playingOn, { robot: phase.robot.name })}</b>
            <span className="ml-auto font-mono text-sm">{fmt(TS.elapsed, { t: t.toFixed(1) })}</span>
          </div>
          <p className={`text-sm ${limitHit ? "text-red-600" : "text-green-700"}`}>{limitHit ? TS.limitHit : `✓ ${TS.withinLimits}`}</p>
          <div className="flex justify-end gap-2">
            {!playing && <Button onClick={onPlay}>{STRINGS.editor.replay}</Button>}
            <Button variant="primary" onClick={close}>{TS.stop}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
