import type { ButtonHTMLAttributes } from "react";

// Shared button, Lab style (user review): h 44, radius sm, 15 medium, 1px home-line border. Was the Figma pill: Figma Design System "C / Web" → Web/Button (916:549…559) at ×2:
// px 20 · py 12, radius full, Label 16 medium. Primary = bg/inverse, Secondary (default) = surface + border/default · text/link,
// Danger = surface + border · text/error, Disabled = bg/disabled. Matches ModalButton / lab-home pills.
const VARIANTS = {
  default: "border border-[var(--home-line)] bg-[var(--neutral-0)] text-[var(--home-ink)] hover:border-[var(--home-ink-3)]",
  primary: "border border-transparent bg-[var(--home-ink)] text-[var(--neutral-0)] hover:bg-[var(--neutral-800)]",
  danger: "border border-[var(--home-line)] bg-[var(--neutral-0)] text-[var(--text-error)] hover:bg-[var(--bg-error-subtle)]",
  ghost: "border border-transparent text-[var(--home-ink-2)] hover:bg-[var(--home-canvas)]",
};

export function Button({ variant = "default", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS }) {
  return (
    <button
      {...props}
      className={`inline-flex shrink-0 items-center justify-center h-[44px] gap-[var(--space-8)] whitespace-nowrap rounded-[var(--radius-sm)] px-[var(--space-20)] text-[15px] font-medium disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[var(--home-canvas)] disabled:text-[var(--home-ink-3)] ${VARIANTS[variant]} ${className}`}
    />
  );
}
