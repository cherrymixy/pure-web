import Link from "next/link";
import { STRINGS } from "@/data/strings";

// WC 404 — no Figma frame; built from Design System "C / Web" pieces at ×2 on bg/canvas:
// mono eyebrow, Web/Title/L 36 semibold, Body 16 secondary, Secondary pill (same as the type-select back pill).
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-[var(--space-40)] bg-[var(--bg-canvas)] p-[var(--space-48)] text-center">
      <div className="flex flex-col items-center gap-[var(--space-20)]">
        <p className="font-mono text-[14px] leading-[18px] text-[var(--text-tertiary)]">404</p>
        <h1 className="text-[36px] font-semibold leading-[45px] text-[var(--sage-800)]">{STRINGS.common.notFound.title}</h1>
        <p className="text-[16px] leading-[20px] text-[var(--text-secondary)]">{STRINGS.common.notFound.body}</p>
      </div>
      <Link
        href="/lab"
        className="flex h-[48px] w-fit items-center gap-[var(--space-12)] rounded-[var(--radius-full)] border-2 border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-16)] text-[16px] font-medium leading-[20px] text-[var(--text-link)] hover:bg-[var(--neutral-50)]"
      >
        <span aria-hidden>←</span>
        <span>{STRINGS.common.backHome}</span>
      </Link>
    </div>
  );
}
