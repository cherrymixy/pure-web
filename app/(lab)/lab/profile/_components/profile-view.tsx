"use client";

import { STRINGS, fmt } from "@/data/strings";
import { TEAM_ROLES, type Profile } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { ChipSelect, chipClass } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icons/icon";
import { NoticeModal } from "@/components/ui/modal";
import { useState } from "react";

const P = STRINGS.profile;

// W05: profile, team, account. Simulation site: every change shows the "can't change" notice instead.
export function ProfileView({ initial: profile }: { initial: Profile }) {
  const [locked, setLocked] = useState(false);
  const lock = () => setLocked(true);

  const me = profile.team.find((m) => m.email === profile.email);
  const isOwner = me?.role === "Owner";

  // No Figma frame: lab paddings; sections are white radius-xl cards on the shell background (sidebar panel),
  // DS Text Field / Chip for inputs, shared pill Buttons.
  const card = "flex flex-col gap-[var(--space-16)] rounded-[var(--radius-xl)] bg-[var(--neutral-0)] p-[var(--space-24)]";
  const h2 = "text-[22px] font-medium leading-[29px] text-[var(--home-ink)]";
  return (
    <div className="flex flex-col gap-[var(--space-16)] pb-[var(--space-32)] pl-[33px] pr-[var(--space-32)] pt-[49px]">
      <h1 className="flex h-[56px] items-center text-[32px] font-semibold leading-[40px] text-[var(--home-ink)]">{P.title}</h1>

      <section className={`${card} !flex-row items-start justify-between`}>
        <div className="flex items-center gap-[var(--space-24)]">
          <span aria-hidden className="flex size-[72px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--home-canvas)] text-[32px] font-semibold leading-[40px] text-[var(--home-ink-2)]">
            {profile.name.slice(0, 1).toUpperCase()}
          </span>
          <dl className="grid grid-cols-[120px_1fr] items-baseline gap-x-[var(--space-16)] gap-y-[var(--space-8)]">
            <dt className="text-[13px] leading-[18px] text-[var(--home-ink-3)]">{P.name}</dt>
            <dd className="text-[20px] font-semibold leading-[26px] text-[var(--home-ink)]" data-testid="profile-name">{profile.name}</dd>
            <dt className="text-[13px] leading-[18px] text-[var(--home-ink-3)]">{P.email}</dt>
            <dd className="text-[16px] leading-[22px] text-[var(--home-ink)]">{profile.email}</dd>
            <dt className="text-[13px] leading-[18px] text-[var(--home-ink-3)]">{P.company}</dt>
            <dd className="text-[16px] leading-[22px] text-[var(--home-ink)]">{profile.company}</dd>
            <dt />
            <dd className="text-[13px] leading-[18px] text-[var(--home-ink-3)]">{fmt(P.signedInWith, { provider: profile.signedInWith })}</dd>
          </dl>
        </div>
        <Button onClick={lock}>{P.edit}</Button>
      </section>

      <section className={card}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-[var(--space-4)]">
            <h2 className={h2}>{P.team}</h2>
            {!isOwner && <p className="text-[13px] leading-[18px] text-[var(--home-ink-3)]">{P.ownerOnly}</p>}
          </div>
          <Button variant="primary" disabled={!isOwner} onClick={lock}>
            <Icon name="add" size={20} />
            {P.invite}
          </Button>
        </div>
        <table className="w-full">
          <thead className="text-left">
            <tr className="text-[13px] leading-[18px] text-[var(--home-ink-3)]">
              <th className="pb-[var(--space-12)] font-normal">{P.member}</th>
              <th className="w-[200px] pb-[var(--space-12)] font-normal">{P.role}</th>
              <th className="pb-[var(--space-12)]" />
            </tr>
          </thead>
          <tbody>
            {profile.team.map((m) => {
              const self = m.email === profile.email;
              const editable = isOwner && !self && m.role !== "Owner";
              return (
                <tr key={m.email} className="border-t border-[var(--home-line)]" data-testid="team-row">
                  <td className="py-[var(--space-12)]">
                    <div className="flex items-center gap-[var(--space-16)]">
                      <span aria-hidden className="flex size-[44px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--home-canvas)] text-[16px] font-medium leading-[22px] text-[var(--home-ink-2)]">
                        {m.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="flex min-w-0 flex-col gap-[2px]">
                        <div className="text-[16px] font-medium leading-[22px] text-[var(--home-ink)]">
                          {m.name}
                          {self ? <span className="font-normal text-[var(--home-ink-3)]">{` (${P.you})`}</span> : ""}
                        </div>
                        <div className="text-[14px] leading-[20px] text-[var(--home-ink-3)]">
                          {m.email}
                          {m.pending && m.expiresAt ? `, ${fmt(P.pendingUntil, { date: new Date(m.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) })}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-[var(--space-12)]">
                    {editable ? (
                      <ChipSelect value={m.role} onChange={lock} aria-label={`${m.name} role`}>
                        {TEAM_ROLES.filter((r) => r !== "Owner").map((r) => <option key={r} value={r}>{r}</option>)}
                      </ChipSelect>
                    ) : (
                      <span className={`${chipClass({ size: "S", selected: m.role === "Owner" })} pointer-events-none`}>{m.role}</span>
                    )}
                  </td>
                  <td className="py-[var(--space-12)] text-right">
                    {editable && (
                      <span className="flex justify-end gap-[var(--space-8)]">
                        {!m.pending && <Button onClick={lock}>{P.transfer}</Button>}
                        <Button variant="ghost" onClick={lock}>{P.remove}</Button>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className={card}>
        <h2 className={h2}>{P.account}</h2>
        <div className="flex gap-[var(--space-12)]">
          <Button onClick={lock}>{STRINGS.sidebar.logOut}</Button>
          <Button variant="danger" onClick={lock}>{P.deleteAccount}</Button>
        </div>
      </section>

      <NoticeModal open={locked} title={P.locked.title} body={P.locked.body} okLabel={P.locked.ok} onClose={() => setLocked(false)} />
    </div>
  );
}
