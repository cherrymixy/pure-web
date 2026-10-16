"use client";

import { useState } from "react";
import { COMPONENTS } from "@/data/components";
import { referenceSetFor, type ReferenceItem } from "@/data/reference-sets";
import { STRINGS, fmt } from "@/data/strings";

const E = STRINGS.editor;

/** What the AI referenced: one set (face / motion / sound) per behavior in the expression. */
export function ReferencedSets({ behaviors }: { behaviors: string[] }) {
  const sets = [...new Set(behaviors)].map((b) => referenceSetFor(b)).filter((s) => s !== undefined);
  const [pick, setPick] = useState(0);
  const set = sets[Math.min(pick, sets.length - 1)];
  const label = (id: string) => COMPONENTS.find((c) => c.id === id)?.label ?? id;

  return (
    <section className="flex flex-col gap-2" data-testid="referenced">
      <span className="text-xs text-neutral-500">{E.referencedTitle}</span>
      {!set ? (
        <p className="text-xs text-neutral-400">{E.referencedEmpty}</p>
      ) : (
        <>
          {sets.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {sets.map((s, i) => (
                <button key={s.behavior} aria-pressed={s === set} onClick={() => setPick(i)} className={`rounded-full border px-2 py-0.5 text-xs ${s === set ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}>
                  {label(s.behavior)}
                </button>
              ))}
            </div>
          )}
          {sets.length === 1 && <span className="text-xs text-neutral-500">{fmt(E.referencedFor, { behavior: label(set.behavior) })}</span>}
          {set.items.map((it) => <ReferencedItem key={it.channel} item={it} />)}
        </>
      )}
    </section>
  );
}

function ReferencedItem({ item }: { item: ReferenceItem }) {
  const video = item.file.endsWith(".webm");
  const audio = item.file.endsWith(".ogg");
  return (
    <figure className="flex flex-col gap-1 rounded border border-neutral-200 p-1.5" data-testid={`referenced-${item.channel}`}>
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0 text-[10px] uppercase tracking-wide text-neutral-500">{E.tabs[item.channel]}</span>
        <b className="truncate text-xs">{item.title}</b>
      </div>
      {audio ? (
        <audio src={item.file} controls className="h-7 w-full" />
      ) : video ? (
        <video src={item.file} poster={item.poster ?? undefined} muted loop autoPlay playsInline className="aspect-video w-full rounded object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.file} alt={item.title} className="aspect-video w-full rounded object-cover" />
      )}
      <span className="text-xs text-neutral-600">{item.note}</span>
      <figcaption className="truncate text-[10px] text-neutral-400">
        <a href={item.source.page} target="_blank" rel="noreferrer" className="underline">{fmt(E.referenceSource, { license: item.source.license, author: item.source.author })}</a>
      </figcaption>
    </figure>
  );
}
