"use client";

import { useRef, useState } from "react";
import { AXIS_INFO, AXIS_ORDER } from "@/data/signature";
import type { Axis } from "@/lib/models";

type Axes = Record<Axis, number>;

/** 8-axis radar. With `onChange`, vertices drag along their axis (0–100). `compare` draws a dashed overlay. */
export function Radar({ axes, compare, onChange, size = 320 }: { axes: Axes; compare?: Axes; onChange?: (axis: Axis, value: number) => void; size?: number }) {
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Axis | null>(null);
  const c = size / 2;
  const r = c - 44;
  const angle = (i: number) => (Math.PI * 2 * i) / AXIS_ORDER.length - Math.PI / 2;
  const point = (i: number, v: number) => [c + Math.cos(angle(i)) * r * (v / 100), c + Math.sin(angle(i)) * r * (v / 100)];
  const poly = (values: Axes) => AXIS_ORDER.map((ax, i) => point(i, values[ax]).join(",")).join(" ");

  function move(e: React.PointerEvent) {
    if (!drag || !onChange || !svg.current) return;
    const box = svg.current.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * size - c;
    const y = ((e.clientY - box.top) / box.height) * size - c;
    const i = AXIS_ORDER.indexOf(drag);
    // Project the pointer onto the axis direction.
    const along = x * Math.cos(angle(i)) + y * Math.sin(angle(i));
    onChange(drag, Math.max(0, Math.min(100, Math.round((along / r) * 100))));
  }

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="touch-none select-none text-neutral-400"
      onPointerMove={move}
      onPointerUp={() => setDrag(null)}
      onPointerLeave={() => setDrag(null)}
    >
      {[25, 50, 75, 100].map((ring) => (
        <polygon key={ring} points={AXIS_ORDER.map((_, i) => point(i, ring).join(",")).join(" ")} fill="none" stroke="currentColor" strokeOpacity={0.35} />
      ))}
      {AXIS_ORDER.map((ax, i) => {
        const [x2, y2] = point(i, 100);
        const [lx, ly] = point(i, 120);
        return (
          <g key={ax}>
            <line x1={c} y1={c} x2={x2} y2={y2} stroke="currentColor" strokeOpacity={0.25} />
            <text x={lx} y={ly} fontSize={11} textAnchor="middle" dominantBaseline="middle" fill="currentColor">
              {AXIS_INFO[ax].label} {axes[ax]}
            </text>
          </g>
        );
      })}
      {compare && <polygon data-testid="radar-compare" points={poly(compare)} fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="5 4" />}
      <polygon points={poly(axes)} fill="rgb(23 23 23 / 0.12)" stroke="rgb(23 23 23)" strokeWidth={1.5} />
      {onChange &&
        AXIS_ORDER.map((ax, i) => {
          const [x, y] = point(i, axes[ax]);
          return (
            <circle
              key={ax}
              cx={x}
              cy={y}
              r={drag === ax ? 8 : 6}
              fill="white"
              stroke="rgb(23 23 23)"
              strokeWidth={2}
              className="cursor-grab"
              aria-label={`${AXIS_INFO[ax].label} ${axes[ax]}`}
              onPointerDown={(e) => {
                (e.target as Element).setPointerCapture?.(e.pointerId);
                setDrag(ax);
              }}
            />
          );
        })}
    </svg>
  );
}
