// @implemented
import Link from "next/link";
import { SIMREADY_ASSETS, SIMREADY_CREDIT } from "@/data/simready-assets";
import { AssetGrid } from "./_components/asset-grid";

// Library L1 check page: SimReady → GLB(visual) + convex STL(collision) conversion results.
export default function DevSimReadyPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-10">
      <div className="flex items-baseline gap-4">
        <h1 className="text-2xl font-semibold">/dev/simready</h1>
        <span className="text-sm text-neutral-500">{SIMREADY_ASSETS.length} assets · {SIMREADY_CREDIT}</span>
        <Link href="/dev" className="ml-auto text-sm underline">/dev</Link>
      </div>
      <AssetGrid assets={SIMREADY_ASSETS} />
    </main>
  );
}
