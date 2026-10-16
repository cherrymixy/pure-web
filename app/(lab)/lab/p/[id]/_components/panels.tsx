"use client";

import { STRINGS, fmt } from "@/data/strings";
import type { MotionProps, Structure } from "@/lib/models";
import type { PropWarning } from "@/lib/expression/props";
import type { JointState } from "@/components/sim/sim-controller";

const P = STRINGS.editor.props;
export const PROP_KEYS: (keyof MotionProps)[] = ["amplitude", "duration", "smoothness", "speed", "frequency"];
export const PROP_LABELS = P;

// W02D right panel: Motion Properties (0–100) with signature-range warnings.
export function MotionPanel({
  props,
  warnings,
  onChange,
  onCommit,
}: {
  props: MotionProps;
  warnings: PropWarning[];
  onChange: (key: keyof MotionProps, value: number) => void;
  onCommit: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {PROP_KEYS.map((key) => {
        const warn = warnings.find((w) => w.prop === key);
        return (
          <label key={key} className="flex flex-col gap-1 text-sm">
            <span className="flex justify-between">
              <span>{P[key]}</span>
              <span className={`font-mono ${warn ? "text-amber-700" : ""}`}>{Math.round(props[key])}</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={props[key]}
              aria-label={P[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
              onPointerUp={onCommit}
              onKeyUp={onCommit}
            />
            {warn && (
              <span className="text-xs text-amber-700">
                {fmt(STRINGS.editor.warnOutside, { lo: warn.range[0].toFixed(2), hi: warn.range[1].toFixed(2) })}
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}

// Joint Command / Actual, live from the sim; out-of-range rows in the error color.
export function JointTable({ joints, structure, flagged }: { joints: JointState[]; structure: Structure; flagged?: string | null }) {
  const J = STRINGS.editor.joint;
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-neutral-500">
        <tr><th className="font-normal">{J.title}</th><th className="font-normal">{J.command}</th><th className="font-normal">{J.actual}</th></tr>
      </thead>
      <tbody className="font-mono">
        {structure.joints.map((j) => {
          const s = joints.find((x) => x.id === j.id);
          const out = (s && (s.command < j.min || s.command > j.max)) || flagged === j.id;
          return (
            <tr key={j.id} data-testid={`joint-${j.id}`} className={`border-t border-neutral-100 ${out ? "text-red-600" : ""}`}>
              <td className="py-1 font-sans">{j.label}</td>
              <td>{s ? s.command.toFixed(1) : "—"}</td>
              <td>{s ? s.actual.toFixed(1) : "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
