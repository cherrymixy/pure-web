"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Two-step confirm inline (no browser dialogs).
export function ResetButton() {
  const router = useRouter();
  const [stage, setStage] = useState<"idle" | "confirm" | "busy" | "done">("idle");

  async function reset() {
    setStage("busy");
    const res = await fetch("/api/dev/reset", { method: "POST" });
    setStage(res.ok ? "done" : "idle");
    router.refresh();
    setTimeout(() => setStage("idle"), 1500);
  }

  const btn = "rounded border px-3 py-1 text-sm";
  if (stage === "confirm") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>Reset DB to seed and delete uploads?</span>
        <button className={`${btn} border-red-600 text-red-600`} onClick={reset}>Confirm reset</button>
        <button className={`${btn} border-neutral-300`} onClick={() => setStage("idle")}>Cancel</button>
      </div>
    );
  }
  return (
    <button className={`${btn} border-neutral-300`} disabled={stage === "busy"} onClick={() => setStage("confirm")}>
      {stage === "busy" ? "Resetting…" : stage === "done" ? "Reset done" : "Reset demo data"}
    </button>
  );
}
