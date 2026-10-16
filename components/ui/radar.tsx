"use client";

import { useRef, useState } from "react";
import { AXIS_INFO, AXIS_ORDER } from "@/data/signature";
import type { Axis } from "@/lib/models";

type Axes = Record<Axis, number>;

const RINGS = [100 / 3, 200 / 3, 100]; // Figma 901:9458–9460: three octagon rings
const RADIUS = 120 / 152; // ring radius / half size (Figma 120 px ring in the 304 px radar, ×2)

/**
 * 8-axis radar (Figma 901:9457 ×2). With `onChange`, vertices drag along their axis (0–100). `compare` draws a dashed overlay.
 * Labels are the axis keys (tempo, amp, …) as in Figma; the dragged axis also shows its value.
 */
export function Radar({ axes, compare, onChange, size = 320 }: { axes: Axes; compare?: Axes; onChange?: (axis: Axis, value: number) => void; size?: number }) {
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Axis | null>(null);
  const c = size / 2;
  const r = c * RADIUS;
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
      className="touch-none select-none overflow-visible"
      onPointerMove={move}
      onPointerUp={() => setDrag(null)}
      onPointerLeave={() => setDrag(null)}
    >
      {RINGS.map((ring) => (
        <polygon key={ring} points={AXIS_ORDER.map((_, i) => point(i, ring).join(",")).join(" ")} fill="none" stroke="var(--sage-100)" strokeLinejoin="round" />
      ))}
      {AXIS_ORDER.map((ax, i) => {
        const [x2, y2] = point(i, 100);
        const [lx, ly] = point(i, 104);
        const cos = Math.cos(angle(i));
        const sin = Math.sin(angle(i));
        return (
          <g key={ax}>
            <line x1={c} y1={c} x2={x2} y2={y2} stroke="var(--border-default)" strokeLinecap="round" />
            <text
              x={lx}
              y={ly}
              fontSize={10}
              fontWeight={500}
              textAnchor={cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle"}
              dominantBaseline={sin < -0.3 ? "auto" : sin > 0.3 ? "hanging" : "middle"}
              fill="var(--text-secondary)"
            >
              {drag === ax ? `${ax} ${axes[ax]}` : ax}
              <title>{`${AXIS_INFO[ax].label} ${axes[ax]}`}</title>
            </text>
          </g>
        );
      })}
      {compare && <polygon data-testid="radar-compare" points={poly(compare)} fill="none" stroke="var(--text-secondary)" strokeWidth={1.5} strokeDasharray="5 4" />}
      <polygon points={poly(axes)} fill="var(--sage-300)" fillOpacity={0.28} stroke="var(--sage-300)" strokeWidth={2} strokeLinejoin="round" />
      {AXIS_ORDER.map((ax, i) => {
        const [x, y] = point(i, axes[ax]);
        return (
          <g key={ax}>
            <circle cx={x} cy={y} r={drag === ax ? 5 : 3.5} fill="var(--sage-300)" />
            {onChange && (
              <circle
                cx={x}
                cy={y}
                r={12}
                fill="transparent"
                className="cursor-grab"
                aria-label={`${AXIS_INFO[ax].label} ${axes[ax]}`}
                onPointerDown={(e) => {
                  (e.target as Element).setPointerCapture?.(e.pointerId);
                  setDrag(ax);
                }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
