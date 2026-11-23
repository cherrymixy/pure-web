"use client";

import { useMemo, useRef, useState } from "react";
import { PURE_DESK_STRUCTURE } from "@/data/pure-desk";
import { SHOWCASE_MOTIONS, SHOWCASE_STRINGS as S } from "@/data/showcase";
import { STRINGS, fmt } from "@/data/strings";
import { fillFirmware } from "@/lib/robot-firmware";
import { motorAngles, poseUrl, robotReachable } from "@/lib/robot-link";
import { createSoundEngine } from "@/lib/sound";
import { downloadText } from "@/lib/ui/download";
import { Viewport, type ViewportEvent } from "@/components/sim/Viewport";
import type { SimController } from "@/components/sim/sim-controller";
import { Icon } from "@/components/ui/icons/icon";
import { showcaseClip, showcasePaths } from "./showcase-clip";

type Robot = "off" | "connecting" | "on" | "offline";

export function Showcase() {
  const [selected, setSelected] = useState(0);
  const [cue, setCue] = useState(0);
  const [loop, setLoop] = useState(true);
  const [robot, setRobot] = useState<Robot>("off");
  const [note, setNote] = useState("");
  const [sound] = useState(createSoundEngine);
  const ctrl = useRef<SimController | null>(null);
  const sending = useRef(false);
  const robotOn = useRef(false);
  robotOn.current = robot === "on";

  const motion = SHOWCASE_MOTIONS[selected];
  // cue in the deps: Replay rebuilds the expression so the viewport restarts it from t = 0.
  const clip = useMemo(() => showcaseClip(motion), [motion]);
  const expression = useMemo(
    () => ({
      motion: { mode: "clip" as const, recipe: motion.recipe ?? { steps: [] }, clip: { ...clip, loop } },
      face: motion.face,
      sound: motion.sound,
      cue,
    }),
    [motion, clip, loop, cue],
  );

  function onEvent(e: ViewportEvent) {
    if (e.type === "ready") ctrl.current?.setLoop(loop);
    // Stream each joint-state frame (~10/s) to the ESP32; skip frames while a request is in flight.
    if (e.type === "jointState" && robotOn.current && !sending.current && e.joints.length) {
      sending.current = true;
      fetch(poseUrl(motorAngles(e.joints)), { cache: "no-store" })
        .catch(() => {})
        .finally(() => {
          sending.current = false;
        });
    }
  }

  async function toggleRobot() {
    if (robot === "on" || robot === "connecting") return setRobot("off");
    setRobot("connecting");
    const ok = await robotReachable();
    setRobot(ok ? "on" : "offline");
    if (ok) setCue((c) => c + 1);
  }

  async function downloadCode() {
    try {
      const res = await fetch("/api/firmware");
      if (!res.ok) throw new Error(String(res.status));
      const paths = showcasePaths(motion);
      const file = `pure_${motion.id}.ino`;
      downloadText(file, fillFirmware(await res.text(), paths, motion.title), "text/plain");
      setNote(fmt(S.codeDone, { file }));
    } catch {
      setNote(S.codeFailed);
    }
  }

  const pill = "flex items-center gap-[var(--space-8)] rounded-[var(--radius-full)] px-[var(--space-20)] py-[12px] text-[16px] font-medium";
  const robotLabel = robot === "on" ? S.robotOn : robot === "connecting" ? S.robotConnecting : S.robot;

  return (
    <div className="flex h-[var(--app-vh)] flex-col bg-[var(--home-canvas)]">
      <header className="flex items-center justify-between px-[var(--space-40)] pb-[var(--space-16)] pt-[var(--space-24)]">
        <div className="flex items-center gap-[var(--space-12)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/brand/logo-mark.svg" alt="" width={30} height={30} />
          <span className="text-[22px] font-semibold text-[var(--home-ink)]">{STRINGS.brand.name}</span>
          <span className="text-[18px] text-[var(--home-ink-3)]">{S.subtitle}</span>
        </div>
        <h1 className="sr-only">{S.title}</h1>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_440px] gap-[var(--space-24)] px-[var(--space-32)] pb-[var(--space-32)]">
        <div className="relative min-h-0 overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--neutral-0)]">
          <Viewport
            controllerRef={ctrl}
            mode="share"
            orbit
            structure={PURE_DESK_STRUCTURE}
            expression={expression}
            autoPlay
            sound={sound}
            onEvent={onEvent}
            className="block size-full"
          />
          <div className="absolute bottom-[var(--space-24)] left-[var(--space-24)] flex flex-col gap-[4px]">
            <span className="text-[40px] font-semibold leading-none text-[var(--home-ink)]">{motion.title}</span>
            <span className="text-[18px] text-[var(--home-ink-3)]">{motion.summary}</span>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-[var(--space-24)] overflow-y-auto rounded-[var(--radius-xl)] bg-[var(--neutral-0)] p-[var(--space-32)]">
          <ul className="flex flex-col gap-[var(--space-8)]">
            {SHOWCASE_MOTIONS.map((m, i) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => { setSelected(i); setCue((c) => c + 1); }}
                  aria-pressed={i === selected}
                  className={`flex w-full items-center gap-[var(--space-16)] rounded-[var(--radius-md)] border-[1.5px] px-[var(--space-20)] py-[var(--space-16)] text-left ${
                    i === selected ? "border-[var(--home-ink-3)] bg-[var(--neutral-0)]" : "border-transparent bg-[var(--home-canvas)] hover:bg-[var(--neutral-150)]"
                  }`}
                >
                  <span className={`text-[15px] font-semibold tabular-nums ${i === selected ? "text-[var(--home-ink)]" : "text-[var(--home-ink-3)]"}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex min-w-0 flex-col gap-[2px]">
                    <span className="text-[18px] font-medium leading-[24px] text-[var(--home-ink)]">{m.title}</span>
                    <span className="text-[14px] leading-[20px] text-[var(--home-ink-3)]">{m.summary}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-[var(--space-8)]">
            <button type="button" onClick={() => setCue((c) => c + 1)} className={`${pill} bg-[var(--home-canvas)] text-[var(--home-ink)]`}>
              <Icon name="replay" size={20} />
              {S.replay}
            </button>
            <button
              type="button"
              aria-pressed={loop}
              onClick={() => { setLoop(!loop); ctrl.current?.setLoop(!loop); }}
              className={`${pill} ${loop ? "bg-[var(--neutral-800)] text-[var(--neutral-0)]" : "bg-[var(--home-canvas)] text-[var(--home-ink)]"}`}
            >
              {S.loop}
            </button>
          </div>

          <div className="mt-auto flex flex-col gap-[var(--space-12)] border-t border-[var(--home-line)] pt-[var(--space-24)]">
            <button
              type="button"
              aria-pressed={robot === "on"}
              onClick={() => void toggleRobot()}
              className={`${pill} justify-center ${robot === "on" ? "bg-[var(--neutral-800)] text-[var(--neutral-0)]" : "bg-[var(--home-canvas)] text-[var(--home-ink)]"}`}
            >
              <Icon name="bluetooth" size={20} />
              {robotLabel}
            </button>
            {robot === "offline" && <span className="text-[14px] text-[var(--text-error)]" role="alert">{S.robotOffline}</span>}
            <button type="button" onClick={() => void downloadCode()} className={`${pill} justify-center bg-[var(--home-canvas)] text-[var(--home-ink)]`}>
              <Icon name="download-minimalistic" size={20} />
              {S.code}
            </button>
            {note && <span className="text-[14px] text-[var(--home-ink-3)]" role="status">{note}</span>}
          </div>
        </aside>
      </main>
    </div>
  );
}
