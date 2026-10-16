"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STRINGS } from "@/data/strings";
import { Menu } from "@/components/ui/menu";
import { ConfirmModal } from "@/components/ui/modal";

// Sidebar user block → Library / Profile & team / Log out (confirm → landing).
export function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [logOut, setLogOut] = useState(false);

  return (
    <>
      <Menu
        label={STRINGS.common.userMenu}
        align="left"
        trigger={
          <span className="flex flex-col text-left">
            <span className="font-semibold">{name}</span>
            <span className="text-neutral-500">{email}</span>
          </span>
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
