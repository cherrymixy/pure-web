"use client";

import { STRINGS } from "@/data/strings";
import { pureTokensJson } from "@/lib/ui/guideline-tokens";
import { downloadText } from "@/lib/ui/download";
import { Button } from "../button";
import { Icon } from "../icons/icon";

export function DownloadTokens() {
  return (
    <Button onClick={() => downloadText("pure-tokens.json", JSON.stringify(pureTokensJson(), null, 2))}>
      <Icon name="download-minimalistic" size={20} />
      {STRINGS.guideline.download}
    </Button>
  );
}
