"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STRINGS } from "@/data/strings";
import { Menu } from "@/components/ui/menu";
import { ConfirmModal } from "@/components/ui/modal";

// Sidebar user card (Figma 1095:6630: initial avatar, plan pill, name) → Library / Profile & team / Log out (confirm → Lab home).
/** compact: avatar only (collapsed sidebar). */
export function UserMenu({ name, email, compact = false }: { name: string; email: string; compact?: boolean }) {
  const router = useRouter();
  const [logOut, setLogOut] = useState(false);

  return (
    <>
      <Menu
        label={STRINGS.common.userMenu}
        align="left"
        up
        triggerClassName={`flex w-full items-center gap-[var(--space-12)] overflow-clip rounded-[14px] bg-[var(--neutral-0)] text-left hover:bg-[var(--home-nav-on)] ${compact ? "justify-center p-[2px]" : "p-[var(--space-12)]"}`}
        trigger={
          <>
            <span aria-hidden className="flex size-[40px] shrink-0 items-center justify-center rounded-[20px] bg-[var(--home-ink)] text-[16.667px] font-semibold text-[var(--neutral-0)]">
              {name.charAt(0)}
            </span>
            {!compact && <span className="flex min-w-0 flex-col items-start gap-[2.644px]">
              <span className="flex h-[20.267px] w-[37.891px] items-center justify-center rounded-[35.248px] border-[0.881px] border-[var(--home-plan-line)] bg-[var(--home-plan-bg)] text-[11.455px] text-[var(--home-ink-2)]">
                {STRINGS.sidebar.plan}
              </span>
              <span className="truncate text-[14.099px] font-medium text-[var(--home-ink)]" title={email}>
                {name}
              </span>
            </span>}
          </>
        }
        items={[
          { label: STRINGS.sidebar.library, onSelect: () => router.push("/lab/community") },
          { label: STRINGS.sidebar.profile, onSelect: () => router.push("/lab/profile") },
          { label: STRINGS.sidebar.logOut, onSelect: () => setLogOut(true) },
        ]}
      />
      <ConfirmModal
        open={logOut}
        title={STRINGS.profile.logOutConfirm.title}
        body={STRINGS.profile.logOutConfirm.body}
        confirmLabel={STRINGS.sidebar.logOut}
        onConfirm={() => router.push("/lab")}
        onCancel={() => setLogOut(false)}
      />
    </>
  );
}
