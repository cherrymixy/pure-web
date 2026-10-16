// @implemented
// @screen W00-1
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { LANDING } from "@/data/landing";
import { LandingZoom } from "./_components/landing-zoom";
import { Axes, ChannelCards, TypeCards } from "./_components/landing-cards";

// W00-1 Landing = Figma 901:6909, built in its 960-unit coordinates; LandingZoom scales it to the viewport.
// The prototype frame resolves its space/radius variables at half value → calc(var(--token)/2).
// Line height 1.26 = Figma "auto" for Google Sans Flex (text boxes in 901:6909 are 1.26× their size); CSS "normal" adds the font line gap.

const L = LANDING;
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
      {/* Hero 901:6918 */}
      <section className="relative h-[610px] overflow-clip bg-[var(--bg-canvas)]">
        <img src="/figma/landing/hero-bg.png" alt="" className="absolute left-[-61.5px] top-0 h-[610px] w-[1083px] max-w-none object-cover" />

        <header className="absolute left-[7px] top-[8px] z-10 flex h-[44px] w-[945.5px] items-center justify-between rounded-full border-[0.5px] border-[var(--neutral-0)] bg-[var(--bg-surface)] px-[calc(var(--space-40)/2)]">
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
          <div className="flex items-center gap-[calc(var(--space-48)/2)]">
            <Link href="/lab" className="text-[10px] leading-[1.26] text-[var(--text-link)]">{L.nav.signIn}</Link>
            <Link href="/lab" className="flex h-[28px] w-[75px] items-center justify-center rounded-[calc(var(--radius-md)/2)] bg-[var(--neutral-300)] text-[10px] font-medium leading-[1.26] text-[var(--sage-900)]">
              {L.nav.tryPure}
            </Link>
          </div>
        </header>

        <div className="absolute left-[284px] top-[106px] flex w-[392px] flex-col items-center gap-[calc(var(--space-32)/2)]">
          <p className="rounded-full bg-[var(--neutral-300)] px-[calc(var(--space-20)/2)] py-[calc(var(--space-12)/2)] text-[8px] font-medium leading-[1.26] text-[var(--sage-600)]">{L.hero.badge}</p>
          <h1 className="whitespace-nowrap text-center text-[46px] font-semibold leading-[1.26] text-[var(--sage-800)]">
            <Lines lines={L.hero.headline} />
          </h1>
        </div>

        <div className="absolute left-[439.85px] top-[501.99px] flex h-[59.176px] w-[199.074px] items-center justify-center">
          <div className="relative h-[36.954px] w-[196.132px] rotate-[173.42deg]">
            <img src="/figma/landing/hero-ellipse.svg" alt="" width={201.206} height={42.0278} className="absolute left-[-1.29%] top-[-6.86%] block max-w-none" />
          </div>
        </div>

        <div className="absolute left-[416px] top-[274px] h-[280px] w-[125px] overflow-hidden">
          <img src="/figma/landing/hero-robot.png" alt={L.hero.robotAlt} className="absolute left-[-382.23%] top-[-58.09%] h-[218.87%] w-[866.33%] max-w-none" />
        </div>
      </section>

      {/* Why PURE 901:6971 / 7297 / 7298 */}
      <section id="why" className="h-[340px] px-[120px] pt-[50px]">
        <p className={label}>{L.why.label}</p>
        <div className="mt-[12px] flex gap-[20px]">
          <h2 className="w-[450px] text-[32px] font-semibold leading-[1.26] text-[var(--sage-800)]">
            <Lines lines={L.why.headline} />
          </h2>
          <p className="w-[250px] text-[12px] leading-[1.26] text-[var(--neutral-600)]">{L.why.body}</p>
        </div>
      </section>

      {/* One signature, three channels 901:6972 · cards 901:6973/6989/7009 · axes 901:7032 */}
      <section className="flex h-[440px] flex-col">
        <h2 className="text-center text-[28px] font-semibold leading-[1.26] text-[var(--sage-800)]">{L.channels.title}</h2>
        <div className="mt-[30px] pl-[120px]">
          <ChannelCards />
        </div>
        <div className="mt-[20px] flex justify-center">
          <Axes />
        </div>
      </section>

      {/* Band/Daily 901:7050 */}
      <section className="relative mx-[60px] h-[430px] overflow-clip rounded-[calc(var(--radius-2xl)/2)] bg-[var(--sage-50)] pl-[60px] pt-[65px]">
        <p className={label}>{L.daily.label}</p>
        <h2 className="mt-[12px] w-[390px] text-[24px] font-semibold leading-[1.26] text-[var(--sage-800)]">
          <Lines lines={L.daily.headline} />
        </h2>
        <p className="mt-[23px] w-[300px] text-[11px] leading-[1.26] text-[var(--neutral-600)]">{L.daily.body}</p>
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
        {/* Phone mockups 901:7071 / 901:7093, exported with their 5px outside stroke */}
        <img src="/figma/landing/phone-home@4x.png" alt={L.daily.phoneHomeAlt} className="absolute left-[465px] top-[35px] h-[340px] w-[161.785px] max-w-none" />
        <img src="/figma/landing/phone-playing@4x.png" alt={L.daily.phonePlayingAlt} className="absolute left-[636.785px] top-[58px] h-[340px] w-[161.785px] max-w-none" />
      </section>

      {/* For Expert: Component 6 901:6910 + fade 901:6917 + copy 901:7119–7138 */}
      <section id="expert" className="relative mt-[74px] h-[463px]">
        <img src="/figma/landing/expert-composite@4x.png" alt={L.expert.imageAlt} className="absolute left-0 top-0 h-[463px] w-[960px] max-w-none" />
        <img src="/figma/landing/expert-top-fade.png" alt="" className="absolute left-[-140px] top-0 h-[89px] w-[1101px] max-w-none object-cover" />
        <div className="absolute left-[618px] top-[39px] flex w-[235px] flex-col">
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
          <Link href="/lab" className={`${darkButton} mt-[10px] w-[235px]`}>
            {L.expert.cta}
            <Arrow />
          </Link>
        </div>
      </section>

      {/* Robot types 901:7143 / 7144 · cards 901:7217–7282 */}
      <section id="robot-types" className="mt-[73px] flex h-[405px] flex-col">
        <h2 className="text-center text-[28px] font-semibold leading-[1.26] text-[var(--sage-800)]">{L.robotTypes.title}</h2>
        <p className="mt-[7px] text-center text-[11px] leading-[1.26] text-[var(--neutral-600)]">{L.robotTypes.body}</p>
        <div className="mt-[39px] pl-[120px]">
          <TypeCards />
        </div>
      </section>

      {/* Band/Guideline 901:7145 */}
      <section id="guideline" className="mx-[60px] h-[260px] overflow-clip rounded-[calc(var(--radius-2xl)/2)] bg-[var(--bg-surface)] px-[50px] pt-[41px]">
        <div className="flex">
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
        <Link href="/guideline" className={`${lightButton} mt-[31px] w-[740px]`}>
          {L.guideline.cta}
        </Link>
      </section>

      {/* CTA band 901:7167 */}
      <section className="mx-[60px] mt-[40px] flex h-[110px] justify-between overflow-clip rounded-[calc(var(--radius-2xl)/2)] bg-[var(--sage-800)] px-[40px] pt-[28px]">
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
      <footer className="relative mt-[20px] flex h-[140px] whitespace-nowrap pl-[120px] pt-[20px] leading-[1.26]">
        <div className="w-[380px]">
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
        <p className="absolute left-[120px] top-[110px] text-[7px] text-[var(--text-tertiary)]">{L.footer.copyright}</p>
      </footer>
    </LandingZoom>
  );
}
