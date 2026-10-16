import Link from "next/link";
import { STRINGS } from "@/data/strings";

// WC 404.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-16 text-center">
      <p className="font-mono text-sm text-neutral-400">404</p>
      <h1 className="text-2xl font-semibold">{STRINGS.common.notFound.title}</h1>
      <p className="text-sm text-neutral-500">{STRINGS.common.notFound.body}</p>
      <Link href="/lab" className="mt-2 rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100">{STRINGS.common.backHome}</Link>
    </div>
  );
}
