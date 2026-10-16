"use client";

import { useEffect, useRef, useState } from "react";

// Dropdown menu (card ⋮, user menu). Closes on outside click / Escape.
export type MenuItem = { label: string; onSelect: () => void; danger?: boolean };

export function Menu({
  trigger,
  label,
  items,
  align = "right",
  triggerClassName = "rounded px-2 py-1 text-sm hover:bg-neutral-100",
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
        <div role="menu" className={`absolute z-30 mt-1 flex min-w-44 flex-col rounded border border-neutral-200 bg-white py-1 shadow ${align === "right" ? "right-0" : "left-0"}`}>
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
              className={`px-3 py-1.5 text-left text-sm hover:bg-neutral-100 ${item.danger ? "text-red-600" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
