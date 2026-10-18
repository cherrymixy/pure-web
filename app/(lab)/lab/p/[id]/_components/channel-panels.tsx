"use client";

import { useEffect, useRef } from "react";
import { FACE_AUTO, FACE_NAMES } from "@/data/face-videos";
import { SOUND_CUES } from "@/data/sound-cues";
import { STRINGS } from "@/data/strings";
import type { FaceSpec, SoundCue, SoundSpec } from "@/lib/models";
import { faceLabel, faceVideoUrl } from "@/lib/expression/face";
import { BarSlider, PANEL_BOX, PanelSection } from "./panels";

const F = STRINGS.editor.face;
const SND = STRINGS.editor.sound;

/** The face video itself (same mp4 the head display plays). */
function FacePreview({ preset }: { preset: string }) {
  return (
    <video
      key={preset}
      src={faceVideoUrl(preset)}
      muted
      loop
      autoPlay
      playsInline
      data-testid="face-preview"
      className="aspect-[5/3] w-full rounded-[var(--radius-md)] bg-[var(--neutral-1000)] object-cover"
    />
  );
}

/** Pill used for presets / timbre (no dedicated frame; same scale as the W02E-1 tabs and chips). */
const pill = (on: boolean) =>
  `rounded-[var(--radius-full)] px-[var(--space-16)] py-[var(--space-8)] text-[14px] leading-[18px] ${on ? "bg-[var(--neutral-800)] text-[var(--text-on-inverse)]" : "bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-muted)]"}`;

// W02E Face: video preview + face video picker. Picking commits one change.
export function FacePanel({ face, onChange, onCommit }: { face: FaceSpec; onChange: (next: FaceSpec) => void; onCommit: (next?: FaceSpec) => void }) {
  const pick = (preset: string) => {
    const next = { ...face, preset };
    onChange(next);
    onCommit(next);
  };

  return (
    <div className="flex flex-col gap-[56px]">
      <PanelSection title={F.expression}>
        <FacePreview preset={face.preset} />
      </PanelSection>
      <PanelSection title={F.preset}>
        <div className="flex flex-wrap gap-[var(--space-8)]">
          {FACE_NAMES.map((p) => (
            <button key={p} type="button" aria-pressed={face.preset === p} onClick={() => pick(p)} className={pill(face.preset === p)}>
              {faceLabel(p)}
            </button>
          ))}
        </div>
        {face.preset === FACE_AUTO && <p className="text-[14px] leading-[18px] text-[var(--text-secondary)]">{F.autoNote}</p>}
      </PanelSection>
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

  const empty = "text-[16px] leading-[20px] text-[var(--text-secondary)]";
  return (
    <div className="flex flex-col gap-[56px]">
      <PanelSection title={SND.cues} meta={sound.cues.length || undefined}>
        <div className="flex flex-col gap-[var(--space-8)] rounded-[var(--radius-lg)] bg-[var(--bg-canvas)] p-[var(--space-12)]">
          {sound.cues.length === 0 && <span className={`px-[var(--space-8)] py-[var(--space-4)] ${empty}`}>{STRINGS.editor.noCues}</span>}
          {[...sound.cues].sort((a, b) => a.t - b.t).map((c) => (
            <div
              key={c.id}
              data-testid="cue"
              className={`flex items-center gap-[var(--space-8)] rounded-[var(--radius-sm)] px-[var(--space-8)] py-[var(--space-8)] text-[16px] leading-[20px] text-[var(--text-primary)] ${c.id === selected ? "bg-[var(--bg-surface)] shadow-[var(--pure-shadow-card)]" : ""}`}
            >
              <button type="button" aria-label={`Preview ${label(c)}`} onClick={() => onPreview(c)} className="flex size-[24px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--primary)] text-[10px] text-[var(--bg-canvas)]">▶</button>
              <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={() => onSelect(c.id)}>{label(c)}</button>
              <span className="text-[12px] leading-[15px] tabular-nums text-[var(--text-tertiary)]">{c.t.toFixed(2)}s</span>
              <button type="button" aria-label={SND.remove} className="px-[var(--space-4)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" onClick={() => onRemove(c.id)}>×</button>
            </div>
          ))}
        </div>
        <div className="relative">
          <select value="" onChange={(e) => e.target.value && onAdd(e.target.value)} className="w-full appearance-none rounded-[var(--radius-full)] bg-[var(--bg-surface-muted)] px-[var(--space-16)] py-[var(--space-8)] text-[14px] leading-[18px] text-[var(--text-primary)] outline-none" aria-label={SND.add}>
            <option value="">+ {SND.add}</option>
            {SOUND_CUES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
      </PanelSection>

      <PanelSection title={SND.tokens}>
        {!cue ? (
          <span className={empty}>{SND.select}</span>
        ) : (
          <div className={PANEL_BOX}>
            {CUE_SLIDERS.map(({ key, min, max, step, digits }) => (
              <BarSlider key={key} label={SND.fields[key]} value={cue[key]} min={min} max={max} step={step} digits={digits} onChange={(v) => setCue({ [key]: v })} onCommit={() => { onCommit(); onPreview(cue); }} />
            ))}
            <div className="flex items-center justify-between">
              <span className="flex items-start gap-[var(--space-4)]">
                <span className="mt-[2px] size-[5px] shrink-0 rounded-[var(--radius-full)] bg-[var(--neutral-300)]" aria-hidden />
                <span className="text-[16px] leading-[20px] text-[var(--text-primary)]">{SND.fields.timbre}</span>
              </span>
              <span className="flex gap-[var(--space-8)]">
                {(["bright", "soft"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={cue.timbre === t}
                    className={pill(cue.timbre === t)}
                    onClick={() => {
                      const next = { cues: sound.cues.map((c) => (c.id === selected ? { ...c, timbre: t } : c)) };
                      onChange(next);
                      onCommit(next);
                      onPreview({ ...cue, timbre: t });
                    }}
                  >
                    {SND.timbre[t]}
                  </button>
                ))}
              </span>
            </div>
          </div>
        )}
      </PanelSection>

      <PanelSection title={SND.output}>
        <div className={PANEL_BOX}>
          {cue && <BarSlider label={SND.fields.volumeDb} value={cue.volumeDb} min={-30} max={0} step={1} digits={0} onChange={(v) => setCue({ volumeDb: v })} onCommit={() => { onCommit(); onPreview(cue); }} />}
          <label className="flex items-center gap-[var(--space-8)] text-[16px] leading-[20px] text-[var(--text-primary)]">
            <input type="checkbox" checked={quietHours} onChange={(e) => onQuietHours(e.target.checked)} className="size-[16px] accent-[var(--sage-400)]" />
            {SND.quietHours}
          </label>
        </div>
      </PanelSection>
    </div>
  );
}
