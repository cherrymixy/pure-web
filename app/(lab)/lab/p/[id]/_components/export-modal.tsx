"use client";

import { useEffect, useMemo, useState } from "react";
import { ROBOT_DEVICE_STRUCTURES } from "@/data/robot-devices";
import { STRINGS, fmt } from "@/data/strings";
import { buildPureJson, compatibility, type CompatIssue } from "@/lib/expression";
import type { Channel, Clip, Expression, Profile, Project, RobotDevice, SavedExpression } from "@/lib/models";
import { api } from "@/lib/ui/api";
import { downloadText, slug } from "@/lib/ui/download";
import { CHANNEL_LABEL } from "@/components/ui/channel-badges";
import { Icon } from "@/components/ui/icons/icon";
import { Modal, ModalActions, ModalButton } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

const X = STRINGS.export;
const SH = STRINGS.share;
type Destination = "robot" | "file" | "share";
const DAYS = [1, 7, 30] as const;

type Done = { destination: Destination; robot: string; bytes: number; url?: string; text: string; filename: string; library: boolean };

/** W02F-3~4 Export: destination, options, real compatibility check, exported summary, share link. */
export function ExportModal({
  open,
  initialDestination = "file",
  project,
  expression,
  clip,
  onFix,
  onClose,
}: {
  open: boolean;
  initialDestination?: Destination;
  project: Pick<Project, "name" | "type" | "structure">;
  expression: Expression;
  clip: Clip;
  onFix: (issue: CompatIssue) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [robots, setRobots] = useState<RobotDevice[]>([]);
  const [team, setTeam] = useState("");
  const [destination, setDestination] = useState<Destination>(initialDestination);
  const [target, setTarget] = useState("r-purebot-desk");
  const [includeFallback, setIncludeFallback] = useState(false);
  const [loop, setLoop] = useState(false);
  const [toLibrary, setToLibrary] = useState(true);
  const [days, setDays] = useState<(typeof DAYS)[number]>(7);
  const [protect, setProtect] = useState(false);
  const [password, setPassword] = useState("");
  const [allowDownload, setAllowDownload] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  useEffect(() => {
    if (!open) return;
    setDone(null);
    setDestination(initialDestination);
    api<RobotDevice[]>("/api/robots").then(setRobots, () => {});
    api<Profile>("/api/profile").then((p) => setTeam(p.company), () => {});
  }, [open, initialDestination]);

  const robot = robots.find((r) => r.id === target);
  const structure = ROBOT_DEVICE_STRUCTURES[target];
  const issues = useMemo(
    () => (open && structure ? compatibility(expression, { name: robot?.name ?? target, structure }) : []),
    [open, expression, structure, robot?.name, target],
  );
  // Channel issues are what the fallback is for.
  const open_ = issues.filter((i) => !(includeFallback && i.kind === "channel"));
  const blocked = destination === "robot" && open_.length > 0;

  async function run() {
    setBusy(true);
    try {
      let saved: SavedExpression | null = null;
      if (toLibrary || destination === "share") {
        saved = await api<SavedExpression>("/api/library", { method: "POST", body: JSON.stringify({ expressionId: expression.id, name: expression.name }) });
      }
      const pure = buildPureJson(project, expression.signatureSnapshot, expression, clip, { includeFallback, loop, team });
      const filename = `${slug(expression.name)}.pure.json`;
      let url: string | undefined;
      if (destination === "file") downloadText(filename, pure.text);
      if (destination === "share") {
        const share = await api<{ url: string }>("/api/shares", {
          method: "POST",
          body: JSON.stringify({ expressionIds: [saved!.id], days, allowDownload, ...(protect && password ? { password } : {}) }),
        });
        url = `${location.origin}${share.url}`;
      }
      if (saved && toLibrary) toast(fmt(X.savedToLibrary, { name: saved.name }));
      setDone({ destination, robot: robot?.name ?? "", bytes: pure.bytes, url, text: pure.text, filename, library: Boolean(saved && toLibrary) || destination === "share" });
    } catch (err) {
      toast(err instanceof Error ? err.message : STRINGS.lab.toast.failed);
    } finally {
      setBusy(false);
    }
  }

  const channels: Channel[] = ["motion", ...(expression.face.preset ? (["face"] as const) : []), ...(expression.sound.cues.length ? (["sound"] as const) : [])];
  const actionLabel = destination === "robot" ? fmt(X.actions.robot, { robot: robot?.name ?? "" }) : X.actions[destination];
  const sig = expression.signatureSnapshot;
  const toRobot = done?.destination === "robot";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={done ? (toRobot ? fmt(X.exportedRobot, { robot: done.robot }) : X.exported) : X.title}
      description={done ? (toRobot ? X.exportedRobotBody : undefined) : X.subtitle}
    >
      {done ? (
        <div className="flex flex-col gap-[var(--space-40)]" data-testid="exported">
          <div className="flex flex-col gap-[var(--space-12)]">
            <Row label={X.rows.expression} value={expression.name} />
            <Row label={X.rows.signature} value={fmt(X.signatureValue, { name: sig.name, v: sig.version })} />
            <Row label={X.rows.channels} value={channels.map((c) => CHANNEL_LABEL[c]).join(" · ")} />
            <Row label={X.rows.specFile} value={fmt(X.specFileValue, { kb: (done.bytes / 1024).toFixed(1) })} />
            {done.library && <Row label={X.rows.savedTo} value={X.library} />}
          </div>
          {done.url && (
            <input readOnly value={done.url} className={`${FIELD} w-full font-mono`} onFocus={(e) => e.target.select()} aria-label={X.copyLink} />
          )}
          <ModalActions>
            <ModalButton onClick={() => (location.href = "/lab")}>{X.backToLab}</ModalButton>
            {done.url && <ModalButton onClick={() => navigator.clipboard.writeText(done.url!).then(() => toast(X.copied), () => {})}>{X.copyLink}</ModalButton>}
            <ModalButton variant="primary" onClick={() => downloadText(done.filename, done.text)}>{X.download}</ModalButton>
          </ModalActions>
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-[var(--space-16)]">
            <h3 className={SECTION}>{X.destination}</h3>
            <div className="flex gap-[var(--space-12)]" role="radiogroup" aria-label={X.destination}>
              {(["robot", "file", "share"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={destination === d}
                  onClick={() => setDestination(d)}
                  className={`flex min-w-0 flex-1 flex-col items-start gap-[var(--space-4)] rounded-[var(--radius-md)] border-[1.5px] p-[var(--space-16)] text-left ${destination === d ? "border-[var(--border-strong)] bg-[var(--bg-canvas)]" : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)]"}`}
                >
                  <span className="text-[16px] font-medium leading-[20px] text-[var(--text-primary)]">{X.destinations[d]}</span>
                  <span className="max-w-full truncate text-[14px] leading-[18px] text-[var(--text-secondary)]">{fmt(X.destinationNotes[d], { robot: robot?.name ?? "" })}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-[var(--space-16)]">
            <h3 className={SECTION}>{X.optionsTitle}</h3>
            <label className="flex items-center justify-between gap-[var(--space-12)] text-[16px] leading-[20px] text-[var(--text-link)]">
              <span>{X.options.target}</span>
              <select value={target} onChange={(e) => setTarget(e.target.value)} className={FIELD}>
                {robots.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <Check checked={includeFallback} onChange={setIncludeFallback} label={X.options.fallback} />
            <Check checked={loop} onChange={setLoop} label={X.options.loop} />
            <Check checked={toLibrary || destination === "share"} disabled={destination === "share"} onChange={setToLibrary} label={X.options.library} />
            {destination === "share" && (
              <>
                <label className="flex items-center justify-between gap-[var(--space-12)] text-[16px] leading-[20px] text-[var(--text-link)]">
                  <span>{SH.expiresIn}</span>
                  <select value={days} onChange={(e) => setDays(Number(e.target.value) as (typeof DAYS)[number])} className={FIELD}>
                    {DAYS.map((d) => <option key={d} value={d}>{SH.days[d]}</option>)}
                  </select>
                </label>
                <Check checked={protect} onChange={setProtect} label={SH.passwordProtect} />
                {protect && <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={SH.password} maxLength={64} className={FIELD} />}
                <Check checked={allowDownload} onChange={setAllowDownload} label={SH.allowDownload} />
              </>
            )}
          </section>

          <div
            className={`flex flex-col gap-[var(--space-12)] rounded-[var(--radius-md)] border-[1.5px] bg-[var(--bg-surface)] px-[var(--space-20)] py-[var(--space-16)] ${open_.length ? "border-[var(--border-error)]" : "border-[var(--border-default)]"}`}
            data-testid="compat"
          >
            {open_.length === 0 ? (
              <div className="flex items-center gap-[var(--space-16)]">
                <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-4)]">
                  <b className="text-[16px] font-medium leading-[20px] text-[var(--text-primary)]">{X.ready}</b>
                  <span className="text-[14px] leading-[18px] text-[var(--text-secondary)]">{X.readyBody}</span>
                </span>
                <span className="text-[14px] font-medium leading-[18px] text-[var(--status-success)]" aria-hidden>✓</span>
              </div>
            ) : (
              <>
                <b className="text-[16px] font-medium leading-[20px] text-[var(--text-error)]">{fmt(open_.length === 1 ? X.issues : X.issuesN, { n: open_.length })}</b>
                {open_.map((i, n) => (
                  <div key={n} className="flex items-center gap-[var(--space-12)]">
                    <span className="min-w-0 flex-1 text-[14px] leading-[18px] text-[var(--text-link)]">{i.message}</span>
                    {i.fix === "editor" ? (
                      <ModalButton onClick={() => onFix(i)}>{X.fix}</ModalButton>
                    ) : (
                      <ModalButton onClick={() => setIncludeFallback(true)}>{X.fallback}</ModalButton>
                    )}
                  </div>
                ))}
                {blocked && <span className="text-[14px] leading-[18px] text-[var(--text-secondary)]">{X.blockRobot}</span>}
              </>
            )}
          </div>

          <ModalActions>
            <ModalButton onClick={onClose}>{STRINGS.common.cancel}</ModalButton>
            <ModalButton variant="primary" disabled={busy || blocked || (destination === "share" && protect && !password)} onClick={() => void run()}>{actionLabel}</ModalButton>
          </ModalActions>
        </>
      )}
    </Modal>
  );
}

const SECTION = "text-[16px] font-medium leading-[20px] text-[var(--text-link)]";
const FIELD =
  "rounded-[var(--radius-full)] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-16)] py-[var(--space-8)] text-[16px] leading-[20px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)]";

/** W02F-3 option row: 16px checkbox (radius 2xs, filled inverse when on) · gap 12 · Body 16 link. */
function Check({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-[var(--space-12)] text-[16px] leading-[20px] text-[var(--text-link)] ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <span className="relative size-[16px] shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 m-0 appearance-none rounded-[var(--radius-2xs)] border-[1.5px] border-[var(--border-default)] bg-[var(--bg-surface)] checked:border-[var(--bg-inverse)] checked:bg-[var(--bg-inverse)]"
        />
        <Icon name="checkbox-tick" size={16} className="pointer-events-none absolute inset-0 hidden text-[var(--text-on-inverse)] peer-checked:block" />
      </span>
      {label}
    </label>
  );
}

/** Exported summary row: Body 16 secondary · Label 16 medium primary. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-[var(--space-16)] text-[16px] leading-[20px]">
      <span className="shrink-0 text-[var(--text-secondary)]">{label}</span>
      <span className="truncate text-right font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
