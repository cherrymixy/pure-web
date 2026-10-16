"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STRINGS, fmt } from "@/data/strings";
import { TEAM_ROLES, type Profile, type TeamMember } from "@/lib/models";
import { ApiError, api } from "@/lib/ui/api";
import { Button } from "@/components/ui/button";
import { ChipSelect, FIELD_BOX, FIELD_HELPER, FIELD_INPUT, FIELD_LABEL, TextInput, chipClass } from "@/components/ui/chip";
import { Icon } from "@/components/ui/icons/icon";
import { ConfirmModal, Modal, ModalActions, ModalButton } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useUnsavedChanges } from "@/components/ui/use-unsaved";

const P = STRINGS.profile;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Role = TeamMember["role"];

// W05: profile, team (roles, invite, remove, transfer), account, log out.
export function ProfileView({ initial }: { initial: Profile }) {
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: "remove" | "transfer"; member: TeamMember } | null>(null);
  const [deleteAccount, setDeleteAccount] = useState(false);
  const [logOut, setLogOut] = useState(false);

  const me = profile.team.find((m) => m.email === profile.email);
  const isOwner = me?.role === "Owner";
  const fail = (err: unknown) => toast(err instanceof ApiError ? err.message : STRINGS.lab.toast.failed);

  async function setRole(member: TeamMember, role: Role) {
    try {
      setProfile(await api<Profile>(`/api/profile/team/${encodeURIComponent(member.email)}`, { method: "PATCH", body: JSON.stringify({ role }) }));
      toast(fmt(P.roleChanged, { name: member.name, role }));
    } catch (err) {
      fail(err);
    }
  }

  async function confirmAction() {
    if (!confirm) return;
    const { kind, member } = confirm;
    setConfirm(null);
    if (kind === "transfer") return setRole(member, "Owner");
    try {
      setProfile(await api<Profile>(`/api/profile/team/${encodeURIComponent(member.email)}`, { method: "DELETE" }));
      toast(fmt(P.removed, { name: member.name }));
    } catch (err) {
      fail(err);
    }
  }

  // No Figma frame: lab paddings; sections are white radius-xl cards on the shell background (sidebar panel),
  // DS Text Field / Chip for inputs, shared pill Buttons.
  const card = "flex flex-col gap-[var(--space-24)] rounded-[var(--radius-xl)] bg-[var(--bg-surface)] p-[var(--space-32)]";
  const h2 = "text-[22px] font-medium leading-[29px] text-[var(--text-primary)]";
  return (
    <div className="flex max-w-[1200px] flex-col gap-[var(--space-24)] pb-[var(--space-32)] pl-[33px] pr-[var(--space-32)] pt-[49px]">
      <h1 className="flex h-[56px] items-center text-[32px] font-semibold leading-[40px] text-[var(--sage-800)]">{P.title}</h1>

      <section className={`${card} !flex-row items-start justify-between`}>
        <div className="flex items-center gap-[var(--space-24)]">
          <span aria-hidden className="flex size-[88px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--sage-50)] text-[32px] font-semibold leading-[40px] text-[var(--sage-600)]">
            {profile.name.slice(0, 1).toUpperCase()}
          </span>
          <dl className="grid grid-cols-[120px_1fr] items-baseline gap-x-[var(--space-16)] gap-y-[var(--space-8)]">
            <dt className="text-[13px] leading-[18px] text-[var(--text-secondary)]">{P.name}</dt>
            <dd className="text-[20px] font-semibold leading-[26px] text-[var(--text-primary)]" data-testid="profile-name">{profile.name}</dd>
            <dt className="text-[13px] leading-[18px] text-[var(--text-secondary)]">{P.email}</dt>
            <dd className="text-[16px] leading-[22px] text-[var(--text-primary)]">{profile.email}</dd>
            <dt className="text-[13px] leading-[18px] text-[var(--text-secondary)]">{P.company}</dt>
            <dd className="text-[16px] leading-[22px] text-[var(--text-primary)]">{profile.company}</dd>
            <dt />
            <dd className="text-[13px] leading-[18px] text-[var(--text-tertiary)]">{fmt(P.signedInWith, { provider: profile.signedInWith })}</dd>
          </dl>
        </div>
        <Button onClick={() => setEditing(true)}>{P.edit}</Button>
      </section>

      <section className={card}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-[var(--space-4)]">
            <h2 className={h2}>{P.team}</h2>
            {!isOwner && <p className="text-[13px] leading-[18px] text-[var(--text-secondary)]">{P.ownerOnly}</p>}
          </div>
          <Button variant="primary" disabled={!isOwner} onClick={() => setInviting(true)}>
            <Icon name="add" size={20} />
            {P.invite}
          </Button>
        </div>
        <table className="w-full">
          <thead className="text-left">
            <tr className="text-[13px] leading-[18px] text-[var(--text-secondary)]">
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
                <tr key={m.email} className="border-t border-[var(--border-default)]" data-testid="team-row">
                  <td className="py-[var(--space-16)]">
                    <div className="flex items-center gap-[var(--space-16)]">
                      <span aria-hidden className="flex size-[44px] shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--bg-canvas)] text-[16px] font-medium leading-[22px] text-[var(--text-link)]">
                        {m.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="flex min-w-0 flex-col gap-[2px]">
                        <div className="text-[16px] font-medium leading-[22px] text-[var(--text-primary)]">
                          {m.name}
                          {self ? <span className="font-normal text-[var(--text-secondary)]">{` (${P.you})`}</span> : ""}
                        </div>
                        <div className="text-[14px] leading-[20px] text-[var(--text-secondary)]">
                          {m.email}
                          {m.pending && m.expiresAt ? ` · ${fmt(P.pendingUntil, { date: new Date(m.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) })}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-[var(--space-16)]">
                    {editable ? (
                      <ChipSelect value={m.role} onChange={(e) => void setRole(m, e.target.value as Role)} aria-label={`${m.name} role`}>
                        {TEAM_ROLES.filter((r) => r !== "Owner").map((r) => <option key={r} value={r}>{r}</option>)}
                      </ChipSelect>
                    ) : (
                      <span className={`${chipClass({ size: "S", selected: m.role === "Owner" })} pointer-events-none`}>{m.role}</span>
                    )}
                  </td>
                  <td className="py-[var(--space-16)] text-right">
                    {editable && (
                      <span className="flex justify-end gap-[var(--space-8)]">
                        {!m.pending && <Button onClick={() => setConfirm({ kind: "transfer", member: m })}>{P.transfer}</Button>}
                        <Button variant="ghost" onClick={() => setConfirm({ kind: "remove", member: m })}>{P.remove}</Button>
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
          <Button onClick={() => setLogOut(true)}>{STRINGS.sidebar.logOut}</Button>
          <Button variant="danger" onClick={() => setDeleteAccount(true)}>{P.deleteAccount}</Button>
        </div>
      </section>

      <EditProfileModal
        open={editing}
        profile={profile}
        onClose={() => setEditing(false)}
        onSaved={(p) => {
          setProfile(p);
          setEditing(false);
          toast(P.saved);
          router.refresh(); // sidebar name
        }}
      />
      <InviteModal open={inviting} onClose={() => setInviting(false)} onInvited={(p, n) => { setProfile(p); setInviting(false); toast(fmt(P.invited, { n })); }} />
      <ConfirmModal
        open={confirm !== null}
        title={confirm ? fmt(confirm.kind === "remove" ? P.removeConfirm.title : P.transferConfirm.title, { name: confirm.member.name }) : ""}
        body={confirm?.kind === "remove" ? P.removeConfirm.body : P.transferConfirm.body}
        confirmLabel={confirm?.kind === "remove" ? P.remove : P.transfer}
        danger={confirm?.kind === "remove"}
        onConfirm={() => void confirmAction()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal open={deleteAccount} title={P.deleteAccountConfirm.title} body={P.deleteAccountConfirm.body} confirmLabel={STRINGS.common.confirm} onConfirm={() => setDeleteAccount(false)} onCancel={() => setDeleteAccount(false)} />
      <ConfirmModal open={logOut} title={P.logOutConfirm.title} body={P.logOutConfirm.body} confirmLabel={STRINGS.sidebar.logOut} onConfirm={() => router.push("/")} onCancel={() => setLogOut(false)} />
    </div>
  );
}

function EditProfileModal({ open, profile, onClose, onSaved }: { open: boolean; profile: Profile; onClose: () => void; onSaved: (p: Profile) => void }) {
  const [name, setName] = useState(profile.name);
  const [company, setCompany] = useState(profile.company);
  const [error, setError] = useState<string | null>(null);
  const [discard, setDiscard] = useState(false);
  const dirty = open && (name !== profile.name || company !== profile.company);
  useUnsavedChanges(dirty);
  const nameOk = name.trim().length >= 1 && name.trim().length <= 20;

  const reset = () => {
    setName(profile.name);
    setCompany(profile.company);
    setError(null);
  };
  const cancel = () => (dirty ? setDiscard(true) : (reset(), onClose()));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      onSaved(await api<Profile>("/api/profile", { method: "PATCH", body: JSON.stringify({ name: name.trim(), company: company.trim() }) }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : STRINGS.lab.toast.failed);
    }
  }

  return (
    <>
      <Modal open={open && !discard} onClose={cancel} title={P.edit}>
        <form onSubmit={save} className="flex flex-col gap-[var(--space-40)]">
          <div className="flex flex-col gap-[var(--space-20)]">
            <label className="flex flex-col gap-[6px]">
              <span className={FIELD_LABEL}>{P.name}</span>
              <TextInput tone="canvas" value={name} maxLength={20} onChange={(e) => setName(e.target.value)} aria-invalid={!nameOk} />
              <span className={nameOk ? FIELD_HELPER : `${FIELD_HELPER} !text-[var(--text-error)]`}>{P.nameRule}</span>
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className={FIELD_LABEL}>{P.company}</span>
              <TextInput tone="canvas" value={company} maxLength={60} onChange={(e) => setCompany(e.target.value)} />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className={FIELD_LABEL}>{P.email}</span>
              <TextInput value={profile.email} disabled />
            </label>
            {error && <p className="text-[13px] leading-[18px] text-[var(--text-error)]" role="alert">{error}</p>}
          </div>
          <ModalActions>
            <ModalButton onClick={cancel}>{STRINGS.common.cancel}</ModalButton>
            <ModalButton type="submit" variant="primary" disabled={!nameOk || !dirty}>{STRINGS.common.save}</ModalButton>
          </ModalActions>
        </form>
      </Modal>
      <ConfirmModal
        open={open && discard}
        title={STRINGS.common.unsaved.title}
        body={STRINGS.common.unsaved.body}
        danger
        onConfirm={() => { setDiscard(false); reset(); onClose(); }}
        onCancel={() => setDiscard(false)}
      />
    </>
  );
}

function InviteModal({ open, onClose, onInvited }: { open: boolean; onClose: () => void; onInvited: (p: Profile, n: number) => void }) {
  const [chips, setChips] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<Role>("Editor");
  const [error, setError] = useState<string | null>(null);

  const addChip = (raw: string) => {
    const email = raw.trim().replace(/,$/, "");
    if (!email) return;
    if (!EMAIL.test(email)) return setError(fmt(P.invalidEmail, { email }));
    setError(null);
    setChips((c) => (c.includes(email) ? c : [...c, email]));
    setDraft("");
  };

  async function send() {
    const emails = draft.trim() ? [...chips, draft.trim()] : chips;
    if (emails.some((e) => !EMAIL.test(e))) return setError(fmt(P.invalidEmail, { email: emails.find((e) => !EMAIL.test(e))! }));
    try {
      const p = await api<Profile>("/api/profile/invite", { method: "POST", body: JSON.stringify({ emails, role }) });
      setChips([]);
      setDraft("");
      onInvited(p, emails.length);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : STRINGS.lab.toast.failed);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={P.inviteTitle}>
      <div className="flex flex-col gap-[var(--space-40)]">
        <div className="flex flex-col gap-[var(--space-20)]">
          <label className="flex flex-col gap-[6px]">
            <span className={FIELD_LABEL}>{P.inviteEmails}</span>
            <div className={`${FIELD_BOX} flex-wrap bg-[var(--bg-canvas)] py-[var(--space-8)]`}>
              {chips.map((c) => (
                <span key={c} data-testid="invite-chip" className={`${chipClass({ size: "S" })} gap-[var(--space-4)] pr-[var(--space-8)]`}>
                  {c}
                  <button type="button" aria-label={`Remove ${c}`} onClick={() => setChips((x) => x.filter((y) => y !== c))} className="flex text-[var(--icon-secondary)] hover:text-[var(--icon-primary)]">
                    <Icon name="close" size={16} />
                  </button>
                </span>
              ))}
              <input
                value={draft}
                aria-invalid={error !== null}
                onChange={(e) => { setDraft(e.target.value); setError(null); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addChip(draft);
                  } else if (e.key === "Backspace" && !draft) setChips((c) => c.slice(0, -1));
                }}
                onBlur={() => addChip(draft)}
                className={`${FIELD_INPUT} min-w-40 py-[var(--space-4)]`}
              />
            </div>
            {error && <span className={`${FIELD_HELPER} !text-[var(--text-error)]`} role="alert">{error}</span>}
          </label>
          <div className="flex items-center justify-between">
            <span className={FIELD_LABEL}>{P.role}</span>
            <ChipSelect chipSize="M" value={role} onChange={(e) => setRole(e.target.value as Role)} aria-label={P.role}>
              {TEAM_ROLES.filter((r) => r !== "Owner").map((r) => <option key={r} value={r}>{r}</option>)}
            </ChipSelect>
          </div>
        </div>
        <ModalActions>
          <ModalButton onClick={onClose}>{STRINGS.common.cancel}</ModalButton>
          <ModalButton variant="primary" disabled={chips.length === 0 && !draft.trim()} onClick={() => void send()}>{P.inviteSend}</ModalButton>
        </ModalActions>
      </div>
    </Modal>
  );
}
