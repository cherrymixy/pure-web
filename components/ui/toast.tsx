"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

// WC toast: bottom-center stack, auto-dismiss, optional action (e.g. "Continue").
type Toast = { id: number; text: string; action?: { label: string; onClick: () => void } };
type ShowToast = (text: string, action?: Toast["action"]) => void;

const ToastContext = createContext<ShowToast>(() => {});
const DURATION = 3500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);

  const show = useCallback<ShowToast>((text, action) => {
    const id = next.current++;
    setToasts((list) => [...list, { id, text, action }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), DURATION);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} data-testid="toast" className="pointer-events-auto flex items-center gap-4 rounded bg-neutral-900 px-4 py-2 text-sm text-white shadow">
            <span>{t.text}</span>
            {t.action && (
              <button className="font-semibold underline" onClick={t.action.onClick}>{t.action.label}</button>
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
