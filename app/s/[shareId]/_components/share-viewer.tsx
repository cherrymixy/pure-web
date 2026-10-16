"use client";

import Link from "next/link";
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
import { ReferencedSets } from "@/components/ui/referenced-sets";
import { Loading } from "@/components/ui/states";
import { FIELD_HELPER, FIELD_LABEL, TextInput, chipClass } from "@/components/ui/chip";
import { Icon, type IconName } from "@/components/ui/icons/icon";

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

  // No Figma frame: landing Top Bar pill header on bg/canvas; states in the W02B-3 analyzing-card style
  // (white radius 2xl, 2px border/default, soft shadow, px 48 · py 40); player on a rounded stage; DS Text Field / Chip.
  const header = (right?: React.ReactNode) => (
    <div className="px-[14px] pt-[var(--space-16)]">
      <header className="flex h-[88px] items-center justify-between rounded-[var(--radius-full)] border border-[var(--neutral-0)] bg-[var(--bg-surface)] px-[var(--space-40)]">
        <Link href="/" aria-label={STRINGS.brand.name} className="flex items-center gap-[var(--space-12)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/landing/logo-mark.svg" alt="" width={30} height={30} className="block" />
          <span className="text-[20px] font-semibold leading-[1.26] text-[var(--sage-800)]">{STRINGS.brand.name}</span>
        </Link>
        {right}
      </header>
    </div>
  );
  const shell = (icon: IconName, children: React.ReactNode, tone: "default" | "error" = "default") => (
    <div className="flex min-h-screen flex-col bg-[var(--bg-canvas)]">
      {header()}
      <main className="flex flex-1 items-center justify-center p-[var(--space-40)]">
        <div className="flex w-[640px] items-start gap-[var(--space-32)] rounded-[var(--radius-2xl)] border-2 border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--space-48)] py-[var(--space-40)] shadow-[0_12px_24px_0_var(--effect-shadow)]">
          <span className={`flex size-[88px] shrink-0 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--bg-canvas)] ${tone === "error" ? "text-[var(--text-error)]" : "text-[var(--icon-primary)]"}`}>
            <Icon name={icon} size={36} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-8)] self-center">{children}</div>
        </div>
      </main>
    </div>
  );
  const title = "text-[22px] font-semibold leading-[28px] text-[var(--text-primary)]";
  const body = "text-[16px] leading-[20px] text-[var(--text-secondary)]";

  if (state.kind === "loading") return shell("spinner", <Loading label={STRINGS.common.loading} />);
  if (state.kind === "expired") return shell("history", <><h1 className={title}>{SH.expired.title}</h1><p className={body}>{SH.expired.body}</p></>);
  if (state.kind === "locked") return shell("error_outline", <p className={`${title} !text-[18px] !text-[var(--text-error)]`} role="alert">{SH.locked}</p>, "error");
  if (state.kind === "missing" || !view) return shell("link_off", <><h1 className={title}>{SH.notFound.title}</h1><p className={body}>{SH.notFound.body}</p></>);

  if (!view.expressions) {
    return shell(
      "visibility",
      <form onSubmit={unlock} className="flex flex-col gap-[var(--space-20)]" data-testid="share-password">
        <h1 className={title}>{SH.enterPassword}</h1>
        <label className="flex flex-col gap-[6px]">
          <span className={FIELD_LABEL}>{SH.password}</span>
          <TextInput
            tone="canvas"
            type="password"
            autoFocus
            value={password}
            aria-invalid={wrong}
            onChange={(e) => { setPassword(e.target.value); setWrong(false); }}
            aria-label={SH.password}
          />
          {wrong && <span className={`${FIELD_HELPER} !text-[var(--text-error)]`} role="alert">{fmt(SH.wrongPassword, { n: Math.max(MAX_TRIES - tries, 0) })}</span>}
        </label>
        <Button type="submit" variant="primary" disabled={!password} className="self-end">{SH.unlock}</Button>
      </form>,
    );
  }

  const daysLeft = Math.ceil((new Date(view.expiresAt).getTime() - Date.now()) / DAY);
  const typeName = ROBOT_TYPES.find((t) => t.id === view.type)?.name ?? view.type;
  const meta = `${chipClass({ size: "S" })} pointer-events-none !bg-[var(--bg-canvas)]`;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-canvas)]">
      {header(<span className="text-[20px] leading-[1.26] text-[var(--text-link)]">{fmt(SH.viewer.by, { team: view.team })}</span>)}
      <main className="grid w-full grid-cols-[minmax(0,1fr)_440px] gap-[var(--space-24)] px-[var(--space-32)] py-[var(--space-24)]">
        <div className="flex flex-col gap-[var(--space-12)]">
          <div className="relative h-[calc(100vh-180px)] min-h-[640px] overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--bg-surface)]">
            <Viewport mode="share" orbit structure={view.robot?.structure} signatureParams={params} expression={playable} autoPlay sound={sound} className="block size-full" />
          </div>
          <span className="flex items-center gap-[var(--space-8)] px-[var(--space-8)] text-[13px] leading-[18px] text-[var(--text-tertiary)]">
            <Icon name="replay" size={16} />
            {SH.rotateHint}
          </span>
        </div>
        <aside className="flex flex-col gap-[var(--space-24)] self-start rounded-[var(--radius-xl)] bg-[var(--bg-surface)] p-[var(--space-32)]">
          <div className="flex flex-wrap gap-[var(--space-8)]" data-testid="share-meta">
            <span className={meta}>{fmt(SH.viewer.count, { n: view.expressions.length })}</span>
            <span className={meta}>{fmt(SH.viewer.signature, { v: view.signatureVersion })}</span>
            <span className={meta}>{typeName}</span>
            <span className={meta}>{daysLeft <= 1 ? SH.viewer.lastDay : fmt(SH.viewer.left, { d: daysLeft })}</span>
          </div>
          <ul className="flex flex-col gap-[var(--space-8)]">
            {view.expressions.map((e, i) => (
              <li key={e.id}>
                <button
                  onClick={() => setSelected(i)}
                  aria-pressed={i === selected}
                  className={`flex w-full items-center gap-[var(--space-16)] rounded-[var(--radius-md)] border-[1.5px] px-[var(--space-20)] py-[var(--space-16)] text-left ${
                    i === selected ? "border-[var(--border-strong)] bg-[var(--bg-surface)]" : "border-transparent bg-[var(--bg-canvas)] hover:bg-[var(--neutral-150)]"
                  }`}
                >
                  <Icon name="play_arrow" size={24} className={`shrink-0 ${i === selected ? "text-[var(--icon-primary)]" : "text-[var(--icon-secondary)]"}`} />
                  <span className="flex min-w-0 flex-col gap-[2px]">
                    <span className="truncate text-[16px] font-medium leading-[22px] text-[var(--text-primary)]">{e.name}</span>
                    <span className="truncate text-[14px] leading-[20px] text-[var(--text-secondary)]">{e.currentStatus}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {view.allowDownload && (
            <Button variant="primary" disabled={!view.robot} onClick={download} className="w-full">
              <Icon name="download-minimalistic" size={20} />
              {STRINGS.export.download}
            </Button>
          )}
          {!view.allowDownload && <span className="text-[13px] leading-[18px] text-[var(--text-tertiary)]">{STRINGS.common.viewOnly}</span>}
          {expr && (
            <div className="border-t border-[var(--border-default)] pt-[var(--space-24)]">
              <ReferencedSets key={expr.id} behaviors={expr.motion.recipe.steps.map((st) => st.behavior)} />
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
