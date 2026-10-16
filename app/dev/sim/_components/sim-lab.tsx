"use client";

import { useEffect, useRef, useState } from "react";
import { BEHAVIORS } from "@/lib/sim/behaviors";
import { FACE_RANGES, type FaceParams } from "@/components/sim/face-canvas";
import { SimRuntime, type JointState, type SimEvent } from "@/components/sim/runtime";
import { FACE_PRESETS, type FacePresetName } from "@/data/face-presets";

const SLIDERS: (keyof FaceParams)[] = ["eyeSize", "eyeOpen", "eyeAngle", "browAngle", "brightness", "blinkRate"];

// Gray-box test bench for the sim module (STEP 2). Not a product screen.
export function SimLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<SimRuntime | null>(null);
  const [status, setStatus] = useState("Loading…");
  const [active, setActive] = useState<string | null>(null);
  const [face, setFace] = useState<FaceParams>(FACE_PRESETS.neutral);
  const [faceMode, setFaceMode] = useState<FacePresetName | "video">("neutral");
  const [speed, setSpeed] = useState(1);
  const [joints, setJoints] = useState<JointState[]>([]);
  const [shot, setShot] = useState<string | null>(null);
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sim = new SimRuntime(canvas);
    simRef.current = sim;
    const off = sim.on((e: SimEvent) => {
      if (e.type === "progress") setStatus(`${e.progress.phase} ${e.progress.loaded}/${e.progress.total}`);
      if (e.type === "ready") {
        setStatus("Ready");
        sim.setFace({ kind: "canvas", params: FACE_PRESETS.neutral });
      }
      if (e.type === "error") setStatus(`Error: ${e.message}`);
      if (e.type === "playing") setActive(e.name);
      if (e.type === "ended") setActive((a) => (a === e.name ? null : a));
      if (e.type === "limitExceeded") {
        console.warn("limitExceeded", e);
        const line = `limitExceeded ${e.joint} ${e.value.toFixed(1)} → limit ${e.limit.toFixed(1)} @ ${e.t.toFixed(2)}s`;
        setEvents((list) => [line, ...list].slice(0, 6));
      }
    });
    sim.ready.catch(() => {});
    const ro = new ResizeObserver(([entry]) => sim.resize(entry.contentRect.width, entry.contentRect.height));
    ro.observe(canvas);
    const timer = setInterval(() => setJoints(sim.getJointState()), 100);
    return () => {
      clearInterval(timer);
      ro.disconnect();
      off();
      sim.dispose();
      simRef.current = null;
    };
  }, []);

  function applyPreset(name: FacePresetName | "video") {
    setFaceMode(name);
    if (name === "video") {
      simRef.current?.setFace({ kind: "video" });
      return;
    }
    setFace(FACE_PRESETS[name]);
    simRef.current?.setFace({ kind: "canvas", params: FACE_PRESETS[name] });
  }

  function setFaceParam(key: keyof FaceParams, value: number) {
    const next = { ...face, [key]: value };
    setFace(next);
    if (faceMode === "video") setFaceMode("neutral");
    simRef.current?.setFace({ kind: "canvas", params: next });
  }

  const btn = "rounded border border-neutral-300 px-2 py-1 text-sm hover:bg-neutral-100";
  const on = "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800";

  return (
    <main className="grid min-h-screen grid-cols-[1fr_380px] gap-6 p-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-sm">
          <h1 className="font-semibold">/dev/sim</h1>
          <span data-testid="sim-status" className="text-neutral-500">{status}</span>
          <span className="text-neutral-500">Playing: {active ?? "—"}</span>
        </div>
        <canvas ref={canvasRef} className="aspect-[4/3] w-full rounded border border-neutral-200" />
        <table className="text-sm">
          <thead className="text-left text-neutral-500">
            <tr><th>Joint</th><th>Command</th><th>Actual</th><th>Range</th></tr>
          </thead>
          <tbody className="font-mono">
            {joints.map((j) => (
              <tr key={j.id} className="border-t border-neutral-100">
                <td>{j.id}</td>
                <td className={j.command < j.min || j.command > j.max ? "text-red-600" : ""}>{j.command.toFixed(1)}</td>
                <td>{j.actual.toFixed(1)}</td>
                <td className="text-neutral-400">{j.min.toFixed(0)} … {j.max.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <aside className="flex flex-col gap-5 text-sm">
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">Behaviors</h2>
          <div className="flex flex-wrap gap-1.5">
            {BEHAVIORS.map((b) => (
              <button key={b.name} className={`${btn} ${active === b.name ? on : ""}`} onClick={() => simRef.current?.playBehavior(b.name)}>
                {b.name}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button className={btn} onClick={() => simRef.current?.stop()}>Stop</button>
            <button className={btn} onClick={() => simRef.current?.commandPose({ base_pitch: 80 }, "overdrive")}>Overdrive</button>
            <button className={btn} onClick={() => setShot(simRef.current?.capture() ?? null)}>Capture</button>
          </div>
          <label className="flex items-center gap-2">
            Speed
            <input type="range" min={0.25} max={2} step={0.05} value={speed} onChange={(e) => { const v = Number(e.target.value); setSpeed(v); simRef.current?.setSpeed(v); }} className="flex-1" />
            <span className="w-10 font-mono">{speed.toFixed(2)}</span>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">Face</h2>
          <div className="flex flex-wrap gap-1.5">
            {[...(Object.keys(FACE_PRESETS) as FacePresetName[]), "video" as const].map((name) => (
              <button key={name} className={`${btn} ${faceMode === name ? on : ""}`} onClick={() => applyPreset(name)}>{name}</button>
            ))}
          </div>
          {SLIDERS.map((key) => {
            const [min, max] = FACE_RANGES[key];
            return (
              <label key={key} className="flex items-center gap-2">
                <span className="w-24">{key}</span>
                <input type="range" min={min} max={max} step={(max - min) / 100} value={face[key]} onChange={(e) => setFaceParam(key, Number(e.target.value))} className="flex-1" />
                <span className="w-12 text-right font-mono">{face[key].toFixed(2)}</span>
              </label>
            );
          })}
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-semibold">Events</h2>
          {events.length === 0 ? <p className="text-neutral-400">—</p> : events.map((e, i) => <p key={i} className="font-mono text-xs text-red-600">{e}</p>)}
        </div>

        {shot && (
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold">Capture</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot} alt="Capture" data-testid="capture" className="w-full rounded border border-neutral-200" />
          </div>
        )}
      </aside>
    </main>
  );
}
