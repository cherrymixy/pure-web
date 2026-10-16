import type { ButtonHTMLAttributes } from "react";

// Shared pill button. Figma Design System "C / Web" → Web/Button (916:549…559) at ×2:
// px 20 · py 12, radius full, Label 16 medium. Primary = bg/inverse, Secondary (default) = surface + border/default · text/link,
// Danger = surface + border · text/error, Disabled = bg/disabled. Matches ModalButton / lab-home pills.
const VARIANTS = {
  default: "border-2 border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-link)] hover:bg-[var(--bg-canvas)]",
  primary: "border-2 border-transparent bg-[var(--bg-inverse)] text-[var(--text-on-inverse)] hover:bg-[var(--neutral-800)]",
  danger: "border-2 border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-error)] hover:bg-[var(--bg-error-subtle)]",
  ghost: "border-2 border-transparent text-[var(--text-link)] hover:bg-[var(--bg-canvas)]",
};

export function Button({ variant = "default", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS }) {
  return (
    <button
      {...props}
      className={`inline-flex shrink-0 items-center justify-center gap-[var(--space-12)] whitespace-nowrap rounded-[var(--radius-full)] px-[var(--space-20)] py-[var(--space-12)] text-[16px] font-medium leading-[20px] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-[var(--bg-disabled)] disabled:text-[var(--text-on-inverse)] ${VARIANTS[variant]} ${className}`}
    />
  );
}
