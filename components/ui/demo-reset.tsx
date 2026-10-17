"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { STRINGS } from "@/data/strings";
import { ConfirmModal } from "./modal";
import { useToast } from "./toast";

/** STEP 25: Reset demo data from anywhere — ⌘/Ctrl + Shift + Option/Alt + R, then confirm. Same as /dev → Reset. */
export function DemoReset() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const R = STRINGS.common.resetDemo;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.altKey && e.code === "KeyR") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function reset() {
    setOpen(false);
    await fetch("/api/dev/reset", { method: "POST" });
    toast(R.done);
    router.push("/");
    router.refresh();
  }

  return <ConfirmModal open={open} title={R.title} body={R.body} confirmLabel={R.confirm} danger onConfirm={() => void reset()} onCancel={() => setOpen(false)} />;
}
