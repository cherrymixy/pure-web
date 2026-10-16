import type { ButtonHTMLAttributes } from "react";

// Gray-box button. Visuals come from Figma tokens in STEP 22.
const VARIANTS = {
  default: "border border-neutral-300 bg-white hover:bg-neutral-100",
  primary: "border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-700",
  danger: "border border-red-600 bg-red-600 text-white hover:bg-red-500",
  ghost: "hover:bg-neutral-100",
};

export function Button({ variant = "default", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS }) {
  return <button {...props} className={`rounded px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`} />;
}
