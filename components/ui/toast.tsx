"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

// WC toast: bottom-center stack, auto-dismiss, optional action (e.g. "Continue").
type Toast = { id: number; text: string; action?: { label: string; onClick: () => void } };
type ShowToast = (text: string, action?: Toast["action"]) => void;

const ToastContext = createContext<ShowToast>(() => {});
const DURATION = 4000;
const DURATION_ACTION = 6000; // time to reach the action button

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);

  const show = useCallback<ShowToast>((text, action) => {
    const id = next.current++;
    setToasts((list) => [...list, { id, text, action }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), action ? DURATION_ACTION : DURATION);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* Figma C / Web "Web/Toast" (916:635) ×2: bg/inverse, radius md, px 24 · py 16, gap 16, 16px on-inverse;
          shadow from DS Toast (454:4257) PURE/Shadow/Float. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[var(--space-40)] z-50 flex flex-col items-center gap-[var(--space-12)]" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            data-testid="toast"
            className="anim-rise-in pointer-events-auto flex max-w-[720px] items-center gap-[var(--space-16)] rounded-[var(--radius-md)] bg-[var(--bg-inverse)] px-[var(--space-24)] py-[var(--space-16)] text-[16px] leading-[20px] text-[var(--text-on-inverse)] shadow-[var(--pure-shadow-float)]"
          >
            <span>{t.text}</span>
            {t.action && (
              <button className="shrink-0 font-medium text-[var(--text-on-inverse)] hover:underline" onClick={t.action.onClick}>{t.action.label}</button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  return useContext(ToastContext);
}
