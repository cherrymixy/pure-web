"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { STRINGS } from "@/data/strings";
import { startTour } from "@/components/ui/tour";

// Figma "pure" welcome popup (1066:545): 573 wide, radius 28, header gradient 230 tall + fade, content inset 28.
// "다시 보지 않음" checked → localStorage (never again). Unchecked → shown on every new visit (per browser tab session).
const HIDE_KEY = "pure.welcome.hidden";
const SEEN_KEY = "pure.welcome.seen";

function read(storage: () => Storage, key: string) {
  try {
    return storage().getItem(key) === "1";
  } catch {
    return false;
  }
}
function write(storage: () => Storage, key: string) {
  try {
    storage().setItem(key, "1");
  } catch {}
}

/** Click to Start counts as a new visit: the popup shows again unless "다시 보지 않음" was checked. */
export function allowWelcomeAgain() {
  try {
    sessionStorage.removeItem(SEEN_KEY);
  } catch {}
}

export function WelcomePopup() {
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const pathname = usePathname();

  // Only inside the simulation (/lab…): the landing page comes first, the popup greets after Click to Start.
  useEffect(() => {
    if (pathname.startsWith("/lab") && !read(() => localStorage, HIDE_KEY) && !read(() => sessionStorage, SEEN_KEY)) setOpen(true);
  }, [pathname]);

  const close = () => {
    write(() => sessionStorage, SEEN_KEY);
    if (dontShow) write(() => localStorage, HIDE_KEY);
    setOpen(false);
  };

  const guided = () => {
    close();
    startTour();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" && e.key !== "Enter") return;
      e.preventDefault();
      if (e.key === "Enter") guided();
      else close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!open) return null;
  const t = STRINGS.welcome;

  return (
    <div className="anim-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        className="anim-pop-in relative flex max-h-[calc(var(--app-vh)-48px)] w-[573px] flex-col overflow-y-auto overflow-x-clip rounded-[var(--radius-xl)] bg-[var(--welcome-bg)] shadow-[var(--pure-shadow-modal)]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[230px]"
          style={{
            backgroundImage:
              "linear-gradient(180deg, var(--welcome-fade) 0%, var(--welcome-fade-15) 35%, var(--welcome-bg) 85%, var(--welcome-bg) 100%), linear-gradient(90deg, var(--sage-600) 0%, var(--sage-400) 30%, var(--sage-200) 58%, var(--welcome-gradient-mid) 80%, var(--sage-200) 100%)",
          }}
        />
        <div className="relative flex flex-col px-[28px] pt-[218px]">
          <img src="/figma/brand/logo-welcome.svg" alt="PURE" width={46} height={46} className="block size-[46px]" />
          <div className="mt-[32px] flex flex-col gap-[13px]">
            <h2 className="text-[20px] font-semibold leading-[28px] tracking-[-0.1px] text-[var(--welcome-title)]">{t.title}</h2>
            <div className="flex flex-col gap-[13px] text-[16px] leading-[25px] text-[var(--welcome-body)]">
              {t.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="relative mt-[51px] flex items-center justify-between gap-[10px] px-[28px] pb-[20px]">
          <label className="flex cursor-pointer select-none items-center gap-[8px] text-[15px] leading-[20px] text-[var(--welcome-key-text)]">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="size-[16px] cursor-pointer accent-[var(--sage-500)]"
            />
            {t.dontShow}
          </label>
          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              onClick={close}
              className="flex items-center gap-[10px] rounded-[var(--radius-xs)] border border-[var(--welcome-btn-border)] bg-white py-[10px] pl-[14px] pr-[10px] shadow-[var(--welcome-btn-shadow)] hover:bg-[var(--welcome-bg)]"
            >
              <span className="font-mono text-[15px] font-medium leading-[20px] text-[var(--welcome-title)]">{t.explore}</span>
              <kbd className="rounded-[var(--radius-2xs)] bg-[var(--welcome-key-bg)] px-[6px] py-[2px] font-sans text-[11px] font-semibold text-[var(--welcome-key-text)]">ESC</kbd>
            </button>
            <button
              type="button"
              onClick={guided}
              autoFocus
              className="flex items-center gap-[10px] rounded-[var(--radius-xs)] bg-[var(--sage-500)] py-[10px] pl-[14px] pr-[12px] hover:bg-[var(--sage-600)]"
            >
              <span className="font-mono text-[15px] font-medium leading-[20px] text-white">{t.guided}</span>
              <kbd className="rounded-[var(--radius-2xs)] border-[1.2px] border-[var(--welcome-key-border)] px-[6px] py-[2px] font-sans text-[14px] font-semibold text-white">↵</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
