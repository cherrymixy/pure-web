// WC empty / loading states.

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded border border-dashed border-neutral-300 p-16 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      {body && <p className="max-w-md text-sm text-neutral-500">{body}</p>}
      {children && <div className="mt-2 flex gap-2">{children}</div>}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-16 text-sm text-neutral-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
      {label}
    </div>
  );
}
