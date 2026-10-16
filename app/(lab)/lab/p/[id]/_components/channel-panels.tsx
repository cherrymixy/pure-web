"use client";

import { useEffect, useRef } from "react";
import { FACE_PRESETS } from "@/data/face-presets";
import { SOUND_CUES } from "@/data/sound-cues";
import { STRINGS } from "@/data/strings";
import type { FaceSpec, SoundCue, SoundSpec } from "@/lib/models";
import { FACE_DEFAULTS, FACE_RANGES, FaceCanvas, type FaceParams } from "@/components/sim/face-canvas";
import { faceSpecToParams } from "@/components/sim/sim-controller";
import { Button } from "@/components/ui/button";

const F = STRINGS.editor.face;
const SND = STRINGS.editor.sound;
const TOKENS: (keyof FaceParams)[] = ["eyeSize", "eyeOpen", "eyeAngle", "browAngle"];
const DISPLAY: (keyof FaceParams)[] = ["brightness", "blinkRate"];
export const FACE_FIELDS = Object.fromEntries(
  (Object.keys(F.fields) as (keyof FaceParams)[]).map((k) => [k, { label: F.fields[k], digits: k === "eyeAngle" || k === "browAngle" || k === "blinkRate" ? 0 : 2 }]),
) as Record<keyof FaceParams, { label: string; digits: number }>;

/** Live thumbnail of the canvas face (same drawing code as the head display). */
function FacePreview({ spec }: { spec: FaceSpec }) {
  const view = useRef<HTMLCanvasElement>(null);
  const face = useRef<FaceCanvas | null>(null);

  useEffect(() => {
    face.current ??= new FaceCanvas();
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const src = face.current!;
      src.draw(now / 1000);
      const ctx = view.current?.getContext("2d");
      if (ctx && view.current) ctx.drawImage(src.canvas, 0, 0, view.current.width, view.current.height);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    face.current ??= new FaceCanvas();
    face.current.setParams(spec.preset === "video" ? FACE_DEFAULTS : faceSpecToParams(spec));
  }, [spec]);

  return <canvas ref={view} width={270} height={162} data-testid="face-preview" className="w-full rounded bg-black" />;
}

function Slider({ label, value, min, max, step, digits, onChange, onCommit }: { label: string; value: number; min: number; max: number; step: number; digits: number; onChange: (v: number) => void; onCommit: () => void }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="font-mono">{value.toFixed(digits)}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={(e) => onChange(Number(e.target.value))} onPointerUp={onCommit} onKeyUp={onCommit} />
    </label>
  );
}

// W02E Face: preview, presets, tokens, display. Edits apply live; release commits one change.
export function FacePanel({ face, onChange, onCommit }: { face: FaceSpec; onChange: (next: FaceSpec) => void; onCommit: (next?: FaceSpec) => void }) {
  const isVideo = face.preset === "video";
  const setToken = (k: keyof FaceParams, v: number) => onChange({ ...face, tokens: { ...face.tokens, [k]: v } });
  const pick = (preset: string) => {
    const next = preset === "video" ? { ...face, preset } : { ...face, preset, tokens: { ...FACE_PRESETS[preset as keyof typeof FACE_PRESETS] } };
    onChange(next);
    onCommit(next);
  };
  const slider = (k: keyof FaceParams) => {
    const [min, max] = FACE_RANGES[k];
    return (
      <Slider
        key={k}
        label={F.fields[k]}
        value={face.tokens[k] ?? FACE_DEFAULTS[k]}
        min={min}
        max={max}
        step={(max - min) / 100}
        digits={FACE_FIELDS[k].digits}
        onChange={(v) => setToken(k, v)}
        onCommit={() => onCommit()}
      />
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <h3 className="text-xs text-neutral-500">{F.expression}</h3>
        <FacePreview spec={face} />
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-xs text-neutral-500">{F.preset}</h3>
        <div className="flex flex-wrap gap-1.5">
          {[...Object.keys(FACE_PRESETS), "video"].map((p) => (
            <button key={p} aria-pressed={face.preset === p} onClick={() => pick(p)} className={`rounded-full border px-2.5 py-0.5 text-xs ${face.preset === p ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:bg-neutral-100"}`}>
              {p === "video" ? F.video : p}
            </button>
          ))}
        </div>
        {isVideo && <p className="text-xs text-neutral-500">{F.videoNote}</p>}
      </section>
      {!isVideo && (
        <>
          <section className="flex flex-col gap-2">
            <h3 className="text-xs text-neutral-500">{F.tokens}</h3>
            {TOKENS.map(slider)}
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="text-xs text-neutral-500">{F.display}</h3>
            {DISPLAY.map(slider)}
          </section>
        </>
      )}
    </div>
  );
}

const CUE_SLIDERS: { key: "pitchSt" | "tempo" | "lengthS" | "volumeDb"; min: number; max: number; step: number; digits: number }[] = [
  { key: "pitchSt", min: -12, max: 12, step: 0.5, digits: 1 },
  { key: "tempo", min: 0.5, max: 2, step: 0.05, digits: 2 },
  { key: "lengthS", min: 0.1, max: 2, step: 0.05, digits: 2 },
];

// W02E Sound: cue list (▶ preview, select), tokens, output (volume, quiet hours).
export function SoundPanel({
  sound,
  selected,
  quietHours,
  onSelect,
  onPreview,
  onChange,
  onCommit,
  onAdd,
  onRemove,
  onQuietHours,
}: {
  sound: SoundSpec;
  selected: string | null;
  quietHours: boolean;
  onSelect: (id: string) => void;
  onPreview: (cue: SoundCue) => void;
  onChange: (next: SoundSpec) => void;
  onCommit: (next?: SoundSpec) => void;
  onAdd: (presetId: string) => void;
  onRemove: (id: string) => void;
  onQuietHours: (on: boolean) => void;
}) {
  const cue = sound.cues.find((c) => c.id === selected) ?? null;
  const setCue = (patch: Partial<SoundCue>) => onChange({ cues: sound.cues.map((c) => (c.id === selected ? { ...c, ...patch } : c)) });
  const label = (c: SoundCue) => SOUND_CUES.find((p) => c.id.startsWith(p.id))?.label ?? c.id;

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-1.5">
        <h3 className="text-xs text-neutral-500">{SND.cues}</h3>
        {sound.cues.length === 0 && <span className="text-sm text-neutral-500">{STRINGS.editor.noCues}</span>}
        {[...sound.cues].sort((a, b) => a.t - b.t).map((c) => (
          <div key={c.id} data-testid="cue" className={`flex items-center gap-2 rounded border px-2 py-1 text-sm ${c.id === selected ? "border-neutral-900" : "border-neutral-200"}`}>
            <button aria-label={`Preview ${label(c)}`} onClick={() => onPreview(c)} className="px-1">▶</button>
            <button className="flex-1 text-left" onClick={() => onSelect(c.id)}>{label(c)}</button>
            <span className="font-mono text-xs text-neutral-500">{c.t.toFixed(2)}s</span>
            <button aria-label={SND.remove} className="px-1 text-neutral-400 hover:text-neutral-900" onClick={() => onRemove(c.id)}>×</button>
          </div>
        ))}
        <select value="" onChange={(e) => e.target.value && onAdd(e.target.value)} className="rounded border border-neutral-300 px-2 py-1 text-sm" aria-label={SND.add}>
          <option value="">+ {SND.add}</option>
          {SOUND_CUES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs text-neutral-500">{SND.tokens}</h3>
        {!cue ? (
          <span className="text-sm text-neutral-500">{SND.select}</span>
        ) : (
          <>
            {CUE_SLIDERS.map(({ key, min, max, step, digits }) => (
              <Slider key={key} label={SND.fields[key]} value={cue[key]} min={min} max={max} step={step} digits={digits} onChange={(v) => setCue({ [key]: v })} onCommit={() => { onCommit(); onPreview(cue); }} />
            ))}
            <div className="flex items-center gap-2 text-sm">
              <span className="flex-1">{SND.fields.timbre}</span>
              {(["bright", "soft"] as const).map((t) => (
                <Button
                  key={t}
                  variant={cue.timbre === t ? "primary" : "default"}
                  onClick={() => {
                    const next = { cues: sound.cues.map((c) => (c.id === selected ? { ...c, timbre: t } : c)) };
                    onChange(next);
                    onCommit(next);
                    onPreview({ ...cue, timbre: t });
                  }}
                >
                  {SND.timbre[t]}
                </Button>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs text-neutral-500">{SND.output}</h3>
        {cue && <Slider label={SND.fields.volumeDb} value={cue.volumeDb} min={-30} max={0} step={1} digits={0} onChange={(v) => setCue({ volumeDb: v })} onCommit={() => { onCommit(); onPreview(cue); }} />}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={quietHours} onChange={(e) => onQuietHours(e.target.checked)} />
          {SND.quietHours}
        </label>
      </section>
    </div>
  );
}
