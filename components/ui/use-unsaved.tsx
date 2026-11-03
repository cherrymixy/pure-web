"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { STRINGS } from "@/data/strings";
import { ConfirmModal } from "./modal";

/**
 * WC unsaved changes while `dirty`: the browser asks before closing or reloading, and in-app links
 * (Next <Link> never fires beforeunload) ask through the returned modal — render it.
 */
export function useUnsavedChanges(dirty: boolean): ReactNode {
  const router = useRouter();
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    // Capture on document runs before React's root listener, so the Link never navigates.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download") || a.origin !== location.origin) return;
      if (a.pathname === location.pathname && a.search === location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setHref(a.pathname + a.search + a.hash);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
  return (
    <ConfirmModal
      open={href !== null}
      title={STRINGS.common.unsaved.title}
      body={STRINGS.common.unsaved.body}
      danger
      onConfirm={() => {
        setHref(null);
        if (href) router.push(href);
      }}
      onCancel={() => setHref(null)}
    />
  );
}
