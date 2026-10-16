"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DemoToggle({ initial }: { initial: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);

  async function toggle() {
    const next = !on;
    setOn(next);
    const res = await fetch("/api/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ demoMode: next }) });
    if (!res.ok) setOn(!next);
    router.refresh();
  }

  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input type="checkbox" checked={on} onChange={toggle} className="h-4 w-4" />
      <span>Demo mode {on ? "ON — LLM calls use demo fallback" : "OFF — LLM calls go to Ollama"}</span>
    </label>
  );
}
