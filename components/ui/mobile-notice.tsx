"use client";

import { useEffect, useState } from "react";
import { STRINGS } from "@/data/strings";
import { Icon } from "@/components/ui/icons/icon";

// WC mobile notice: under 768px the app shows a desktop-only message.
export function MobileNotice() {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (!narrow) return null;
  // Figma Design System "Empty State" (454:4267) values as-is on bg/canvas: 56 feature icon, Title/S 18, Body/M 15.
  return (
    <div data-testid="mobile-notice" className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[var(--bg-canvas)] px-[var(--space-24)] text-center">
      <div className="flex w-[354px] max-w-full flex-col items-center gap-[var(--space-12)]">
        <span className="text-[14px] font-semibold leading-[20px] text-[var(--sage-800)]">{STRINGS.brand.product}</span>
        <span className="flex size-[56px] items-center justify-center rounded-[var(--radius-xl)] bg-[var(--bg-surface)] text-[var(--icon-primary)]">
          <Icon name="info" size={24} />
        </span>
        <h2 className="text-[18px] font-medium leading-[24px] text-[var(--text-primary)]">{STRINGS.common.mobileTitle}</h2>
        <p className="text-[15px] leading-[22px] text-[var(--text-secondary)]">{STRINGS.common.mobile}</p>
      </div>
    </div>
  );
}
