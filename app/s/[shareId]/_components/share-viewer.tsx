"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ROBOT_TYPES } from "@/data/robot-types";
import { STRINGS, fmt } from "@/data/strings";
import { buildPureJson, propsToParams, recipeToClip } from "@/lib/expression";
import type { Expression, RobotType, Structure } from "@/lib/models";
import { createSoundEngine } from "@/lib/sound";
import { ApiError, api } from "@/lib/ui/api";
import { downloadText, slug } from "@/lib/ui/download";
import { Viewport } from "@/components/sim/Viewport";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/states";

const SH = STRINGS.share;
const MAX_TRIES = 5;
const DAY = 86_400_000;

type View = {
  id: string;
  team: string;
  signatureVersion: number;
  type: RobotType;
  expiresAt: string;
  allowDownload: boolean;
  hasPassword: boolean;
  expressionIds: string[];
  expressions: Expression[] | null;
  robot: { projectName: string; type: RobotType; structure: Structure } | null;
};
type State = { kind: "loading" } | { kind: "expired" } | { kind: "locked" } | { kind: "missing" } | { kind: "view"; view: View };

// W02F-5 public share viewer (no sign-in): info, player (rotate only), expression list, download, password, expired.
export function ShareViewer({ id }: { id: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [password, setPassword] = useState("");
  const [tries, setTries] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [selected, setSelected] = useState(0);
  const [sound] = useState(createSoundEngine);

  const fail = useCallback((err: unknown) => {
    const code = err instanceof ApiError ? err.code : "";
    if (code === "EXPIRED") setState({ kind: "expired" });
    else if (code === "LOCKED") setState({ kind: "locked" });
    else setState({ kind: "missing" });
  }, []);

  useEffect(() => {
    api<View>(`/api/shares/${encodeURIComponent(id)}`).then((view) => setState({ kind: "view", view }), fail);
  }, [id, fail]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    try {
      const view = await api<View>(`/api/shares/${encodeURIComponent(id)}/unlock`, { method: "POST", body: JSON.stringify({ password }) });
      setState({ kind: "view", view });
    } catch (err) {
      if (err instanceof ApiError && err.code === "WRONG_PASSWORD") {
        setTries((n) => n + 1);
        setWrong(true);
        setPassword("");
      } else fail(err);
    }
  }

  const view = state.kind === "view" ? state.view : null;
  const expr = view?.expressions?.[selected] ?? null;
  const playable = useMemo(() => (expr ? { motion: expr.motion, face: expr.face, sound: expr.sound } : undefined), [expr]);
  const params = useMemo(() => (expr ? propsToParams(expr.motion.props, expr.signatureSnapshot.axes).params : undefined), [expr]);

  function download() {
    if (!view?.robot || !expr || !params) return;
    const { structure, type, projectName } = view.robot;
    const clip = expr.motion.mode === "clip" && expr.motion.clip ? expr.motion.clip : recipeToClip(expr.motion.recipe, params, structure);
    const { text } = buildPureJson({ name: projectName, type, structure }, expr.signatureSnapshot, expr, clip, { team: view.team });
    downloadText(`${slug(expr.name)}.pure.json`, text);
  }

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200 px-8 py-4 font-semibold">{STRINGS.brand.name}</header>
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">{children}</main>
    </div>
  );

  if (state.kind === "loading") return shell(<Loading label={STRINGS.common.loading} />);
  if (state.kind === "expired") return shell(<><h1 className="text-2xl font-semibold">{SH.expired.title}</h1><p className="text-sm text-neutral-500">{SH.expired.body}</p></>);
  if (state.kind === "locked") return shell(<p className="text-sm text-red-600" role="alert">{SH.locked}</p>);
  if (state.kind === "missing" || !view) return shell(<><h1 className="text-2xl font-semibold">{SH.notFound.title}</h1><p className="text-sm text-neutral-500">{SH.notFound.body}</p></>);

  if (!view.expressions) {
    return shell(
      <form onSubmit={unlock} className="flex w-80 flex-col gap-3" data-testid="share-password">
        <h1 className="text-lg font-semibold">{SH.enterPassword}</h1>
        <input type="password" autoFocus value={password} onChange={(e) => { setPassword(e.target.value); setWrong(false); }} className="rounded border border-neutral-300 px-2 py-1.5" aria-label={SH.password} />
        {wrong && <p className="text-xs text-red-600" role="alert">{fmt(SH.wrongPassword, { n: Math.max(MAX_TRIES - tries, 0) })}</p>}
        <Button type="submit" variant="primary" disabled={!password}>{SH.unlock}</Button>
      </form>,
    );
  }

  const daysLeft = Math.ceil((new Date(view.expiresAt).getTime() - Date.now()) / DAY);
  const typeName = ROBOT_TYPES.find((t) => t.id === view.type)?.name ?? view.type;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-8 py-4">
        <span className="font-semibold">{STRINGS.brand.name}</span>
        <span className="text-sm text-neutral-500">{fmt(SH.viewer.by, { team: view.team })}</span>
      </header>
      <main className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_320px] gap-8 p-10">
        <div className="flex flex-col gap-2">
          <div className="overflow-hidden rounded border border-neutral-200">
            <Viewport mode="share" orbit structure={view.robot?.structure} signatureParams={params} expression={playable} autoPlay sound={sound} className="aspect-[4/3] w-full" />
          </div>
          <span className="text-xs text-neutral-400">{SH.rotateHint}</span>
        </div>
        <aside className="flex flex-col gap-4 text-sm">
          <div className="flex flex-wrap gap-2 text-xs text-neutral-600" data-testid="share-meta">
            <span className="rounded bg-neutral-100 px-2 py-0.5">{fmt(SH.viewer.count, { n: view.expressions.length })}</span>
            <span className="rounded bg-neutral-100 px-2 py-0.5">{fmt(SH.viewer.signature, { v: view.signatureVersion })}</span>
            <span className="rounded bg-neutral-100 px-2 py-0.5">{typeName}</span>
            <span className="rounded bg-neutral-100 px-2 py-0.5">{daysLeft <= 1 ? SH.viewer.lastDay : fmt(SH.viewer.left, { d: daysLeft })}</span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {view.expressions.map((e, i) => (
              <li key={e.id}>
                <button onClick={() => setSelected(i)} className={`flex w-full flex-col rounded border p-2.5 text-left ${i === selected ? "border-neutral-900" : "border-neutral-200 hover:border-neutral-400"}`}>
                  <span className="font-semibold">{e.name}</span>
                  <span className="text-xs text-neutral-500">{e.currentStatus}</span>
                </button>
              </li>
            ))}
          </ul>
          {view.allowDownload && <Button variant="primary" disabled={!view.robot} onClick={download}>{STRINGS.export.download}</Button>}
          {!view.allowDownload && <span className="text-xs text-neutral-400">{STRINGS.common.viewOnly}</span>}
        </aside>
      </main>
    </div>
  );
}
