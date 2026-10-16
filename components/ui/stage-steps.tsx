import { STRINGS } from "@/data/strings";
import { Icon } from "@/components/ui/icons/icon";

const STEP = 166; // Figma 901:8687… dots 83 apart in the 960 frame (×2)

// Bottom stage indicator for the setup flow: Structure → Signature → Editor (Figma 901:8685–8698 ×2).
// Dots on a 2px track; reached steps show the check dot, the track fills up to the next step.
// `className` positions the footer (default: centered row in flow).
export function StageSteps({ current, className }: { current: 0 | 1 | 2; className?: string }) {
  const stages = STRINGS.structure.stages;
  const filled = Math.min(current + 1, stages.length - 1) * STEP;
  return (
    <footer className={className ?? "flex justify-center py-[var(--space-24)]"}>
      <ol className="relative flex" aria-label="Stages">
        <span aria-hidden className="absolute top-[9px] h-[2px] rounded-[var(--radius-full)] bg-[var(--neutral-150)]" style={{ left: STEP / 2, width: (stages.length - 1) * STEP }} />
        <span aria-hidden className="absolute top-[9px] h-[2px] rounded-[var(--radius-full)] bg-[var(--bg-inverse)]" style={{ left: STEP / 2, width: filled }} />
        {stages.map((s, i) => (
          <li
            key={s}
            aria-current={i === current ? "step" : undefined}
            className="relative flex flex-col items-center gap-[11px]"
            style={{ width: STEP }}
          >
            {i <= current ? (
              <Icon name="step-done" size={20} className="text-[var(--bg-inverse)]" />
            ) : (
              <span className="size-[20px] rounded-[var(--radius-full)] border-[3px] border-[var(--border-default)] bg-[var(--bg-canvas)]" />
            )}
            <span className={`whitespace-nowrap text-[12px] leading-[15px] ${i <= current ? "text-[var(--text-primary)]" : "text-[var(--neutral-500)]"}`}>{s}</span>
          </li>
        ))}
      </ol>
    </footer>
  );
}
