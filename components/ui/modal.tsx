"use client";

import { useEffect, useRef, useState } from "react";
import { STRINGS } from "@/data/strings";
import { Button } from "./button";

// WC modals: base dialog, confirm (WC-5), text prompt with unsaved-changes guard.

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="flex w-[420px] flex-col gap-4 rounded bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = STRINGS.common.confirm,
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-neutral-600">{body}</p>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel}>{STRINGS.common.cancel}</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} autoFocus>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

/** Single text field. Cancelling with edits asks before discarding (WC unsaved changes). */
export function PromptModal({
  open,
  title,
  label,
  initial,
  maxLength,
  submitLabel = STRINGS.common.save,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  title: string;
  label: string;
  initial: string;
  maxLength: number;
  submitLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setValue(initial);
    setTimeout(() => input.current?.select(), 0);
  }, [open, initial]);

  const trimmed = value.trim();
  const dirty = value !== initial;
  const cancel = () => (dirty ? setConfirmDiscard(true) : onCancel());

  return (
    <>
      <Modal open={open && !confirmDiscard} onClose={cancel} title={title}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (trimmed) onSubmit(trimmed);
          }}
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-neutral-500">{label}</span>
            <input ref={input} value={value} maxLength={maxLength} onChange={(e) => setValue(e.target.value)} className="rounded border border-neutral-300 px-2 py-1.5" />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={cancel}>{STRINGS.common.cancel}</Button>
            <Button type="submit" variant="primary" disabled={!trimmed || trimmed === initial}>{submitLabel}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmModal
        open={open && confirmDiscard}
        title={STRINGS.common.unsaved.title}
        body={STRINGS.common.unsaved.body}
        confirmLabel={STRINGS.common.confirm}
        danger
        onConfirm={() => {
          setConfirmDiscard(false);
          onCancel();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}
