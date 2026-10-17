import { PublicGnb } from "../_components/public-gnb";

// Public guideline: landing background (bg/canvas) under the floating Top Bar.
export default function GuidelineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[var(--app-vh)] flex-col bg-[var(--bg-canvas)]">
      <PublicGnb />
      {children}
    </div>
  );
}
