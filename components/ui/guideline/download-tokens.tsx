"use client";

/* eslint-disable @next/next/no-img-element */
import { STRINGS } from "@/data/strings";
import { pureTokensJson } from "@/lib/ui/guideline-tokens";
import { downloadText } from "@/lib/ui/download";
import { Button } from "../button";
import { Icon } from "../icons/icon";

export const saveTokens = () => downloadText("pure-tokens.json", JSON.stringify(pureTokensJson(), null, 2));

/** lab: Lab-home toolbar style (glass, 44 tall, radius 12, 15 medium — same as Import). */
export function DownloadTokens({ lab = false }: { lab?: boolean }) {
  if (lab)
    return (
      <button
        onClick={saveTokens}
        className="flex h-[44px] shrink-0 items-center gap-[var(--space-8)] rounded-[var(--radius-sm)] bg-[var(--home-glass)] px-[var(--space-20)] text-[15px] font-medium text-[var(--home-ink)] hover:bg-[var(--neutral-0)]"
      >
        <img src="/figma/lab/home/import.svg" alt="" aria-hidden width={20} height={20} />
        {STRINGS.guideline.download}
      </button>
    );
  return (
    <Button onClick={saveTokens}>
      <Icon name="download-minimalistic" size={20} />
      {STRINGS.guideline.download}
    </Button>
  );
}
