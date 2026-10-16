"use client";

import { useEffect, useMemo, useState } from "react";
import { ROBOT_DEVICE_STRUCTURES } from "@/data/robot-devices";
import { STRINGS, fmt } from "@/data/strings";
import { buildPureJson, compatibility, type CompatIssue } from "@/lib/expression";
import type { Channel, Clip, Expression, Profile, Project, RobotDevice, SavedExpression } from "@/lib/models";
import { api } from "@/lib/ui/api";
import { downloadText, slug } from "@/lib/ui/download";
import { Button } from "@/components/ui/button";
import { CHANNEL_LABEL } from "@/components/ui/channel-badges";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

const X = STRINGS.export;
const SH = STRINGS.share;
type Destination = "robot" | "file" | "share";
const DAYS = [1, 7, 30] as const;

type Done = { destination: Destination; robot: string; bytes: number; url?: string; text: string; filename: string };

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
      setDone({ destination, robot: robot?.name ?? "", bytes: pure.bytes, url, text: pure.text, filename });
    } catch (err) {
      toast(err instanceof Error ? err.message : STRINGS.lab.toast.failed);
    } finally {
      setBusy(false);
    }
  }

  const channels: Channel[] = ["motion", ...(expression.face.preset ? (["face"] as const) : []), ...(expression.sound.cues.length ? (["sound"] as const) : [])];
  const actionLabel = destination === "robot" ? fmt(X.actions.robot, { robot: robot?.name ?? "" }) : X.actions[destination];

  return (
    <Modal open={open} onClose={onClose} title={done ? X.exported : X.title}>
      {done ? (
        <div className="flex flex-col gap-3 text-sm" data-testid="exported">
          {done.destination === "robot" && <p className="text-green-700">✓ {fmt(X.exportedRobot, { robot: done.robot })}</p>}
          <p>{fmt(X.summary, { name: expression.name, channels: channels.map((c) => CHANNEL_LABEL[c]).join(" · "), kb: (done.bytes / 1024).toFixed(1) })}</p>
          {done.url && (
            <div className="flex gap-2">
              <input readOnly value={done.url} className="flex-1 rounded border border-neutral-300 px-2 py-1 font-mono text-xs" onFocus={(e) => e.target.select()} />
              <Button onClick={() => navigator.clipboard.writeText(done.url!).then(() => toast(X.copied), () => {})}>{X.copyLink}</Button>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button onClick={() => downloadText(done.filename, done.text)}>{X.download}</Button>
            <Button variant="primary" onClick={() => (location.href = "/lab")}>{X.backToLab}</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1 text-xs text-neutral-500">{X.destination}</legend>
            {(["robot", "file", "share"] as const).map((d) => (
              <label key={d} className={`flex items-center gap-2 rounded border p-2 ${destination === d ? "border-neutral-900" : "border-neutral-200"}`}>
                <input type="radio" name="destination" checked={destination === d} onChange={() => setDestination(d)} />
                <span className="font-semibold">{X.destinations[d]}</span>
                <span className="text-xs text-neutral-500">{X.destinationNotes[d]}</span>
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center justify-between gap-2">
              <span>{X.options.target}</span>
              <select value={target} onChange={(e) => setTarget(e.target.value)} className="rounded border border-neutral-300 px-2 py-1">
                {robots.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={includeFallback} onChange={(e) => setIncludeFallback(e.target.checked)} />{X.options.fallback}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />{X.options.loop}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={toLibrary || destination === "share"} disabled={destination === "share"} onChange={(e) => setToLibrary(e.target.checked)} />{X.options.library}</label>
          </div>

          {destination === "share" && (
            <div className="flex flex-col gap-1.5 rounded bg-neutral-50 p-2">
              <label className="flex items-center justify-between gap-2">
                <span>{SH.expiresIn}</span>
                <select value={days} onChange={(e) => setDays(Number(e.target.value) as (typeof DAYS)[number])} className="rounded border border-neutral-300 px-2 py-1">
                  {DAYS.map((d) => <option key={d} value={d}>{SH.days[d]}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={protect} onChange={(e) => setProtect(e.target.checked)} />{SH.passwordProtect}</label>
              {protect && <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={SH.password} maxLength={64} className="rounded border border-neutral-300 px-2 py-1" />}
              <label className="flex items-center gap-2"><input type="checkbox" checked={allowDownload} onChange={(e) => setAllowDownload(e.target.checked)} />{SH.allowDownload}</label>
            </div>
          )}

          <div className={`flex flex-col gap-1.5 rounded border p-2 ${open_.length ? "border-amber-300" : "border-green-300"}`} data-testid="compat">
            <b className={open_.length ? "text-amber-700" : "text-green-700"}>
              {open_.length === 0 ? `✓ ${X.ready}` : fmt(open_.length === 1 ? X.issues : X.issuesN, { n: open_.length })}
            </b>
            {open_.map((i, n) => (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="flex-1">{i.message}</span>
                {i.fix === "editor" ? (
                  <Button onClick={() => onFix(i)}>{X.fix}</Button>
                ) : (
                  <Button onClick={() => setIncludeFallback(true)}>{X.fallback}</Button>
                )}
              </div>
            ))}
            {blocked && <span className="text-xs text-neutral-500">{X.blockRobot}</span>}
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>{STRINGS.common.cancel}</Button>
            <Button variant="primary" disabled={busy || blocked || (destination === "share" && protect && !password)} onClick={() => void run()}>{actionLabel}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
