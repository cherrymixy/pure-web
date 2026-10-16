"use client";

import { STRINGS } from "@/data/strings";
import { pureTokensJson } from "@/lib/ui/guideline-tokens";
import { downloadText } from "@/lib/ui/download";
import { Button } from "../button";

export function DownloadTokens() {
  return <Button onClick={() => downloadText("pure-tokens.json", JSON.stringify(pureTokensJson(), null, 2))}>{STRINGS.guideline.download}</Button>;
}
