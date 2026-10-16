import { AXIS_INFO, AXIS_ORDER } from "@/data/signature";
import type { Axis } from "@/lib/models";

// Plain SVG radar for the dev bench (the draggable product radar comes in STEP 10).
export function Radar({ axes, compare, size = 260 }: { axes: Record<Axis, number>; compare?: Record<Axis, number>; size?: number }) {
  const c = size / 2;
  const r = c - 36;
  const point = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / AXIS_ORDER.length - Math.PI / 2;
    return [c + Math.cos(a) * r * (v / 100), c + Math.sin(a) * r * (v / 100)];
  };
  const poly = (values: Record<Axis, number>) => AXIS_ORDER.map((ax, i) => point(i, values[ax]).join(",")).join(" ");
  return (
    <svg width={size} height={size} className="text-neutral-400">
      {[25, 50, 75, 100].map((ring) => (
        <polygon key={ring} points={AXIS_ORDER.map((_, i) => point(i, ring).join(",")).join(" ")} fill="none" stroke="currentColor" strokeOpacity={0.3} />
      ))}
      {AXIS_ORDER.map((ax, i) => {
        const [x, y] = point(i, 118);
        return (
          <text key={ax} x={x} y={y} fontSize={10} textAnchor="middle" dominantBaseline="middle" fill="currentColor">
            {AXIS_INFO[ax].label}
          </text>
        );
      })}
      {compare && <polygon points={poly(compare)} fill="none" stroke="currentColor" strokeDasharray="4 3" />}
      <polygon points={poly(axes)} fill="rgb(23 23 23 / 0.15)" stroke="rgb(23 23 23)" strokeWidth={1.5} />
    </svg>
  );
}
