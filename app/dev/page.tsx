// @implemented
import Link from "next/link";
import { collectRoutes } from "@/lib/dev/routes";
import { contentSummary } from "@/lib/dev/content";
import { FLAGS } from "@/lib/env";
import { getRepo } from "@/lib/repo-server";
import { OllamaStatus } from "./_components/ollama-status";
import { DemoToggle } from "./_components/demo-toggle";
import { ResetButton } from "./_components/reset-button";

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
        <pre className="rounded bg-neutral-50 p-3 text-sm">{JSON.stringify(FLAGS, null, 2)}</pre>
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
