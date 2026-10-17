// Public shell. The landing (/) draws its own floating Top Bar; /guideline adds the GNB in guideline/layout.tsx.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[var(--app-vh)] flex-col">
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
