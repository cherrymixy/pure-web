"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { STRINGS } from "@/data/strings";

// WC modals: base dialog, confirm (WC-5), text prompt with unsaved-changes guard.
// Visuals: Figma W02F "Modal" (901:12956 …) at ×2 — 600 wide, radius xl, padding 32/36/20, section gap 40,
// Title 24 semibold · Body 16 secondary, pill actions, PURE/Shadow/Modal, Dim = bg/overlay.

const BUTTON = {
  secondary: "border-2 border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-link)] hover:bg-[var(--bg-canvas)]",
  primary: "bg-[var(--bg-inverse)] text-[var(--text-on-inverse)] hover:bg-[var(--neutral-800)]",
  danger: "bg-[var(--status-error)] text-[var(--text-on-inverse)] hover:opacity-90",
};

/** Figma modal pill button (Cancel / Connect …): Label 16 medium, px 20 · py 12, radius full. */
export function ModalButton({ variant = "secondary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BUTTON }) {
  return (
    <button
      type="button"
      {...props}
      className={`shrink-0 whitespace-nowrap rounded-[var(--radius-full)] px-[var(--space-20)] py-[var(--space-12)] text-[16px] font-medium leading-[20px] disabled:cursor-not-allowed disabled:opacity-40 ${BUTTON[variant]} ${className}`}
    />
  );
}

/** Right-aligned action row (gap 12). */
export function ModalActions({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex w-full items-start justify-end gap-[var(--space-12)] ${className}`}>{children}</div>;
}

/** The white modal surface without backdrop — also used for the non-blocking "Playing on …" card. */
export function ModalCard({ title, description, children, className = "", ...rest }: { title: string; description?: string; children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={`flex flex-col gap-[var(--space-40)] rounded-[var(--radius-xl)] bg-[var(--bg-surface)] px-[var(--space-36)] pb-[var(--space-20)] pt-[var(--space-32)] text-[var(--text-primary)] shadow-[var(--pure-shadow-modal)] ${className}`}
    >
      <div className="flex flex-col gap-[var(--space-20)]">
        <h2 className="text-[24px] font-semibold leading-[30px] text-[var(--text-primary)]">{title}</h2>
        {description && <p className="text-[16px] leading-[20px] text-[var(--text-secondary)]">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function Modal({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--bg-overlay)]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <ModalCard role="dialog" aria-modal="true" aria-label={title} title={title} description={description} className="max-h-[calc(var(--app-vh)-48px)] w-[600px] overflow-y-auto">
        {children}
      </ModalCard>
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
    <Modal open={open} onClose={onCancel} title={title} description={body}>
      <ModalActions>
        <ModalButton onClick={onCancel}>{STRINGS.common.cancel}</ModalButton>
        <ModalButton variant={danger ? "danger" : "primary"} onClick={onConfirm} autoFocus>{confirmLabel}</ModalButton>
      </ModalActions>
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
          className="flex flex-col gap-[var(--space-40)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (trimmed) onSubmit(trimmed);
          }}
        >
          <label className="flex flex-col gap-[var(--space-16)]">
            <span className="text-[16px] font-medium leading-[20px] text-[var(--text-link)]">{label}</span>
            <input
              ref={input}
              value={value}
              maxLength={maxLength}
              onChange={(e) => setValue(e.target.value)}
              className="rounded-[var(--radius-md)] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-20)] py-[var(--space-16)] text-[16px] leading-[20px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)]"
            />
          </label>
          <ModalActions>
            <ModalButton onClick={cancel}>{STRINGS.common.cancel}</ModalButton>
            <ModalButton type="submit" variant="primary" disabled={!trimmed || trimmed === initial}>{submitLabel}</ModalButton>
          </ModalActions>
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
