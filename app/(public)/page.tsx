// @implemented
// @screen W00-1
import Link from "next/link";
import { LANDING } from "@/data/landing";
import { ROBOT_TYPES } from "@/data/robot-types";

const section = "mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-24";
const cta = "w-fit rounded border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700";

// Scrolling landing (gray-box). Every CTA opens the lab.
export default function Page() {
  return (
    <>
      <section className={`${section} min-h-[70vh] justify-center`}>
        <h1 className="text-5xl font-semibold">{LANDING.hero.tagline}</h1>
        <p className="max-w-xl text-lg text-neutral-600">{LANDING.hero.body}</p>
        <Link href="/lab" className={cta}>{LANDING.hero.cta}</Link>
      </section>

      <section id="why" className={`${section} border-t border-neutral-200`}>
        <h2 className="text-3xl font-semibold">{LANDING.why.title}</h2>
        <p className="max-w-2xl text-neutral-600">{LANDING.why.body}</p>
        <div className="grid grid-cols-3 gap-4">
          {LANDING.why.points.map((p) => (
            <div key={p.title} className="flex flex-col gap-2 rounded border border-neutral-200 p-5">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm text-neutral-600">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="expert" className={`${section} border-t border-neutral-200`}>
        <h2 className="text-3xl font-semibold">{LANDING.expert.title}</h2>
        <p className="text-neutral-600">{LANDING.expert.body}</p>
        <div className="grid grid-cols-3 gap-4">
          {LANDING.expert.channels.map((c) => (
            <div key={c.id} className="flex flex-col gap-2 rounded border border-neutral-200 p-5">
              <div className="aspect-video rounded bg-neutral-100" />
              <h3 className="font-semibold">{c.title}</h3>
              <p className="text-sm text-neutral-600">{c.body}</p>
            </div>
          ))}
        </div>
        <Link href="/lab" className={cta}>{LANDING.hero.cta}</Link>
      </section>

      <section id="daily" className={`${section} border-t border-neutral-200`}>
        <h2 className="text-3xl font-semibold">{LANDING.daily.title}</h2>
        <p className="max-w-2xl text-neutral-600">{LANDING.daily.body}</p>
      </section>

      <section id="robot-types" className={`${section} border-t border-neutral-200`}>
        <h2 className="text-3xl font-semibold">{LANDING.robotTypes.title}</h2>
        <p className="text-neutral-600">{LANDING.robotTypes.body}</p>
        <div className="grid grid-cols-5 gap-3">
          {ROBOT_TYPES.map((t) => (
            <div key={t.id} className={`flex flex-col gap-2 rounded border p-4 ${t.selectable ? "border-neutral-900" : "border-neutral-200"}`}>
              <div className="aspect-square rounded bg-neutral-100" />
              <h3 className="font-semibold">{t.name}</h3>
              <span className="text-xs text-neutral-500">{t.dof}</span>
              <p className="text-xs text-neutral-600">{t.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="guideline" className={`${section} border-t border-neutral-200`}>
        <h2 className="text-3xl font-semibold">{LANDING.guideline.title}</h2>
        <p className="max-w-2xl text-neutral-600">{LANDING.guideline.body}</p>
        <Link href="/lab" className={cta}>{LANDING.guideline.cta}</Link>
      </section>

      <footer className="border-t border-neutral-200 px-8 py-10 text-sm text-neutral-500">
        <div className="mx-auto flex max-w-5xl justify-between">
          <span>{LANDING.footer.line}</span>
          <span>{LANDING.footer.company}</span>
        </div>
      </footer>
    </>
  );
}
