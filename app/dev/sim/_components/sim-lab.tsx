"use client";

import { useRef, useState } from "react";
import { BEHAVIORS } from "@/lib/sim/behaviors";
import { DEFAULT_PARAMS, type JointState, type PlaybackParams, type SimController } from "@/components/sim/sim-controller";
import { Viewport, type ViewportEvent } from "@/components/sim/Viewport";
import { FACE_NAMES } from "@/data/face-videos";
import { DEV_FACE_KEYS, DEV_RECIPES, DEV_SOUND, DEV_STRUCTURE, DEV_STRUCTURE_NARROW } from "@/data/dev-samples";
import { SOUND_CUES, cueAt } from "@/data/sound-cues";
import { createSoundEngine } from "@/lib/sound";
import type { SoundCue } from "@/lib/models";

const PARAM_SLIDERS: { key: keyof PlaybackParams; min: number; max: number }[] = [
  { key: "speed", min: 0.25, max: 2 },
  { key: "amplitude", min: 0, max: 2 },
  { key: "settle", min: 0, max: 1 },
  { key: "antic", min: 0, max: 1 },
  { key: "rhythm", min: 0.25, max: 3 },
];
type CueToken = "pitchSt" | "tempo" | "lengthS" | "volumeDb";
const CUE_SLIDERS: { key: CueToken; min: number; max: number; step: number }[] = [
  { key: "pitchSt", min: -12, max: 12, step: 1 },
  { key: "tempo", min: 0.5, max: 2, step: 0.05 },
  { key: "lengthS", min: 0.1, max: 2, step: 0.05 },
  { key: "volumeDb", min: -30, max: 0, step: 1 },
];

// Gray-box bench for the sim contract (STEP 3): everything goes through SimController.
export function SimLab() {
  const ctrl = useRef<SimController | null>(null);
  const [status, setStatus] = useState("Loading…");
  const [active, setActive] = useState<string | null>(null);
  const [time, setTime] = useState({ t: 0, duration: 0 });
  const [paused, setPaused] = useState(false);
  const [joints, setJoints] = useState<JointState[]>([]);
  const [params, setParams] = useState<Required<PlaybackParams>>(DEFAULT_PARAMS);
  const [faceMode, setFaceMode] = useState<string>("neutral");
  const [narrow, setNarrow] = useState(false);
  const [loop, setLoop] = useState(false);
  const [seekTo, setSeekTo] = useState(1.2);
  const [highlight, setHighlight] = useState<string>("");
  const [shot, setShot] = useState<string | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [sound] = useState(createSoundEngine);
  const [cue, setCue] = useState<SoundCue>(() => cueAt(SOUND_CUES[0].id, 0, SOUND_CUES[0].id));
  const [masterDb, setMasterDb] = useState(0);
  const [quiet, setQuiet] = useState(false);

  function onEvent(e: ViewportEvent) {
    switch (e.type) {
      case "ready":
        setStatus("Ready");
        ctrl.current?.setFace({ preset: "neutral" });
        break;
      case "error":
        setStatus(`Error: ${e.message}`);
        break;
      case "playing":
        setActive(e.name);
        setPaused(false);
        break;
      case "ended":
        setActive((a) => (a === e.name ? null : a));
        break;
      case "tick":
        setTime({ t: e.t, duration: e.duration });
        break;
      case "jointState":
        setJoints(e.joints);
        setPaused(ctrl.current?.isPaused() ?? false);
        break;
      case "limitExceeded": {
        console.warn("limitExceeded", e);
        const line = `limitExceeded ${e.joint} ${e.value.toFixed(1)} → limit ${e.limit.toFixed(1)} @ ${e.t.toFixed(2)}s`;
        setEvents((list) => [line, ...list].slice(0, 6));
        break;
      }
    }
  }

  function changeParam(key: keyof PlaybackParams, value: number) {
    setParams((p) => ({ ...p, [key]: value }));
    ctrl.current?.setParams({ [key]: value });
  }

  function applyPreset(name: string) {
    setFaceMode(name);
    ctrl.current?.setFace({ preset: name });
  }

  function pickCue(id: string) {
    const next = cueAt(id, 0, id);
    setCue(next);
    sound.preview(next);
  }

  function changeCue<K extends keyof SoundCue>(key: K, value: SoundCue[K]) {
    setCue((c) => ({ ...c, [key]: value }));
  }

  /** greeting recipe + DEV_SOUND cues + DEV_FACE_KEYS (smile from 1s, sleepy from 3s). */
  function playWithSound() {
    setFaceMode("neutral");
    ctrl.current?.setFace(DEV_FACE_KEYS);
    ctrl.current?.setSound(DEV_SOUND);
    ctrl.current?.playRecipe(DEV_RECIPES.greeting);
  }

  function toggleNarrow() {
    const next = !narrow;
    setNarrow(next);
    ctrl.current?.load(next ? DEV_STRUCTURE_NARROW : DEV_STRUCTURE);
  }

  const btn = "rounded border border-neutral-300 px-2 py-1 text-sm hover:bg-neutral-100 disabled:opacity-40";
  const on = "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800";
  const finite = Number.isFinite(time.duration);

  return (
    <main className="grid min-h-[var(--app-vh)] grid-cols-[1fr_400px] gap-6 p-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-4 text-sm">
          <h1 className="font-semibold">/dev/sim</h1>
          <span data-testid="sim-status" className="text-neutral-500">{status}</span>
          <span>Playing: <b>{active ?? (time.duration === 0 ? "holding" : "idle")}</b>{paused ? " (paused)" : ""}</span>
          <span className="font-mono text-neutral-500">
            t {time.t.toFixed(2)} / {finite ? time.duration.toFixed(2) : "∞"}
          </span>
        </div>
        <Viewport controllerRef={ctrl} structure={DEV_STRUCTURE} mode="editor" sound={sound} onEvent={onEvent} className="aspect-[4/3] w-full rounded border border-neutral-200" />
        <table className="text-sm">
          <thead className="text-left text-neutral-500">
            <tr><th>Joint</th><th>Command</th><th>Actual</th><th>Structure range</th></tr>
          </thead>
          <tbody className="font-mono">
            {joints.map((j) => {
              const range = (narrow ? DEV_STRUCTURE_NARROW : DEV_STRUCTURE).joints.find((x) => x.id === j.id);
              const out = range && (j.command < range.min || j.command > range.max);
              return (
                <tr key={j.id} className="border-t border-neutral-100">
                  <td>{j.id}</td>
                  <td className={out ? "text-red-600" : ""}>{j.command.toFixed(1)}</td>
                  <td>{j.actual.toFixed(1)}</td>
                  <td className="text-neutral-400">{range ? `${range.min} … ${range.max}` : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <aside className="flex flex-col gap-5 text-sm">
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">Behaviors</h2>
          <div className="flex flex-wrap gap-1.5">
            {BEHAVIORS.map((b) => (
              <button key={b.name} className={`${btn} ${active === b.name ? on : ""}`} onClick={() => ctrl.current?.playBehavior(b.name)}>
                {b.name}
              </button>
            ))}
          </div>
          <h2 className="mt-2 font-semibold">Recipes</h2>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(DEV_RECIPES).map(([name, recipe]) => (
              <button key={name} className={btn} onClick={() => ctrl.current?.playRecipe(recipe)}>{name}</button>
            ))}
            <button className={btn} onClick={() => ctrl.current?.debugCommand({ shoulder_pitch: 80 })}>Overdrive pose</button>
            <button className={btn} onClick={playWithSound}>greeting + sound + face keys</button>
            <button className={btn} onClick={() => { ctrl.current?.setSound(null); ctrl.current?.setFace({ preset: "neutral" }); }}>Clear sound/keys</button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">Transport</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <button className={btn} onClick={() => ctrl.current?.play()}>Play</button>
            <button className={btn} onClick={() => ctrl.current?.pause()}>Pause</button>
            <input type="number" step={0.1} min={0} value={seekTo} onChange={(e) => setSeekTo(Number(e.target.value))} className="w-16 rounded border border-neutral-300 px-1 py-1" />
            <button className={btn} onClick={() => { ctrl.current?.pause(); ctrl.current?.seek(seekTo); }}>Seek</button>
            <button className={btn} onClick={() => ctrl.current?.stop()}>Stop</button>
            <button className={`${btn} ${loop ? on : ""}`} onClick={() => { setLoop(!loop); ctrl.current?.setLoop(!loop); }}>Loop</button>
            <button className={btn} onClick={() => setShot(ctrl.current?.capture() || null)}>Capture</button>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={narrow} onChange={toggleNarrow} />
            Narrow shoulder_pitch to −20…40 (Edit limits)
          </label>
          <label className="flex items-center gap-2">
            Highlight
            <select value={highlight} onChange={(e) => { setHighlight(e.target.value); ctrl.current?.highlightJoint(e.target.value || null); }} className="rounded border border-neutral-300 px-1 py-1">
              <option value="">—</option>
              {DEV_STRUCTURE.joints.map((j) => <option key={j.id} value={j.id}>{j.id}</option>)}
            </select>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">Playback params</h2>
          {PARAM_SLIDERS.map(({ key, min, max }) => (
            <label key={key} className="flex items-center gap-2">
              <span className="w-20">{key}</span>
              <input type="range" min={min} max={max} step={(max - min) / 100} value={params[key]} onChange={(e) => changeParam(key, Number(e.target.value))} className="flex-1" />
              <span className="w-12 text-right font-mono">{params[key].toFixed(2)}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">Face</h2>
          <div className="flex flex-wrap gap-1.5">
            {FACE_NAMES.map((name) => (
              <button key={name} className={`${btn} ${faceMode === name ? on : ""}`} onClick={() => applyPreset(name)}>{name}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">Sound</h2>
          <div className="flex flex-wrap gap-1.5">
            {SOUND_CUES.map((c) => (
              <button key={c.id} className={`${btn} ${cue.id === c.id ? on : ""}`} onClick={() => pickCue(c.id)}>▶ {c.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20">timbre</span>
            {(["bright", "soft"] as const).map((t) => (
              <button key={t} className={`${btn} ${cue.timbre === t ? on : ""}`} onClick={() => changeCue("timbre", t)}>{t}</button>
            ))}
            <button className={`${btn} ml-auto`} onClick={() => sound.preview(cue)}>▶ Preview</button>
          </div>
          {CUE_SLIDERS.map(({ key, min, max, step }) => (
            <label key={key} className="flex items-center gap-2">
              <span className="w-20">{key}</span>
              <input type="range" min={min} max={max} step={step} value={cue[key]} onChange={(e) => changeCue(key, Number(e.target.value))} onPointerUp={() => sound.preview(cue)} className="flex-1" />
              <span className="w-12 text-right font-mono">{cue[key].toFixed(key === "pitchSt" || key === "volumeDb" ? 0 : 2)}</span>
            </label>
          ))}
          <label className="flex items-center gap-2">
            <span className="w-20">master dB</span>
            <input type="range" min={-24} max={12} step={1} value={masterDb} onChange={(e) => { setMasterDb(Number(e.target.value)); sound.setMasterDb(Number(e.target.value)); }} className="flex-1" />
            <span className="w-12 text-right font-mono">{masterDb}</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={quiet} onChange={(e) => { setQuiet(e.target.checked); sound.setQuietHours(e.target.checked); }} />
            Quiet hours (−12 dB)
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-semibold">Events</h2>
          {events.length === 0 ? <p className="text-neutral-400">—</p> : events.map((e, i) => <p key={i} className="font-mono text-xs text-red-600">{e}</p>)}
        </div>

        {shot && (
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold">Capture</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shot} alt="Capture" className="w-full rounded border border-neutral-200" />
          </div>
        )}
      </aside>
    </main>
  );
}
