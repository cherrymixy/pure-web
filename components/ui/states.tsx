import { Icon, type IconName } from "@/components/ui/icons/icon";

// Figma Design System "Empty State" (454:4267): 56 feature icon (24 glyph), Title/S 18 medium,
// Body/M 15 secondary, action row; column gap 12, 354 wide. Values used as-is (1× DS).
export function EmptyState({ title, body, children, icon = "folder_open" }: { title: string; body?: string; children?: React.ReactNode; icon?: IconName }) {
  return (
    <div className="flex flex-col items-center justify-center px-[var(--space-16)] py-[var(--space-48)] text-center">
      <div className="flex w-[354px] max-w-full flex-col items-center gap-[var(--space-12)]">
        <span className="flex size-[56px] items-center justify-center rounded-[var(--radius-xl)] text-[var(--icon-primary)]">
          <Icon name={icon} size={24} />
        </span>
        <h2 className="text-[18px] font-medium leading-[24px] text-[var(--text-primary)]">{title}</h2>
        {body && <p className="text-[15px] leading-[22px] text-[var(--text-secondary)]">{body}</p>}
        {children && <div className="flex gap-[var(--space-12)]">{children}</div>}
      </div>
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-[var(--space-12)] py-[var(--space-48)] text-[15px] leading-[22px] text-[var(--text-secondary)]" role="status">
      <span className="flex animate-spin text-[var(--icon-secondary)]">
        <Icon name="spinner" size={20} />
      </span>
      {label}
    </div>
  );
}
