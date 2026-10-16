"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** STEP 12: settings.directClip (env FLAG_DIRECT_CLIP=1 forces it on). */
export function FlagToggle({ initial, forced }: { initial: boolean; forced: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);

  async function toggle() {
    const next = !on;
    setOn(next);
    const res = await fetch("/api/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ directClip: next }) });
    if (!res.ok) setOn(!next);
    router.refresh();
  }

  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input type="checkbox" checked={on || forced} disabled={forced} onChange={toggle} className="h-4 w-4" />
      <span>
        directClip {on || forced ? "ON — image/video references try Tier 2 keyframes; Match timing uses flow" : "OFF — recipe only (v0.1-logic)"}
        {forced && <span className="text-neutral-500"> · forced by FLAG_DIRECT_CLIP=1</span>}
      </span>
    </label>
  );
}
