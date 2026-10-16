import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { Icon } from "@/components/ui/icons/icon";

// Figma Design System "Chip" (459:4433 · component 452:4215), values as-is (1× DS):
// M h43 px16 · S h32 px12, radius full, Label/S 13 medium. Default = bg/surface · text/primary,
// Selected = bg/inverse · text/on-inverse, Dimmed = Default at 40% opacity.
const SIZE = {
  M: "h-[43px] px-[var(--space-16)]",
  S: "h-[32px] px-[var(--space-12)]",
};

export function chipClass({ size = "M", selected = false, dimmed = false }: { size?: keyof typeof SIZE; selected?: boolean; dimmed?: boolean } = {}) {
  return `inline-flex shrink-0 items-center justify-center gap-[var(--space-8)] whitespace-nowrap rounded-[var(--radius-full)] text-[13px] font-medium leading-[18px] ${SIZE[size]} ${
    selected ? "bg-[var(--bg-inverse)] text-[var(--text-on-inverse)]" : "bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--neutral-100)]"
  } ${dimmed ? "opacity-40" : ""}`;
}

export function Chip({ size = "M", selected = false, dimmed = false, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { size?: keyof typeof SIZE; selected?: boolean; dimmed?: boolean }) {
  return <button type="button" aria-pressed={selected} {...props} className={`${chipClass({ size, selected, dimmed })} ${className}`} />;
}

// Figma Design System "Text Field" (459:4544 · component 452:8937), values as-is (1× DS):
// label Body/S 13 secondary, gap 6; field h56 px20 radius md, bg/surface, Body/L 16 text/primary;
// FIELD_BOX carries no fill: add bg/surface (on canvas) or bg/canvas (on a surface).
// Focused 1.5px border/strong · Error 1.5px border/error · Disabled bg/disabled + text/disabled.
export const FIELD_LABEL = "text-[13px] leading-[18px] text-[var(--text-secondary)]";
export const FIELD_BOX =
  "flex min-h-[56px] items-center gap-[var(--space-8)] rounded-[var(--radius-md)] border-[1.5px] border-transparent px-[var(--space-20)] text-[16px] leading-[22px] text-[var(--text-primary)] focus-within:border-[var(--border-strong)] has-[[aria-invalid=true]]:border-[var(--border-error)]";
export const FIELD_INPUT = "min-w-0 flex-1 bg-transparent text-[16px] leading-[22px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] disabled:text-[var(--text-disabled)]";
export const FIELD_HELPER = "text-[13px] leading-[18px] text-[var(--text-secondary)]";

/** Bare DS text field input (single line) inside the field box. `tone` = surface on canvas, canvas on surface (modals / cards). */
export function TextInput({ tone = "surface", className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { tone?: "surface" | "canvas" }) {
  return (
    <span className={`${FIELD_BOX} ${props.disabled ? "bg-[var(--bg-disabled)]" : tone === "canvas" ? "bg-[var(--bg-canvas)]" : "bg-[var(--bg-surface)]"} ${className}`}>
      <input {...props} className={FIELD_INPUT} />
    </span>
  );
}

/** Native select dressed as a DS chip (Default, size S/M) with a chevron. */
export function ChipSelect({ chipSize = "S", className = "", children, ...props }: Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & { chipSize?: keyof typeof SIZE }) {
  return (
    <span className={`relative inline-flex ${className}`}>
      <select
        {...props}
        className={`${chipClass({ size: chipSize })} cursor-pointer appearance-none border border-[var(--border-default)] pr-[36px] outline-none focus-visible:border-[var(--border-strong)]`}
      >
        {children}
      </select>
      <Icon name="chevron-down" size={16} className="pointer-events-none absolute right-[var(--space-12)] top-1/2 -translate-y-1/2 text-[var(--icon-secondary)]" />
    </span>
  );
}
