"use client";

import { useEffect, useRef, useState } from "react";

// Dropdown menu (card ⋮, user menu). Closes on outside click / Escape.
// Rows = Figma Design System "Menu Item" (457:4268): p 12, gap 12, radius 14, Body/L 16 regular; hover = Selected (bg/surface-muted).
// Panel: bg/surface, radius md, p 8, PURE/Shadow/Float.
export type MenuItem = { label: string; onSelect: () => void; danger?: boolean };

export function Menu({
  trigger,
  label,
  items,
  align = "right",
  triggerClassName = "rounded-[var(--radius-xs)] px-[var(--space-8)] py-[var(--space-4)] text-[16px] leading-[20px] text-[var(--text-link)] hover:bg-[var(--bg-canvas)]",
}: {
  trigger: React.ReactNode;
  label: string;
  items: MenuItem[];
  align?: "left" | "right";
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div role="menu" className={`absolute z-30 mt-[var(--space-8)] flex min-w-[240px] flex-col rounded-[var(--radius-md)] bg-[var(--bg-surface)] p-[var(--space-8)] shadow-[var(--pure-shadow-float)] ${align === "right" ? "right-0" : "left-0"}`}>
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                item.onSelect();
              }}
              className={`whitespace-nowrap rounded-[14px] p-[var(--space-12)] text-left text-[16px] leading-[22px] hover:bg-[var(--bg-surface-muted)] focus-visible:bg-[var(--bg-surface-muted)] focus-visible:outline-none ${item.danger ? "text-[var(--text-error)]" : "text-[var(--text-primary)]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
