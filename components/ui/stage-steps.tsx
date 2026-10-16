import { STRINGS } from "@/data/strings";

// Bottom stage indicator for the setup flow: Structure → Signature → Editor.
export function StageSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <footer className="flex justify-center gap-6 border-t border-neutral-200 py-4 text-sm">
      {STRINGS.structure.stages.map((s, i) => (
        <span key={s} className={i === current ? "font-semibold" : i < current ? "text-neutral-600" : "text-neutral-400"}>
          {i < current ? "✓ " : `${i + 1}. `}{s}
        </span>
      ))}
    </footer>
  );
}
