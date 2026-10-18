// @implemented
import Link from "next/link";
import { SIM_BEHAVIORS } from "@/data/sim-behaviors";
import { REFERENCE_SETS, type ReferenceItem } from "@/data/reference-sets";

// Review bench for the reference sets: 15 behaviors × face / motion / sound with sources.
export default function DevReferencesPage() {
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 p-10">
      <div className="flex items-baseline gap-4">
        <h1 className="text-2xl font-semibold">/dev/references</h1>
        <span className="text-sm text-neutral-500">{REFERENCE_SETS.length} / {SIM_BEHAVIORS.length} behaviors · Wikimedia Commons</span>
        <Link href="/dev" className="ml-auto text-sm underline">/dev</Link>
      </div>
      {SIM_BEHAVIORS.map((c) => {
        const set = REFERENCE_SETS.find((s) => s.behavior === c.id);
        return (
          <section key={c.id} className="flex flex-col gap-2" data-testid={`refset-${c.id}`}>
            <h2 className="font-semibold">
              {c.label} <span className="text-sm font-normal text-neutral-500">— {c.description}</span>
            </h2>
            {!set ? (
              <p className="text-sm text-neutral-400">Not collected yet</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {set.items.map((it) => <Item key={it.channel} item={it} />)}
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}

function Item({ item }: { item: ReferenceItem }) {
  const isVideo = item.file.endsWith(".webm");
  const isAudio = item.file.endsWith(".ogg");
  return (
    <figure className="flex flex-col gap-1.5 rounded border border-neutral-200 p-2 text-sm">
      <span className="text-xs uppercase tracking-wide text-neutral-500">{item.channel}</span>
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded bg-neutral-100">
        {isVideo ? (
          <video src={item.file} poster={item.poster ?? undefined} muted loop autoPlay playsInline className="h-full w-full object-cover" />
        ) : isAudio ? (
          <audio src={item.file} controls className="w-[90%]" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.file} alt={item.title} className="h-full w-full object-cover" />
        )}
      </div>
      <b>{item.title}</b>
      <span className="text-neutral-600">{item.note}</span>
      <figcaption className="text-xs text-neutral-400">
        <a href={item.source.page} target="_blank" rel="noreferrer" className="underline">{item.source.title.replace(/^File:/, "")}</a>
        {" · "}{item.source.author} · {item.source.license} · {item.source.excerpt}
      </figcaption>
    </figure>
  );
}
