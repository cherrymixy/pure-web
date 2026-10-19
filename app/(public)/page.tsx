// @implemented
// @screen W00-1
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { LANDING } from "@/data/landing";
import { HeroRobot } from "./_components/hero-robot";
import { LandingZoom } from "./_components/landing-zoom";
import { Axes, ChannelCards, TypeCards } from "./_components/landing-cards";

// W00-1 Landing = Figma 901:6909, built in its 960-unit coordinates; LandingZoom scales it to the viewport.
// The prototype frame resolves its space/radius variables at half value → calc(var(--token)/2).
// Landing scale (--landing-scale, between full size and the app's 0.67): the background images (hero, For Expert photo) keep filling the width; everything on
// them shrinks in place (CSS scale around a Figma anchor, layout untouched), and the plain sections in between
// shrink as centred 960 columns (`column` = zoom, so their height shrinks too).
// Line height 1.26 = Figma "auto" for Google Sans Flex (text boxes in 901:6909 are 1.26× their size); CSS "normal" adds the font line gap.

const L = LANDING;
const column = "mx-auto w-[960px] [zoom:var(--landing-scale)]";
const label = "text-[8px] font-medium leading-[1.26] text-[var(--sage-500)]";
const darkButton = "flex h-[30px] items-center justify-center gap-[calc(var(--space-8)/2)] rounded-[calc(var(--radius-md)/2)] bg-[var(--sage-800)] px-[calc(var(--space-28)/2)] text-[10px] font-medium leading-[1.26] text-[var(--text-on-inverse)]";
const lightButton = "flex h-[30px] items-center justify-center gap-[calc(var(--space-8)/2)] rounded-[calc(var(--radius-md)/2)] bg-[var(--neutral-300)] px-[calc(var(--space-28)/2)] text-[10px] font-medium leading-[1.26] text-[var(--sage-800)]";

function Arrow({ dark = false }: { dark?: boolean }) {
  return <img src={dark ? "/figma/landing/icon-arrow-dark.svg" : "/figma/landing/icon-arrow-light.svg"} alt="" width={9} height={9} className="block" />;
}

function Lines({ lines }: { lines: readonly string[] }) {
  return lines.map((l) => (
    <span key={l} className="block">
      {l}
    </span>
  ));
}

export default function Page() {
  return (
    <LandingZoom>
      {/* Top bar (950:2874): full width at any scale, stays on screen while scrolling. Figma size (no landing scale), full-value space/radius. Pill Try PURE, right padding 11 (concentric 6 + 5 by user review). */}
      <div className="sticky top-[8px] z-50 h-0">
        <div className="absolute left-[var(--space-24)] right-[var(--space-24)] top-0">
          <header className="flex h-[44px] w-full items-center justify-between rounded-full border-[0.5px] border-[var(--neutral-0)] bg-[var(--bg-surface)] pl-[var(--space-20)] pr-[11px]">
            <div className="flex w-[130px] items-center">
              <Link href="/" aria-label={L.nav.logoAlt}>
                <img src="/figma/landing/logo-mark.svg" alt={L.nav.logoAlt} width={14.9999} height={14.9997} className="block" />
              </Link>
            </div>
            <nav className="flex items-center gap-[26px] whitespace-nowrap text-[10px] leading-[1.26] text-[var(--text-link)]">
              {L.nav.items.map((n) => (
                <a key={n.href} href={n.href}>{n.label}</a>
              ))}
            </nav>
            <div className="flex items-center gap-[var(--space-20)]">
              <Link href="/lab" className="text-[10px] leading-[1.26] text-[var(--text-link)]">{L.nav.signIn}</Link>
              <Link href="/lab" className="flex h-[32px] w-[75px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--neutral-300)] text-[10px] font-medium leading-[1.26] text-[var(--sage-900)]">
                {L.nav.tryPure}
              </Link>
            </div>
          </header>
        </div>
      </div>

      {/* Hero 950:2872 at Figma size (no landing scale). The first screen shows its top 485; the section keeps the
          full 610 background so scrolling reveals the robot's base and floor. */}
      <section className="relative h-[610px] overflow-clip bg-[var(--bg-canvas)]">
        <img src="/figma/landing/hero-bg.png" alt="" className="absolute left-[-61.5px] top-0 h-[610px] w-[1083px] max-w-none object-cover" />

        <div className="absolute inset-0">
          <div className="absolute left-[calc(50%+0.42px)] top-[94px] z-[1] flex w-[346.848px] -translate-x-1/2 flex-col items-center gap-[17.696px]">
            {/* Badge 950:2927: neutral/300 at 20%, white 0.885 border (user spec). */}
            <p className="rounded-[883.932px] border-[0.885px] border-[var(--neutral-0)] bg-[color-mix(in_srgb,var(--neutral-300)_20%,transparent)] px-[13.272px] py-[7.079px] text-[10.618px] font-medium leading-[1.26] text-[var(--sage-600)]">{L.hero.badge}</p>
            <h1 className="whitespace-nowrap text-center text-[40.702px] font-semibold leading-[1.1] text-[var(--sage-800)]">
              <Lines lines={L.hero.headline} />
            </h1>
          </div>

          {/* Robot (Figma render 417.56, 252, 122.65 × 273 → live sim, head follows the pointer). Box origin = robot centre on the floor. */}
          <HeroRobot label={L.hero.robotAlt} className="absolute left-[238.9px] top-[200px] h-[400px] w-[480px] origin-[240px_320px] [scale:var(--hero-robot-scale)]" />
        </div>
      </section>

      <div className={column}>
      {/* Why PURE 901:6971 / 7297 / 7298 */}
      <section id="why" className="h-[390px] px-[48px] pt-[100px]">
        <p className={label}>{L.why.label}</p>
        <div className="mt-[12px] flex justify-between gap-[20px]">
          <h2 className="w-[450px] text-[32px] font-semibold leading-[1.26] text-[var(--sage-800)]">
            <Lines lines={L.why.headline} />
          </h2>
          <p className="w-[250px] text-[12px] leading-[1.26] text-[var(--neutral-600)]">{L.why.body}</p>
        </div>
      </section>

      {/* One signature, three channels 901:6972 · cards 901:6973/6989/7009 · axes 901:7032 */}
      <section className="flex h-[440px] flex-col">
        <h2 className="text-center text-[28px] font-semibold leading-[1.26] text-[var(--sage-800)]">{L.channels.title}</h2>
        <div className="mt-[30px] px-[48px]">
          <ChannelCards />
        </div>
        <div className="mt-[20px] flex justify-center">
          <Axes />
        </div>
      </section>

      {/* Band/Daily 901:7050 */}
      <section className="relative mx-[8px] h-[430px] overflow-clip rounded-[calc(var(--radius-2xl)/2)] bg-[var(--sage-50)] pl-[40px] pt-[65px]">
        <p className={label}>{L.daily.label}</p>
        <h2 className="mt-[12px] w-[390px] text-[24px] font-semibold leading-[1.26] text-[var(--sage-800)]">
          <Lines lines={L.daily.headline} />
        </h2>
        <p className="mt-[23px] w-[300px] whitespace-pre-line text-[11px] leading-[1.26] text-[var(--neutral-600)]">{L.daily.body}</p>
        <ul className="mt-[43px] flex flex-col gap-[5px]">
          {L.daily.points.map((p) => (
            <li key={p} className="flex h-[13px] items-center gap-[calc(var(--space-12)/2)] text-[10px] leading-[1.26] text-[var(--sage-800)]">
              <img src="/figma/landing/icon-check.svg" alt="" width={10} height={10} className="block" />
              {p}
            </li>
          ))}
        </ul>
        <Link href="/lab" className={`${darkButton} mt-[25px] w-[340px]`}>
          {L.daily.cta}
          <Arrow />
        </Link>
        {/* Phone mockups (user export, Band frames 2147240559 / 2147240560): both centred in the 430 band, so their ends line up */}
        <img src="/figma/landing/phone-home-v2.png" alt={L.daily.phoneHomeAlt} className="absolute left-[569px] top-[45px] h-[340px] w-[162px] max-w-none" />
        <img src="/figma/landing/phone-playing-v2.png" alt={L.daily.phonePlayingAlt} className="absolute left-[740.785px] top-[45px] h-[340px] w-[163px] max-w-none" />
      </section>

      </div>

      {/* For Expert: Component 6 901:6910 + fade 901:6917 + copy 901:7119–7138 */}
      <section id="expert" className="relative mt-[calc(74px*var(--landing-scale))] h-[463px]">
        <img src="/figma/landing/expert-composite@4x.png" alt={L.expert.imageAlt} className="absolute left-0 top-0 h-[463px] w-[960px] max-w-none" />
        <img src="/figma/landing/expert-top-fade.png" alt="" className="absolute left-[-140px] top-0 h-[89px] w-[1101px] max-w-none object-cover" />
        <div className="absolute left-[628px] top-[39px] flex w-[235px] origin-top-left flex-col [scale:var(--landing-scale)]">
          <p className={label}>{L.expert.label}</p>
          <h2 className="mt-[12px] w-[230px] text-[26px] font-semibold leading-[1.26] text-[var(--sage-800)]">{L.expert.headline}</h2>
          <ol className="mt-[30px] flex flex-col gap-[calc(var(--space-12)/2)]">
            {L.expert.steps.map((s, i) => (
              <li key={s} className="flex items-center gap-[calc(var(--space-16)/2)] whitespace-nowrap text-[10px] leading-[1.26] text-[var(--sage-800)]">
                <span className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-[var(--sage-800)] text-[8px] font-medium text-[var(--text-on-inverse)]">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <Link href="/lab" className={`${darkButton} mt-[30px] w-[235px]`}>
            {L.expert.cta}
            <Arrow />
          </Link>
        </div>
      </section>

      <div className={column}>
      {/* Robot types 901:7143 / 7144 · cards 901:7217–7282 */}
      <section id="robot-types" className="mt-[73px] flex h-[405px] flex-col">
        <h2 className="text-center text-[28px] font-semibold leading-[1.26] text-[var(--sage-800)]">{L.robotTypes.title}</h2>
        <p className="mt-[7px] text-center text-[11px] leading-[1.26] text-[var(--neutral-600)]">{L.robotTypes.body}</p>
        <div className="mt-[39px] px-[48px]">
          <TypeCards />
        </div>
      </section>

      {/* Band/Guideline 901:7145 */}
      <section id="guideline" className="mx-[8px] overflow-clip rounded-[calc(var(--radius-2xl)/2)] bg-[var(--bg-surface)] px-[40px] py-[41px]">
        <div className="flex justify-between">
          <div className="w-[350px]">
            <p className={label}>{L.guideline.label}</p>
            <h2 className="mt-[10px] w-[300px] text-[26px] font-semibold leading-[1.26] text-[var(--sage-800)]">
              <Lines lines={L.guideline.headline} />
            </h2>
            <p className="mt-[11px] w-[280px] text-[11px] leading-[1.26] text-[var(--neutral-600)]">{L.guideline.body}</p>
          </div>
          <div className="mt-[24px] grid grid-cols-[190px_190px] gap-[10px]">
            {L.guideline.tokens.map((t) => (
              <div key={t.token} className="flex h-[46px] justify-between overflow-clip rounded-[calc(var(--radius-lg)/2)] bg-[var(--bg-canvas)] px-[12px] leading-[1.26]">
                <div className="pt-[9px]">
                  <p className="text-[11px] font-medium text-[var(--sage-800)]">{t.token}</p>
                  <p className="mt-[3px] text-[9px] text-[var(--sage-500)]">{t.use}</p>
                </div>
                <p className="pt-[12px] text-[17px] font-semibold text-[var(--sage-800)]">{t.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band 901:7167 */}
      <section className="mx-[8px] mt-[40px] flex h-[110px] justify-between overflow-clip rounded-[calc(var(--radius-2xl)/2)] bg-[var(--sage-800)] px-[40px] pt-[28px]">
        <div className="whitespace-nowrap leading-[1.26]">
          <h2 className="text-[24px] font-semibold text-[var(--text-on-inverse)]">{L.cta.headline}</h2>
          <p className="mt-[6px] text-[11px] text-[var(--sage-200)]">{L.cta.body}</p>
        </div>
        <Link href="/lab" className={`${lightButton} mt-[12px] w-[100px]`}>
          {L.cta.button}
          <Arrow dark />
        </Link>
      </section>

      {/* Footer 901:7175 */}
      <footer className="relative mt-[60px] flex h-[140px] whitespace-nowrap px-[48px] pt-[20px] leading-[1.26]">
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-[var(--sage-800)]">{L.footer.brand}</p>
          <p className="mt-[4px] text-[8px] text-[var(--sage-500)]">{L.footer.tagline}</p>
        </div>
        {L.footer.columns.map((col) => (
          <div key={col.title} className="flex w-[110px] flex-col text-[8px]">
            <p className="font-medium text-[var(--sage-800)]">{col.title}</p>
            <div className="mt-[8px] flex flex-col gap-[5px] text-[var(--sage-500)]">
              {col.links.map((l) =>
                l.href ? (
                  l.href.startsWith("#") ? <a key={l.label} href={l.href}>{l.label}</a> : <Link key={l.label} href={l.href}>{l.label}</Link>
                ) : (
                  <span key={l.label}>{l.label}</span>
                ),
              )}
            </div>
          </div>
        ))}
        <p className="absolute left-[48px] top-[110px] text-[7px] text-[var(--text-tertiary)]">{L.footer.copyright}</p>
      </footer>
      </div>
    </LandingZoom>
  );
}
