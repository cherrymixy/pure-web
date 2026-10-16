"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DemoToggle({ cookieName, initial }: { cookieName: string; initial: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);

  function toggle() {
    const next = !on;
    document.cookie = `${cookieName}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
    setOn(next);
    router.refresh();
  }

  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input type="checkbox" checked={on} onChange={toggle} className="h-4 w-4" />
      <span>Demo mode {on ? "ON — LLM calls use demo fallback" : "OFF — LLM calls go to Ollama"}</span>
    </label>
  );
}
