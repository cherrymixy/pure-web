"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STRINGS } from "@/data/strings";
import { Menu } from "@/components/ui/menu";
import { ConfirmModal } from "@/components/ui/modal";

// Sidebar user block (avatar mark + name, Figma 901:8325/8332) → Library / Profile & team / Log out (confirm → landing).
export function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [logOut, setLogOut] = useState(false);

  return (
    <>
      <Menu
        label={STRINGS.common.userMenu}
        align="left"
        triggerClassName="flex w-full items-center gap-[11px] rounded-[var(--radius-xs)] text-left hover:bg-[var(--neutral-50)]"
        trigger={
          <>
            <span aria-hidden className="relative size-[36px] shrink-0 rounded-[var(--radius-full)] bg-[var(--neutral-800)]">
              <span className="absolute left-[8px] top-[8px] size-[8.4px] rounded-[var(--radius-2xs)] bg-[var(--bg-canvas)]" />
              <span className="absolute left-[16.4px] top-[16.4px] size-[11.6px] rounded-[var(--radius-2xs)] bg-[var(--bg-canvas)]" />
            </span>
            <span className="truncate text-[20px] font-medium leading-[26px] text-[var(--text-primary)]" title={email}>
              {name}
            </span>
          </>
        }
        items={[
          { label: STRINGS.sidebar.library, onSelect: () => router.push("/lab/user-data") },
          { label: STRINGS.sidebar.profile, onSelect: () => router.push("/lab/profile") },
          { label: STRINGS.sidebar.logOut, onSelect: () => setLogOut(true) },
        ]}
      />
      <ConfirmModal
        open={logOut}
        title={STRINGS.profile.logOutConfirm.title}
        body={STRINGS.profile.logOutConfirm.body}
        confirmLabel={STRINGS.sidebar.logOut}
        onConfirm={() => router.push("/")}
        onCancel={() => setLogOut(false)}
      />
    </>
  );
}
