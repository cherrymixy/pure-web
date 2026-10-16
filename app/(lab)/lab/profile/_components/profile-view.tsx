"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STRINGS, fmt } from "@/data/strings";
import { TEAM_ROLES, type Profile, type TeamMember } from "@/lib/models";
import { ApiError, api } from "@/lib/ui/api";
import { Button } from "@/components/ui/button";
import { ConfirmModal, Modal } from "@/components/ui/modal";
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

  return (
    <div className="flex max-w-4xl flex-col gap-8 p-10">
      <h1 className="text-2xl font-semibold">{P.title}</h1>

      <section className="flex items-start justify-between rounded border border-neutral-200 p-5">
        <dl className="grid grid-cols-[100px_1fr] gap-y-1.5 text-sm">
          <dt className="text-neutral-500">{P.name}</dt><dd className="font-semibold" data-testid="profile-name">{profile.name}</dd>
          <dt className="text-neutral-500">{P.email}</dt><dd>{profile.email}</dd>
          <dt className="text-neutral-500">{P.company}</dt><dd>{profile.company}</dd>
          <dt /><dd className="text-xs text-neutral-500">{fmt(P.signedInWith, { provider: profile.signedInWith })}</dd>
        </dl>
        <Button onClick={() => setEditing(true)}>{P.edit}</Button>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{P.team}</h2>
          <Button variant="primary" disabled={!isOwner} onClick={() => setInviting(true)}>{P.invite}</Button>
        </div>
        {!isOwner && <p className="text-xs text-neutral-500">{P.ownerOnly}</p>}
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-neutral-500">
            <tr><th className="py-1 font-normal">{P.member}</th><th className="font-normal">{P.role}</th><th /></tr>
          </thead>
          <tbody>
            {profile.team.map((m) => {
              const self = m.email === profile.email;
              const editable = isOwner && !self && m.role !== "Owner";
              return (
                <tr key={m.email} className="border-t border-neutral-100" data-testid="team-row">
                  <td className="py-2">
                    <div className="font-semibold">{m.name}{self ? ` (${P.you})` : ""}</div>
                    <div className="text-xs text-neutral-500">
                      {m.email}
                      {m.pending && m.expiresAt ? ` · ${fmt(P.pendingUntil, { date: new Date(m.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) })}` : ""}
                    </div>
                  </td>
                  <td>
                    {editable ? (
                      <select value={m.role} onChange={(e) => void setRole(m, e.target.value as Role)} className="rounded border border-neutral-300 px-1 py-0.5" aria-label={`${m.name} role`}>
                        {TEAM_ROLES.filter((r) => r !== "Owner").map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      m.role
                    )}
                  </td>
                  <td className="text-right">
                    {editable && (
                      <span className="flex justify-end gap-1.5">
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

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">{P.account}</h2>
        <div className="flex gap-2">
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
        <form onSubmit={save} className="flex flex-col gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-neutral-500">{P.name}</span>
            <input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} aria-invalid={!nameOk} className={`rounded border px-2 py-1.5 ${nameOk ? "border-neutral-300" : "border-red-500"}`} />
            <span className={`text-xs ${nameOk ? "text-neutral-400" : "text-red-600"}`}>{P.nameRule}</span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-neutral-500">{P.company}</span>
            <input value={company} maxLength={60} onChange={(e) => setCompany(e.target.value)} className="rounded border border-neutral-300 px-2 py-1.5" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-neutral-500">{P.email}</span>
            <input value={profile.email} disabled className="rounded border border-neutral-200 bg-neutral-100 px-2 py-1.5 text-neutral-500" />
          </label>
          {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={cancel}>{STRINGS.common.cancel}</Button>
            <Button type="submit" variant="primary" disabled={!nameOk || !dirty}>{STRINGS.common.save}</Button>
          </div>
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
      <div className="flex flex-col gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-neutral-500">{P.inviteEmails}</span>
          <div className="flex flex-wrap gap-1.5 rounded border border-neutral-300 p-1.5">
            {chips.map((c) => (
              <span key={c} data-testid="invite-chip" className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                {c}
                <button aria-label={`Remove ${c}`} onClick={() => setChips((x) => x.filter((y) => y !== c))}>×</button>
              </span>
            ))}
            <input
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setError(null); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addChip(draft);
                } else if (e.key === "Backspace" && !draft) setChips((c) => c.slice(0, -1));
              }}
              onBlur={() => addChip(draft)}
              className="min-w-40 flex-1 px-1 outline-none"
            />
          </div>
        </label>
        <label className="flex items-center justify-between">
          <span className="text-neutral-500">{P.role}</span>
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded border border-neutral-300 px-2 py-1">
            {TEAM_ROLES.filter((r) => r !== "Owner").map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{STRINGS.common.cancel}</Button>
          <Button variant="primary" disabled={chips.length === 0 && !draft.trim()} onClick={() => void send()}>{P.inviteSend}</Button>
        </div>
      </div>
    </Modal>
  );
}
