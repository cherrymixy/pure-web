import type { ComponentDocSection, FaceTypeFigure } from "@/data/guideline/types";

const F = "/figma/guideline/face";

// Face principle sections — Figma W03-2L "Principle · Face UI" (808:1649), 960 frame ×2.
// Card layouts are ×2 with tokens; illustrations are drawn at Figma coordinates inside `zoom: 2` (as RobotStage).

type Of<K extends string> = Extract<ComponentDocSection, { kind: K }>;

const Z = { zoom: 2 } as const;
const BLACK = "absolute bg-[var(--neutral-1000)]";
const WHITE = "absolute bg-[var(--bg-surface)]";
/** Figma column 808:1667 is 490.66 wide (×2): sections keep that width so the zoomed illustrations line up with their cards */
const COL = "w-full max-w-[981.31px]";

/** Type 808:1671 — four face classes */
export function FaceTypes({ s }: { s: Of<"face-types"> }) {
  return (
    <div className={`${COL} flex gap-[var(--space-20)]`}>
      {s.items.map((it) => (
        <div key={it.title} className="flex min-w-0 flex-1 flex-col gap-[var(--space-16)] rounded-[var(--radius-lg)] border-[0.85px] border-[var(--border-default)] bg-[var(--bg-surface)] p-[var(--space-16)]">
          <div aria-hidden className="relative h-[127.16px] w-[194.98px] shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-canvas)]">
            <div className="absolute left-0 top-0 h-[63.582px] w-[97.492px] overflow-hidden" style={Z}>
              <TypeFigure figure={it.figure} />
            </div>
          </div>
          <div className="flex flex-col gap-[var(--space-8)]">
            <span className="text-[16px] font-bold text-[var(--text-primary)]">{it.title}</span>
            <span className="text-[12px] text-[var(--text-secondary)]">{it.subtitle}</span>
          </div>
          <div className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-xs)] bg-[var(--bg-canvas)] px-[var(--space-12)] py-[var(--space-8)]">
            <span className="text-[10px] font-bold text-[var(--web-3f77a1)]">{s.label}</span>
            <span className="text-[12px] text-[var(--text-link)]">{it.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TypeFigure({ figure }: { figure: FaceTypeFigure }) {
  switch (figure) {
    case "none":
      return <div className={`${BLACK} inset-[20.3%_20.68%_20.46%_20.35%] rounded-[14px]`} />;
    case "light":
      return <img alt="" src={`${F}/type-light.svg`} className="absolute inset-0 block size-full max-w-none" />;
    case "all":
      return <img alt="" src={`${F}/type-all.svg`} className="absolute inset-0 block size-full max-w-none" />;
    case "eyes":
      return (
        <>
          <Fill src="type-eyes-l.svg" inset="inset-[39.8%_56.99%_39.8%_32.63%]" />
          <Fill src="type-eyes-r.svg" inset="inset-[39.8%_32.64%_39.8%_56.98%]" />
          <div className={`${BLACK} inset-[20.3%_20.78%_20.46%_20.25%] rounded-[14px]`} />
          <div className={`${WHITE} inset-[38.22%_37.48%_37.61%_53.37%] rounded-[2px]`} />
          <div className={`${WHITE} inset-[38.22%_53.75%_37.61%_37.1%] rounded-[2px]`} />
        </>
      );
  }
}

/** What is changing? 808:1738 (base → value changes) + Expressions of Positivity and Negativity 808:1766 */
export function FaceChange({ s }: { s: Of<"face-change"> }) {
  const label = "absolute -translate-x-1/2 whitespace-nowrap text-center";
  const v = s.variants;
  return (
    <div className={`${COL} flex flex-col gap-[59.47px]`}>
      <div className="relative h-[254.74px] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--sage-50)]">
        <div className="absolute left-0 top-0 h-[127.372px] w-[490.16px] leading-normal" style={Z}>
          <div className={`${BLACK} left-[31.64px] top-[36.18px] h-[53.985px] w-[82.42px] rounded-[20px]`} />
          <div className={`${WHITE} left-[77.62px] top-[53.39px] h-[19.639px] w-[11.783px] rounded-[4px]`} />
          <div className={`${WHITE} left-[56.06px] top-[53.39px] h-[19.639px] w-[11.783px] rounded-[4px]`} />
          <span className="absolute left-[61.95px] top-[94.66px] whitespace-nowrap text-[9px] font-medium text-[var(--text-primary)]">{s.base}</span>
          <span className={`absolute left-[147.44px] top-[39.65px] w-[43.118px] -translate-x-1/2 text-center text-[7px] font-medium text-[var(--text-primary)]`}>{s.arrow}</span>
          <div className="absolute left-[119.44px] top-[calc(50%+0.25px)] h-0 w-[68.394px] -translate-y-1/2">
            <Fill src="change-arrow.svg" inset="inset-[-2.64px_-0.72%_-2.64px_-3.86%]" />
          </div>
          <div className="absolute left-[187.84px] top-[calc(50%+0.5px)] h-[115.478px] w-[296.376px] -translate-y-1/2 overflow-hidden rounded-[10px] bg-[var(--neutral-300)]">
            {/* Size up */}
            <div className={`${BLACK} left-[36.18px] top-[38.66px] h-[37.666px] w-[57.491px] rounded-[14px]`} />
            {/* tl 4.177 · tr 5.462 · br/bl 4.82; the left eye is the mirror (Figma -scale-y rotate-180) */}
            <div className={`${WHITE} left-[66.95px] top-[48.91px] h-[17.029px] w-[14.459px] rounded-[4.177px_5.462px_4.82px_4.82px]`} />
            <div className={`${WHITE} left-[49.27px] top-[48.91px] h-[17.029px] w-[14.459px] rounded-[5.462px_4.177px_4.82px_4.82px]`} />
            {/* Angle +12° */}
            <div className={`${BLACK} left-[119.94px] top-[38.66px] h-[37.666px] w-[57.491px] rounded-[14px]`} />
            <div className={`${WHITE} left-[150.15px] top-[56.34px] h-[7.39px] w-[13.495px] rounded-[4px]`} />
            <div className="absolute left-[132.7px] top-[51.49px] flex h-[12.077px] w-[14.97px] items-center justify-center">
              <div className="h-[9.96px] w-[13.495px] flex-none rotate-[9.63deg] rounded-[4px] bg-[var(--bg-surface)]" />
            </div>
            {/* Shape half-moon */}
            <img alt="" src={`${F}/change-smile.svg`} className="absolute left-[203.2px] top-[38.66px] block h-[37.666px] w-[57.491px] max-w-none" />
            {v.map((x, i) => (
              <span key={x.caption} className="contents">
                <span className={`${label} top-[82.77px] text-[8px] font-medium text-[var(--text-primary)]`} style={{ left: [66.54, 150.85, 235.74][i] }}>{x.caption}</span>
                <span className={`${label} top-[23.79px] text-[7px] text-[var(--text-secondary)]`} style={{ left: [66.55, 149.78, 233.03][i] }}>{x.emotion}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-[var(--space-24)]">
        <div className="flex w-[498.59px] shrink-0 flex-col gap-[var(--space-24)]">
          <span className="whitespace-nowrap text-[22px] font-medium text-[var(--neutral-700)]">{s.valence.title}</span>
          <ul className="flex flex-col gap-[var(--space-24)]">
            {s.valence.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-[var(--space-12)]">
                <span aria-hidden className="w-0 shrink-0" style={Z}>
                  <span className="relative flex h-[22.798px] w-0 items-center justify-center">
                    <span className="relative h-0 w-[22.798px] flex-none rotate-90">
                      <Fill src={`bullet-${i + 1}.svg`} inset="inset-[-1.49px_0_0_0]" />
                    </span>
                  </span>
                </span>
                <span className="text-[14px] text-[var(--text-secondary)]" style={{ width: [377.66, 428.21][i] }}>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div aria-hidden className="relative h-[222.03px] w-[457.95px] shrink-0 overflow-hidden rounded-[var(--radius-xl)] bg-[var(--sage-50)]">
          <div className="absolute left-0 top-0 h-[111.017px] w-[228.973px] leading-normal" style={Z}>
            <img alt="" src={`${F}/valence-smile.svg`} className="absolute left-[37.17px] top-[13.38px] block h-[37.666px] w-[57.491px] max-w-none" />
            <div className={`${BLACK} left-[134.81px] top-[13.38px] h-[37.666px] w-[57.491px] rounded-[14px]`} />
            <div className="absolute left-[164.13px] top-[31.23px] flex h-[8.13px] w-[13.42px] items-center justify-center">
              <div className="h-[5.65px] w-[12.52px] flex-none rotate-12 rounded-full bg-[var(--bg-surface)]" />
            </div>
            <div className="absolute left-[149.17px] top-[31.23px] flex h-[8.13px] w-[13.42px] items-center justify-center">
              <div className="h-[5.65px] w-[12.52px] flex-none -rotate-12 rounded-full bg-[var(--bg-surface)]" />
            </div>
            <div className="absolute left-[calc(50%+12.64px)] top-[84.75px] flex -translate-x-1/2 items-center gap-[4px]">
              {s.valence.order.map((o, i) => (
                <div key={o} className="flex items-center">
                  <span
                    className={`flex items-center whitespace-nowrap rounded-full px-[8px] py-[4px] text-[7px] text-[var(--text-primary)] ${
                      i ? "h-[18px] border-[0.496px] border-[var(--sage-200)] bg-[var(--sage-100)]" : "h-[16px] bg-[var(--sage-200)]"
                    }`}
                  >
                    {o}
                  </span>
                  {i < s.valence.order.length - 1 && (
                    <span className="relative h-0 w-[5.947px] shrink-0">
                      <Fill src={`order-arrow-${i + 1}.svg`} inset="inset-[-1.32px_-22.22%_-1.32px_-4.17%]" />
                    </span>
                  )}
                </div>
              ))}
            </div>
            <span className="absolute left-[48.17px] top-[87.23px] -translate-x-1/2 whitespace-nowrap text-[7px] text-[var(--text-secondary)]">{s.valence.orderLabel}</span>
            {s.valence.faces.map((f, i) => (
              <span key={f.name} className="absolute top-[54.52px] flex flex-col items-center text-center" style={{ left: [50.06, 147.69][i], width: [31.719, 32.215][i] }}>
                <span className="whitespace-nowrap text-[8px] font-semibold text-[var(--text-primary)]">{f.name}</span>
                <span className="whitespace-nowrap text-[6px] font-medium text-[var(--web-7e7f7f)]">{f.shape}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Rhythm of changing expressions 808:1808 — enter · stay · return curve + hold-loop cards */
export function FaceRhythm({ s }: { s: Of<"face-rhythm"> }) {
  const [enter, stay, back] = s.phases;
  const chip = "flex h-[20px] items-center justify-center rounded-[6px] bg-[var(--bg-surface)] p-[6px] text-[5px] font-bold text-[var(--text-primary)] whitespace-nowrap";
  const head = "text-[7px] font-bold text-[var(--text-primary)] whitespace-nowrap";
  const note = "text-[5px] text-[var(--text-secondary)]";
  const guide = (left: number) => (
    <div className="absolute top-[51.54px] flex h-[60.96px] w-0 items-center justify-center" style={{ left }}>
      <div className="relative h-0 w-[60.96px] flex-none rotate-90">
        <Fill src="rhythm-guide.svg" inset="inset-[-0.5px_0_0_0]" />
      </div>
    </div>
  );
  return (
    <div className={`${COL} flex flex-col gap-[var(--space-20)]`}>
      <div aria-hidden className="relative h-[329.09px] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-canvas)]">
        <div className="absolute left-0 top-0 h-[164.543px] w-[490.16px] leading-normal" style={Z}>
          <div className="absolute inset-[31.33%_23.86%_31.63%_20.63%] bg-gradient-to-b from-[color-mix(in_srgb,var(--web-c5d1d4)_0%,transparent)] to-[color-mix(in_srgb,var(--web-c5d1d4)_44%,transparent)]" />
          <img alt="" src={`${F}/rhythm-base.svg`} className="absolute left-[25.28px] top-[112.08px] block h-[0.848px] w-[439.112px] max-w-none" />
          <img alt="" src={`${F}/rhythm-curve.svg`} className="absolute left-[24.94px] top-[65.67px] block h-[47.263px] w-[440.048px] max-w-none" />
          <div className={`${BLACK} inset-[46.69%_86.76%_37.96%_5.26%] rounded-[10px]`} />
          <div className={`${WHITE} inset-[51.58%_89.15%_42.83%_9.71%] rounded-[2px]`} />
          <div className={`${WHITE} inset-[51.58%_91.24%_42.83%_7.62%] rounded-[2px]`} />
          <div className={`${BLACK} inset-[46.69%_5.27%_37.96%_86.75%] rounded-[10px]`} />
          <div className={`${WHITE} inset-[51.58%_7.65%_42.83%_91.21%] rounded-[2px]`} />
          <div className={`${WHITE} inset-[51.58%_9.74%_42.83%_89.12%] rounded-[2px]`} />
          <img alt="" src={`${F}/rhythm-smile.svg`} className="absolute left-[225.5px] top-[17.84px] block h-[25.256px] w-[39.103px] max-w-none" />
          {guide(373.19)}
          {guide(101.1)}
          <div className="absolute left-[25.77px] top-[111.99px] h-[52.535px] w-[455.963px]">
            <div className="absolute left-0 top-[14.88px] flex w-[80.785px] flex-col items-start gap-[4px]">
              <div className="flex items-start gap-[6px]"><span className={head}>{enter.title}</span><span className={chip}>{enter.time}</span></div>
              <span className={`${note} w-full`}>{enter.note}</span>
            </div>
            <div className="absolute left-[148.68px] top-[14.85px] flex w-[158.1px] flex-col items-center gap-[4px]">
              <div className="flex w-full items-start justify-center gap-[6px]"><span className={head}>{stay.title}</span><span className={chip}>{stay.time}</span></div>
              <span className={`${note} whitespace-nowrap`}>{stay.note}</span>
            </div>
            <div className="absolute left-[352.38px] top-[14.88px] flex w-[86.236px] flex-col items-end gap-[4px]">
              <div className="flex items-start gap-[6px]"><span className={head}>{back.title}</span><span className={chip}>{back.time}</span></div>
              <span className={`${note} whitespace-nowrap`}>{back.note}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-[var(--space-20)]">
        {s.loops.map((l, i) => (
          <div key={l.title} className="relative h-[104.08px] min-w-0 flex-1 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--sage-50)]">
            <div className="absolute left-0 top-0 h-[52.039px] w-[240.372px] leading-normal" style={Z}>
              <img alt="" src={`${F}/loop-${i ? "sad" : "laugh"}.svg`} className="absolute left-[95.16px] top-[8.41px] block h-[10.408px] max-w-none" style={{ width: i ? 130.842 : 131.833 }} />
              <span className="absolute left-[9.68px] top-[9.42px] whitespace-nowrap text-[7px] font-bold text-[var(--text-primary)]">{l.title}</span>
              <div className="absolute top-[26.76px] flex items-center gap-[4px]" style={{ left: i ? 95.16 : 94.66 }}>
                {l.chips.map((c) => (
                  <span key={c} className="flex h-[18.438px] items-center justify-center whitespace-nowrap rounded-[4px] bg-[var(--bg-surface)] p-[6px] text-[5px] font-bold text-[var(--web-7e7f7f)]">{c}</span>
                ))}
              </div>
              <span className="absolute left-[9.91px] top-[26.27px] whitespace-pre text-[5px] text-[var(--text-secondary)]">{l.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** How to Change Expression 808:1873 — TWEEN (similar shapes) / SWAP (different shapes) */
export function FaceTransitions({ s }: { s: Of<"face-transitions"> }) {
  return (
    <div className={`${COL} flex gap-[var(--space-20)]`}>
      {s.items.map((it, i) => (
        <div key={it.title} className="flex min-w-0 flex-1 flex-col items-center gap-[var(--space-12)] rounded-[var(--radius-lg)] border-[0.85px] border-[var(--neutral-150)] bg-[var(--bg-surface)] p-[var(--space-16)]">
          <div className="relative h-[118.95px] w-[436.14px] shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--neutral-300)]">
            <img alt="" src={`${F}/${i ? "swap" : "tween"}.svg`} className="absolute left-0 top-0 block h-[118.95px] w-[436.14px] max-w-none" />
            <span className="absolute top-[85.28px] -translate-x-1/2 whitespace-nowrap text-center text-[14px] font-medium text-[var(--text-on-inverse)]" style={{ left: i ? 226.92 : 225.66 }}>{it.caption}</span>
          </div>
          <div className="flex w-[435.15px] flex-col gap-[var(--space-4)]">
            <span className="text-[16px] font-bold text-[var(--text-primary)]">{it.title}</span>
            <span className="text-[10px] text-[var(--text-secondary)]">{it.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Don't 808:1902 — mixed emotions · irregular tremor · full blink */
export function FaceDonts({ s }: { s: Of<"face-donts"> }) {
  return (
    <div className={`${COL} flex gap-[var(--space-20)]`}>
      {s.items.map((it, i) => (
        <div key={it.title} className="flex min-w-0 flex-1 flex-col gap-[var(--space-12)] rounded-[var(--radius-lg)] border-[0.86px] border-[var(--neutral-150)] bg-[var(--bg-surface)] p-[var(--space-20)]">
          <div aria-hidden className={`relative h-[128.6px] w-[279.49px] shrink-0 overflow-hidden rounded-[var(--radius-sm)] ${i ? "bg-[var(--neutral-150)]" : "bg-[var(--neutral-400)]"}`}>
            <div className="absolute left-0 top-0 h-[64.299px] w-[139.743px] leading-normal" style={Z}>
              {i === 0 && <DontMix />}
              {i === 1 && <DontTremble />}
              {i === 2 && <DontBlink labels={s.blinkLabels} />}
            </div>
          </div>
          <span className="text-[16px] font-bold text-[var(--red-500)]">{it.title}</span>
          <span className="text-[10px] text-[var(--text-secondary)]">{it.text}</span>
        </div>
      ))}
    </div>
  );
}

function DontMix() {
  return (
    <>
      <div className="absolute inset-0 bg-[var(--neutral-150)]">
        <div className={`${BLACK} inset-[20.68%_29.48%_20.74%_29.38%] rounded-[14px]`} />
      </div>
      <div className="absolute inset-[36.99%_40.02%_39.46%_40.32%]">
        <Fill src="dont-mix.svg" inset="inset-[-16.61%_-6.75%_-7.41%_-6.75%]" />
      </div>
    </>
  );
}

/** Tremble marks 808:1920…1923: horizontal svgs turned upright. [x, y, w, h, file, transform, overshoot] */
const TREMBLE = [
  [35.672, 39.568, 1.982, 14.868, 1, "-rotate-90", "inset-[-18.75%_-2.5%]"],
  [104.067, 24.699, 1.982, 14.868, 2, "rotate-90", "inset-[-18.75%_-2.5%]"],
  [108.032, 27.673, 0.991, 8.921, 3, "rotate-90", "inset-[-37.5%_-4.17%]"],
  [31.708, 27.673, 0.991, 8.921, 4, "-rotate-90 -scale-x-100", "inset-[-37.5%_-4.17%]"],
] as const;

function DontTremble() {
  return (
    <>
      <div className={`${BLACK} inset-[20.68%_29.43%_20.74%_29.43%] rounded-[14px]`} />
      <div className={`${WHITE} inset-[38.41%_41.08%_37.69%_52.54%] rounded-[2px]`} />
      <div className={`${WHITE} inset-[38.41%_52.43%_37.69%_41.19%] rounded-[2px]`} />
      {TREMBLE.map(([x, y, w, h, n, t, inset]) => (
        <div key={n} className="absolute flex items-center justify-center" style={{ left: x, top: y, width: w, height: h }}>
          <div className={`relative flex-none ${t}`} style={{ width: h, height: w }}>
            <Fill src={`tremble-${n}.svg`} inset={inset} />
          </div>
        </div>
      ))}
    </>
  );
}

function DontBlink({ labels }: { labels: [string, string] }) {
  const text = "absolute top-[46.03px] whitespace-nowrap text-center text-[7px] font-medium text-[var(--text-primary)]";
  return (
    <>
      <div className={`${BLACK} left-[84.81px] top-[29.18px] h-[12.886px] w-[27.288px] rounded-full`} />
      <div className={`${BLACK} left-[27.82px] top-[39.04px] h-[3.032px] w-[30.32px] rounded-full`} />
      <span className={`${text} left-[34.26px]`}>{labels[0]}</span>
      <span className={`${text} left-[91.75px]`}>{labels[1]}</span>
      {/* ✕ 808:1935 / ✓ 808:1936 — siblings of the column in Figma, placed here at the same spot */}
      <div className="absolute left-[34.3px] top-[16.66px] h-[5.758px] w-[6.001px]">
        <Fill src="blink-no.svg" inset="inset-[-24.34%_-23.35%]" />
      </div>
      <div className="absolute left-[89.95px] top-[16.24px] h-[5.758px] w-[8.573px]">
        <Fill src="blink-ok.svg" inset="inset-[-24.34%_-16.35%_-17.22%_-16.35%]" />
      </div>
    </>
  );
}

/** Figma vector wrapper: the svg box overshoots its frame by the stroke (inset), the img fills it. */
function Fill({ src, inset }: { src: string; inset: string }) {
  return (
    <div className={`absolute ${inset}`}>
      <img alt="" src={`${F}/${src}`} className="block size-full max-w-none" />
    </div>
  );
}
