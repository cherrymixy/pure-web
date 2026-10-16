"use client";

import { useEffect, useState } from "react";
import { STRINGS } from "@/data/strings";

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
  return (
    <div data-testid="mobile-notice" className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-white p-8 text-center">
      <div className="font-semibold">{STRINGS.brand.name}</div>
      <h2 className="text-lg font-semibold">{STRINGS.common.mobileTitle}</h2>
      <p className="text-sm text-neutral-500">{STRINGS.common.mobile}</p>
    </div>
  );
}
