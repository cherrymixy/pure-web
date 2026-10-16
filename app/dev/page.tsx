// @implemented
import Link from "next/link";
import { cookies } from "next/headers";
import { collectRoutes } from "@/lib/dev/routes";
import { DEMO_COOKIE, FLAGS } from "@/lib/env";
import { OllamaStatus } from "./_components/ollama-status";
import { DemoToggle } from "./_components/demo-toggle";


export const dynamic = "force-dynamic";

export default async function DevPage() {
  const routes = collectRoutes();
  const done = routes.filter((r) => r.implemented).length;
  const demo = (await cookies()).get(DEMO_COOKIE)?.value === "1";

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 p-10">
      <h1 className="text-2xl font-semibold">/dev</h1>

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
        <DemoToggle cookieName={DEMO_COOKIE} initial={demo} />
        <div className="flex items-center gap-3">
          <button disabled className="rounded border border-neutral-300 px-3 py-1 text-sm text-neutral-400">
            Reset demo data
          </button>
          <span className="text-sm text-neutral-400">Connected in STEP 5 (DB)</span>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Flags</h2>
        <pre className="rounded bg-neutral-50 p-3 text-sm">{JSON.stringify(FLAGS, null, 2)}</pre>
      </section>
    </main>
  );
}
