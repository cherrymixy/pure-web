import Link from "next/link";
import { STRINGS } from "@/data/strings";

// WC 404 — no Figma frame; built from Design System "C / Web" pieces at ×2 on bg/canvas:
// mono eyebrow, Web/Title/L 36 semibold, Body 16 secondary, Secondary pill (same as the type-select back pill).
export default function NotFound() {
  return (
    <div className="flex min-h-[var(--app-vh)] flex-col items-center justify-center gap-[var(--space-40)] bg-[var(--home-canvas)] p-[var(--space-48)] text-center">
      <div className="flex flex-col items-center gap-[var(--space-20)]">
        <p className="font-mono text-[14px] leading-[18px] text-[var(--home-ink-3)]">404</p>
        <h1 className="text-[36px] font-semibold leading-[45px] text-[var(--home-ink)]">{STRINGS.common.notFound.title}</h1>
        <p className="text-[16px] leading-[20px] text-[var(--home-ink-3)]">{STRINGS.common.notFound.body}</p>
      </div>
      <Link
        href="/lab"
        className="flex h-[44px] w-fit items-center gap-[var(--space-8)] rounded-[var(--radius-sm)] border border-[var(--home-line)] bg-[var(--neutral-0)] px-[var(--space-20)] text-[15px] font-medium text-[var(--home-ink)] hover:border-[var(--home-ink-3)]"
      >
        <span aria-hidden>←</span>
        <span>{STRINGS.common.backHome}</span>
      </Link>
    </div>
  );
}
