"use client";

import { useEffect, useRef, useState } from "react";
import { ROBOT_DEVICE_STRUCTURES } from "@/data/robot-devices";
import { ROBOT_TYPES } from "@/data/robot-types";
import { STRINGS, fmt } from "@/data/strings";
import type { RobotDevice, RobotType } from "@/lib/models";
import { api } from "@/lib/ui/api";
import { Icon } from "@/components/ui/icons/icon";
import { Modal, ModalActions, ModalButton, ModalCard } from "@/components/ui/modal";

const TS = STRINGS.test;
const CONNECT_MS = 1200;

type Phase = { kind: "list" } | { kind: "connecting"; robot: RobotDevice } | { kind: "offline"; robot: RobotDevice } | { kind: "playing"; robot: RobotDevice };

/** 00:01.25 — W02F-2 time readout. */
const clock = (s: number) => {
  const v = Math.max(0, s);
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${(v % 60).toFixed(2).padStart(5, "0")}`;
};

/** Label / value row (W02F-2, W02F-4): Body 16 secondary · Label 16 medium. */
function Row({ label, value, tone = "primary" }: { label: string; value: React.ReactNode; tone?: "primary" | "success" | "error" }) {
  const color = tone === "success" ? "text-[var(--status-success)]" : tone === "error" ? "text-[var(--text-error)]" : "text-[var(--text-primary)]";
  return (
    <div className="flex items-start justify-between gap-[var(--space-16)] whitespace-nowrap text-[16px] leading-[20px]">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}

/**
 * W02F-1~2 Test on your robot (dummy robots): list → Connect → "Playing on …" card while the
 * viewport plays. Offline robots show E2. A limit stop closes the card; the editor's limit modal takes over.
 * The playing card floats at the top of the stage without a backdrop (Figma 901:13440).
 */
export function TestModal({
  open,
  projectType,
  t,
  duration = 0,
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
  duration?: number;
  playing: boolean;
  limitHit: boolean;
  onPlay: () => void;
  onStop: () => void;
  onExportInstead: () => void;
  onClose: () => void;
}) {
  const [robots, setRobots] = useState<RobotDevice[] | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "list" });
  const [selected, setSelected] = useState<string | null>(null);
  // The editor re-renders ~10×/s (joint state); keep callbacks out of effect deps.
  const cb = useRef({ onPlay, onClose });
  cb.current = { onPlay, onClose };

  useEffect(() => {
    if (!open) return;
    setPhase({ kind: "list" });
    api<RobotDevice[]>("/api/robots").then(
      (list) => {
        setRobots(list);
        setSelected((cur) => cur ?? list.find((r) => r.online)?.id ?? list[0]?.id ?? null);
      },
      () => setRobots([]),
    );
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
  const closeRef = useRef(close);
  closeRef.current = close;

  // The floating card has no backdrop; Escape still stops and closes it.
  const floating = open && phase.kind === "playing";
  useEffect(() => {
    if (!floating) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [floating]);

  const typeName = (type: RobotType) => ROBOT_TYPES.find((r) => r.id === type)?.name ?? type;
  const chosen = robots?.find((r) => r.id === selected) ?? null;

  if (phase.kind === "playing") {
    if (!open) return null;
    return (
      <ModalCard
        role="dialog"
        aria-label={fmt(TS.playingOn, { robot: phase.robot.name })}
        data-testid="playing-card"
        title={fmt(TS.playingOn, { robot: phase.robot.name })}
        className="fixed left-[calc(50%-310px)] top-[48px] z-40 w-[480px]"
      >
        <div className="flex flex-col gap-[var(--space-12)]">
          <Row label={TS.rows.time} value={duration > 0 ? `${clock(t)} / ${clock(duration)}` : clock(t)} />
          <Row label={TS.rows.joints} value={limitHit ? TS.limitHit : TS.withinLimits} tone={limitHit ? "error" : "success"} />
        </div>
        <ModalActions>
          {!playing && <ModalButton onClick={onPlay}>{STRINGS.editor.replay}</ModalButton>}
          <ModalButton onClick={close}>{TS.stop}</ModalButton>
        </ModalActions>
      </ModalCard>
    );
  }

  const offline = phase.kind === "offline";
  return (
    <Modal
      open={open}
      onClose={close}
      title={offline ? fmt(TS.cantReach.title, { robot: phase.robot.name }) : TS.title}
      description={offline ? TS.cantReach.body : TS.body}
    >
      {phase.kind === "list" && (
        <>
          {robots === null ? (
            <Pending label={STRINGS.common.loading} />
          ) : (
            <div className="flex flex-col gap-[var(--space-16)]" role="radiogroup" aria-label={TS.title}>
              {robots.map((r) => {
                const on = r.id === selected;
                const joints = ROBOT_DEVICE_STRUCTURES[r.id]?.joints.length;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    data-testid="robot-row"
                    onClick={() => setSelected(r.id)}
                    className={`flex w-full items-center gap-[var(--space-16)] rounded-[var(--radius-md)] border-[1.5px] px-[var(--space-20)] py-[var(--space-16)] text-left ${on ? "border-[var(--border-strong)] bg-[var(--bg-canvas)]" : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)]"}`}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-4)]">
                      <span className="text-[16px] font-medium leading-[20px] text-[var(--text-primary)]">{r.name}</span>
                      <span className="text-[14px] leading-[18px] text-[var(--text-secondary)]">
                        {joints ? fmt(TS.joints, { type: typeName(r.type), n: joints }) : typeName(r.type)}
                      </span>
                      {r.type !== projectType && <span className="text-[14px] leading-[18px] text-[var(--text-error)]">{fmt(TS.typeWarning, { type: typeName(r.type) })}</span>}
                    </span>
                    <span className={`shrink-0 whitespace-nowrap text-[14px] font-medium leading-[18px] ${r.online ? "text-[var(--status-success)]" : "text-[var(--text-error)]"}`}>
                      ● {r.online ? TS.online : TS.offline}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <ModalActions>
            <ModalButton onClick={close}>{STRINGS.common.cancel}</ModalButton>
            <ModalButton variant="primary" disabled={!chosen} onClick={() => chosen && setPhase({ kind: "connecting", robot: chosen })}>{TS.connect}</ModalButton>
          </ModalActions>
        </>
      )}

      {phase.kind === "connecting" && (
        <>
          <Pending label={fmt(TS.connecting, { robot: phase.robot.name })} />
          <ModalActions>
            <ModalButton onClick={close}>{STRINGS.common.cancel}</ModalButton>
          </ModalActions>
        </>
      )}

      {phase.kind === "offline" && (
        <div role="alert">
          <ModalActions>
            <ModalButton onClick={onExportInstead}>{TS.exportInstead}</ModalButton>
            <ModalButton variant="primary" onClick={() => setPhase({ kind: "connecting", robot: phase.robot })}>{TS.retry}</ModalButton>
          </ModalActions>
        </div>
      )}
    </Modal>
  );
}

function Pending({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-[var(--space-12)] rounded-[var(--radius-md)] border-[1.5px] border-[var(--border-default)] px-[var(--space-20)] py-[var(--space-16)] text-[16px] leading-[20px] text-[var(--text-secondary)]">
      <Icon name="spinner" size={20} className="animate-spin" />
      {label}
    </div>
  );
}
