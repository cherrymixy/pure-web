"use client";

import { useMemo, useState } from "react";
import { DEV_RECIPES, DEV_STRUCTURE_NARROW } from "@/data/dev-samples";
import { PROMPT_DEMOS } from "@/data/demo-recipes";
import { PURE_DESK_STRUCTURE } from "@/data/pure-desk";
import { SEED_SIGNATURES } from "@/data/seed";
import { demoToOutput, GenerationOutputSchema } from "@/lib/llm/generation";
import type { Clip, Structure } from "@/lib/models";
import {
  autoAdjust, buildExpression, buildPureJson, compatibility, fallback, limitCheck, propsToParams, recipeToClip, type BuiltExpression, type Issue,
} from "@/lib/expression";

export interface LlmSample {
  id: string;
  prompt: string;
  output: unknown;
}

type Source = { key: string; label: string; kind: "llm" | "demo" | "raw" };

const signature = SEED_SIGNATURES[1];
const STUDIO_ARM: Structure = { ...PURE_DESK_STRUCTURE, channels: ["motion"], joints: PURE_DESK_STRUCTURE.joints.map((j) => ({ ...j, min: Math.max(j.min, -25), max: Math.min(j.max, 25) })) };

// Gray-box bench for lib/expression (STEP 8).
export function ExpressionLab({ samples }: { samples: LlmSample[] }) {
  const sources: Source[] = [
    ...samples.map((s) => ({ key: `llm:${s.id}`, label: `LLM sample · ${s.prompt}`, kind: "llm" as const })),
    ...Object.entries(PROMPT_DEMOS).map(([id, d]) => ({ key: `demo:${id}`, label: `Demo · ${d.name}`, kind: "demo" as const })),
    ...Object.keys(DEV_RECIPES).map((id) => ({ key: `raw:${id}`, label: `Raw recipe (unvalidated) · ${id}`, kind: "raw" as const })),
  ];
  const [key, setKey] = useState(sources.find((s) => s.key === "raw:overdrive")?.key ?? sources[0].key);
  const [narrow, setNarrow] = useState(true);
  const [adjusted, setAdjusted] = useState<{ clip: Clip; changes: string[] } | null>(null);
  const structure = narrow ? DEV_STRUCTURE_NARROW : PURE_DESK_STRUCTURE;

  const built = useMemo(() => {
    const [kind, id] = key.split(":");
    let expression: BuiltExpression;
    let issues: Issue[] = [];
    if (kind === "raw") {
      // Bypass validation on purpose: shows the limit check + Auto-adjust path.
      const base = buildExpression(demoToOutput(PROMPT_DEMOS.here), { structure: PURE_DESK_STRUCTURE, signature });
      expression = { ...base.expression, name: id, motion: { ...base.expression.motion, recipe: DEV_RECIPES[id] } };
    } else {
      const output = kind === "llm" ? GenerationOutputSchema.parse(samples.find((s) => s.id === id)!.output) : demoToOutput(PROMPT_DEMOS[id as keyof typeof PROMPT_DEMOS]);
      ({ expression, issues } = buildExpression(output, { structure, signature }));
    }
    const { params, warnings } = propsToParams(expression.motion.props, signature.axes);
    const clip = recipeToClip(expression.motion.recipe, params, structure);
    return { expression, issues, params, warnings, clip };
  }, [key, structure, samples]);

  const clip = adjusted?.clip ?? built.clip;
  const violations = limitCheck(clip, structure);
  const expr = { ...built.expression, motion: { ...built.expression.motion, ...(adjusted ? { mode: "clip" as const, clip } : {}) } };
  const compatDesk = compatibility(expr, { name: "PURE Desk", structure });
  const compatArm = compatibility(expr, { name: "Studio arm", structure: STUDIO_ARM });
  const pure = buildPureJson({ name: "Dev bench", type: "joint-fixed", structure }, signature, expr, clip, { includeFallback: true, team: "Purebot Co." });

  function download() {
    const url = URL.createObjectURL(new Blob([pure.text], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${built.expression.name.replace(/\s+/g, "_")}.pure.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const btn = "rounded border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 disabled:opacity-40";
  const h = "font-semibold";

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-10 text-sm">
      <h1 className="text-2xl font-semibold">/dev/expression</h1>
      <div className="flex flex-wrap items-center gap-3">
        <select value={key} onChange={(e) => { setKey(e.target.value); setAdjusted(null); }} className="rounded border border-neutral-300 px-2 py-1">
          {sources.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={narrow} onChange={() => { setNarrow(!narrow); setAdjusted(null); }} />
          Structure: shoulder_pitch narrowed to −20…40
        </label>
      </div>

      <section className="flex flex-col gap-1">
        <h2 className={h}>1 · Validation <span className="font-normal text-neutral-500">{built.expression.name} · {built.issues.length} changes</span></h2>
        <p className="font-mono text-xs">{built.expression.motion.recipe.steps.map((s) => `${s.behavior}×${s.repeat} @${s.speed}/${s.amplitude}${s.face ? ` (${s.face})` : ""}`).join(" → ")}</p>
        <ul className="list-disc pl-5 text-neutral-600">{built.issues.map((i, n) => <li key={n}><span className="font-mono text-xs">{i.field}</span> {i.message}</li>)}</ul>
        {built.warnings.length > 0 && <p className="text-amber-700">Outside signature: {built.warnings.map((w) => w.prop).join(", ")}</p>}
      </section>

      <section className="flex flex-col gap-1">
        <h2 className={h}>2 · Clip <span className="font-normal text-neutral-500">{clip.duration.toFixed(2)}s · keys {Object.entries(clip.tracks).map(([id, k]) => `${id} ${k.length}`).join(" · ")}</span></h2>
        <p className="font-mono text-xs text-neutral-500">speed {built.params.speed.toFixed(2)} · amplitude {built.params.amplitude.toFixed(2)} · settle {built.params.settle.toFixed(2)} · antic {built.params.antic.toFixed(2)} · rhythm {built.params.rhythm.toFixed(2)}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className={h}>3 · Limit check</h2>
        {violations.length === 0 ? (
          <p data-testid="limits-ok" className="text-green-700">Within limits{adjusted ? " (after Auto-adjust)" : ""}</p>
        ) : (
          <>
            <ul data-testid="limits-fail" className="text-red-600">
              {violations.map((v) => <li key={v.joint}>{v.joint} reaches {v.value.toFixed(1)}° (limit {v.limit}°) first at {v.t.toFixed(2)}s</li>)}
            </ul>
            <div><button className={btn} onClick={() => setAdjusted(autoAdjust(built.clip, structure))}>Auto-adjust</button></div>
          </>
        )}
        {adjusted && <ul className="list-disc pl-5 text-neutral-600">{adjusted.changes.map((c, n) => <li key={n}>{c}</li>)}</ul>}
      </section>

      <section className="flex flex-col gap-1">
        <h2 className={h}>4 · Compatibility</h2>
        <p>PURE Desk: {compatDesk.length === 0 ? <span className="text-green-700">Ready</span> : <span className="text-red-600">{compatDesk.length} issue(s) — {compatDesk.map((i) => i.message).join("; ")}</span>}</p>
        <p>Studio arm (motion only, ±25°): {compatArm.length === 0 ? "Ready" : <span className="text-amber-700">{compatArm.length} issue(s) — {compatArm.map((i) => i.message).join("; ")}</span>}</p>
        <p className="text-neutral-500">With fallback (motion only): {compatibility(fallback(expr), { name: "Studio arm", structure: STUDIO_ARM }).filter((i) => i.kind === "channel").length === 0 ? "no channel issues" : "channel issues remain"}</p>
      </section>

      <section className="flex items-center gap-3">
        <h2 className={h}>5 · pure.json</h2>
        <span data-testid="pure-size" className="font-mono">{(pure.bytes / 1024).toFixed(1)} KB</span>
        <button className={btn} onClick={download}>Download pure.json</button>
      </section>
    </main>
  );
}
