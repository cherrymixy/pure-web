// @implemented
import Link from "next/link";
import { collectRoutes } from "@/lib/dev/routes";
import { contentSummary } from "@/lib/dev/content";
import { FLAGS } from "@/lib/env";
import { getRepo } from "@/lib/repo-server";
import { OllamaStatus } from "./_components/ollama-status";
import { DemoToggle } from "./_components/demo-toggle";
import { ResetButton } from "./_components/reset-button";
import { FlagToggle } from "./_components/flag-toggle";

export const dynamic = "force-dynamic";

export default async function DevPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "routes" } = await searchParams;
  const routes = collectRoutes();
  const done = routes.filter((r) => r.implemented).length;
  const db = await getRepo().dev.dump();

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 p-10">
      <div className="flex items-end gap-6">
        <h1 className="text-2xl font-semibold">/dev</h1>
        <nav className="flex gap-4 text-sm">
          {["routes", "content", "db"].map((t) => (
            <Link key={t} href={`/dev?tab=${t}`} className={t === tab ? "font-semibold underline" : "text-neutral-500"}>
              {t === "routes" ? "Routes" : t === "content" ? "Content" : "DB"}
            </Link>
          ))}
        </nav>
      </div>

      {tab === "content" ? <ContentTab /> : tab === "db" ? <DbTab db={db} /> : <>
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">
          Routes <span className="text-neutral-500">{done}/{routes.length} implemented</span>
        </h2>
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-500">
            <tr>
              <th className="w-8 py-1" />
              <th>Route</th>
              <th>Screen</th>
              <th>File</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.file} className="border-t border-neutral-100">
                <td className="py-1.5">
                  <span className={`inline-block h-3 w-3 rounded-full ${r.implemented ? "bg-green-500" : "bg-neutral-300"}`} />
                </td>
                <td>
                  <Link href={r.href} className="font-mono underline">{r.route}</Link>
                </td>
                <td>{r.screen ?? "—"}</td>
                <td className="font-mono text-xs text-neutral-400">{r.file}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Ollama</h2>
        <OllamaStatus />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Demo</h2>
        <DemoToggle initial={db.settings.demoMode} />
        <ResetButton />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Flags</h2>
        <FlagToggle initial={!!db.settings.directClip} forced={FLAGS.directClip} />
        <DirectClipStats jobs={db.jobs} />
      </section>
      </>}
    </main>
  );
}

function ContentTab() {
  const rows = contentSummary();
  const placeholders = rows.reduce((n, r) => n + (r.placeholders ?? 0), 0);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold">
        Content <span className="text-neutral-500">{placeholders} placeholder entries</span>
      </h2>
      <table className="w-full text-sm">
        <thead className="text-left text-neutral-500">
          <tr><th className="py-1">Item</th><th>Count</th><th>Placeholders</th><th>File</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.item} className="border-t border-neutral-100">
              <td className="py-1.5">{r.item}</td>
              <td className="font-mono">{r.count}</td>
              <td className={`font-mono ${r.placeholders ? "text-amber-600" : "text-neutral-400"}`}>{r.placeholders ?? "—"}</td>
              <td className="font-mono text-xs text-neutral-400">{r.file}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function DbTab({ db }: { db: Awaited<ReturnType<ReturnType<typeof getRepo>["dev"]["dump"]>> }) {
  const collections = Object.entries(db).filter(([, v]) => typeof v === "object");
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <h2 className="font-semibold">DB <span className="font-mono text-sm text-neutral-500">data/db.json</span></h2>
        <ResetButton />
      </div>
      {collections.map(([name, value]) => (
        <details key={name} className="rounded border border-neutral-200">
          <summary className="flex cursor-pointer gap-3 px-3 py-2 text-sm">
            <span className="font-medium">{name}</span>
            <span data-testid={`db-count-${name}`} className="font-mono text-neutral-500">
              {Array.isArray(value) ? value.length : "{…}"}
            </span>
          </summary>
          <pre className="max-h-96 overflow-auto border-t border-neutral-200 bg-neutral-50 p-3 text-xs">{JSON.stringify(value, null, 2)}</pre>
        </details>
      ))}
    </section>
  );
}

type DirectInfo = { used: boolean; reason?: string; ms: number };

/** Tier 2 outcomes from finished generate jobs: how often keyframes were used vs fell back to the recipe. */
function DirectClipStats({ jobs }: { jobs: { kind: string; status: string; result?: unknown; updatedAt: string }[] }) {
  const runs = jobs
    .filter((j) => j.kind === "generate" && j.status === "done")
    .map((j) => ({ at: j.updatedAt, info: (j.result as { directClip?: DirectInfo } | undefined)?.directClip }))
    .filter((r): r is { at: string; info: DirectInfo } => !!r.info)
    .sort((a, b) => b.at.localeCompare(a.at));
  const used = runs.filter((r) => r.info.used).length;
  const pct = (n: number) => (runs.length ? `${Math.round((n / runs.length) * 100)}%` : "—");
  return (
    <div className="flex flex-col gap-2 text-sm">
      <table className="w-80" data-testid="directclip-stats">
        <tbody>
          <tr className="border-t border-neutral-100"><td className="py-1">Tier 2 attempts</td><td className="font-mono">{runs.length}</td></tr>
          <tr className="border-t border-neutral-100"><td className="py-1">Keyframes used</td><td className="font-mono">{used} ({pct(used)})</td></tr>
          <tr className="border-t border-neutral-100"><td className="py-1">Fell back to recipe</td><td className="font-mono">{runs.length - used} ({pct(runs.length - used)})</td></tr>
        </tbody>
      </table>
      {runs.slice(0, 6).map((r, i) => (
        <p key={i} className="font-mono text-xs text-neutral-500">
          {r.at.slice(11, 19)} · {r.info.used ? "used" : `fallback: ${r.info.reason ?? "?"}`} · {(r.info.ms / 1000).toFixed(1)}s
        </p>
      ))}
    </div>
  );
}
