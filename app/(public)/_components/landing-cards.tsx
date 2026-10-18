/* eslint-disable @next/next/no-img-element */
import { LANDING } from "@/data/landing";
import { googleSansCode } from "./landing-fonts";

// Landing cards, in Figma's 960-unit coordinates (see landing-zoom.tsx). The prototype frame resolves its
// space/radius variables at half value, so bound tokens are written as calc(var(--token)/2).

const C = LANDING.channels;

function ChannelCard({ icon, title, body, children }: { icon: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="flex h-[210px] min-w-0 flex-1 flex-col overflow-clip rounded-[calc(var(--radius-xl)/2)] bg-[var(--bg-surface)] p-[18px]">
      <div className="flex size-[28px] items-center justify-center rounded-full bg-[var(--sage-50)]">
        <img src={icon} alt="" width={13} height={13} className="block size-[13px]" />
      </div>
      <p className="mt-[12px] text-[16px] font-semibold leading-[1.26] text-[var(--sage-800)]">{title}</p>
      <p className="mt-[4px] h-[26px] text-[10px] leading-[1.26] text-[var(--sage-500)]">{body}</p>
      <div className="mt-[12px] h-[75px] overflow-clip rounded-[calc(var(--radius-lg)/2)] bg-[var(--bg-canvas)]">
        {/* Figma's 184 × 75 visual, centred in the wider card */}
        <div className="relative mx-auto h-full w-[184px]">{children}</div>
      </div>
    </div>
  );
}

// Sound waveform bars (Figma 901:7018–7031): left, top, height inside the 184×75 visual.
const BARS: [number, number, number][] = [
  [20, 30, 15], [30.5, 22.5, 30], [41, 15, 45], [51.5, 25, 25], [62, 10, 55], [72.5, 20, 35], [83, 27.5, 20],
  [93.5, 13.5, 48], [104, 21.5, 32], [114.5, 30, 15], [125, 24.5, 26], [135.5, 17.5, 40], [146, 27.5, 20], [156.5, 31.5, 12],
];

export function ChannelCards() {
  return (
    <div className="flex gap-[20px]">
      <ChannelCard icon="/figma/landing/icon-motion.svg" title={C.motion.title} body={C.motion.body}>
        <div className="flex flex-col gap-[9px] p-[10px] text-[9px] leading-[1.26]">
          {C.motion.rows.map((r) => (
            <div key={r.token} className="flex">
              <span className={`${googleSansCode.className} w-[65px] font-medium text-[var(--sage-800)]`}>{r.token}</span>
              <span className="w-[45px] text-[var(--sage-500)]">{r.value}</span>
              <span className="text-[var(--sage-500)]">{r.use}</span>
            </div>
          ))}
        </div>
      </ChannelCard>

      <ChannelCard icon="/figma/landing/icon-face.svg" title={C.face.title} body={C.face.body}>
        {/* Basic eyes (901:7005) */}
        <div className="absolute left-[23px] top-[10px] h-[41.651px] w-[63.59px] rounded-[calc(var(--radius-xl)/2)] bg-[var(--neutral-1000)]" />
        <div className="absolute left-[41.84px] top-[23.28px] h-[15.152px] w-[9.091px] rounded-[calc(var(--radius-xs)/2)] bg-[var(--bg-surface)]" />
        <div className="absolute left-[58.48px] top-[23.28px] h-[15.152px] w-[9.091px] rounded-[calc(var(--radius-xs)/2)] bg-[var(--bg-surface)]" />
        {/* Size Up eyes (901:7001) */}
        <div className="absolute left-[98.43px] top-[10px] h-[41.651px] w-[63.573px] rounded-[calc(var(--radius-xl)/2)] bg-[var(--neutral-1000)]" />
        <div className="absolute left-[112.9px] top-[21.34px] h-[18.83px] w-[15.988px] -scale-x-100 rounded-[4.619px_6.04px_5.329px_5.329px] bg-[var(--bg-surface)]" />
        <div className="absolute left-[132.45px] top-[21.34px] h-[18.83px] w-[15.988px] rounded-[4.619px_6.04px_5.329px_5.329px] bg-[var(--bg-surface)]" />
        <p className="absolute left-[45px] top-[55.83px] text-[8px] leading-[1.26] text-[var(--sage-500)]">{C.face.basic}</p>
        <p className="absolute left-[116px] top-[55.83px] text-[8px] leading-[1.26] text-[var(--sage-500)]">{C.face.sizeUp}</p>
      </ChannelCard>

      <ChannelCard icon="/figma/landing/icon-sound.svg" title={C.sound.title} body={C.sound.body}>
        {BARS.map(([left, top, height]) => (
          <div key={left} className="absolute w-[5px] rounded-full bg-[var(--sage-800)]" style={{ left, top, height }} />
        ))}
      </ChannelCard>
    </div>
  );
}

export function Axes() {
  return (
    <div className="flex items-center gap-[calc(var(--space-12)/2)]">
      <p className="text-[9px] font-medium leading-[1.26] text-[var(--sage-500)]">{C.axesLabel}</p>
      {C.axes.map((a) => (
        <span key={a} className="rounded-[calc(var(--radius-lg)/2)] bg-[var(--bg-surface)] px-[calc(var(--space-20)/2)] py-[calc(var(--space-12)/2)] text-[9px] leading-[1.26] text-[var(--sage-800)]">
          {a}
        </span>
      ))}
    </div>
  );
}

// Robot type art per card (Figma 901:7217 … 901:7282): image frame box + source crop, as get_design_context gives it.
type Crop = { src: string; frame: React.CSSProperties; img: React.CSSProperties };
const TYPE_ART: Record<string, { box: React.CSSProperties; crop: Crop; muted?: boolean; extra?: React.ReactNode }> = {
  "jointless-driving": {
    box: { left: 0, width: 134.204, height: 134.204 },
    crop: { src: "/figma/landing/type-jointless-driving.png", frame: { left: 20.58, top: 24.7, width: 93.449, height: 84.804 }, img: { left: "-8.27%", top: "-28.32%", width: "118.64%", height: "156.09%" } },
    extra: <div className="absolute left-[40.91px] top-[47.47px] h-[23.241px] w-[35.584px] bg-[var(--bg-surface)]" />,
  },
  "joint-driving": {
    box: { left: 0.45, width: 134.204, height: 134.204 },
    crop: { src: "/figma/landing/type-joint-driving.png", frame: { left: 14.41, top: 8.23, width: 105.799, height: 125.971 }, img: { left: 0, top: 0, width: "100%", height: "100%", objectFit: "cover" } },
  },
  "joint-fixed": {
    muted: true,
    box: { left: -0.35, width: 134.616, height: 134.204 },
    crop: { src: "", frame: {}, img: {} },
  },
  "joint-walking": {
    box: { left: 0.27, width: 134.204, height: 134.204 },
    crop: { src: "/figma/landing/type-joint-walking.png", frame: { left: 14.82, top: 23.47, width: 105.799, height: 97.565 }, img: { left: "-0.14%", top: "-17.74%", width: "100.28%", height: "128.84%" } },
  },
  "full-body": {
    box: { left: -0.6, width: 134.616, height: 134.616 },
    crop: { src: "/figma/landing/type-full-body.png", frame: { left: 1.24, top: -0.41, width: 133.381, height: 134.616 }, img: { left: "-0.15%", top: "-0.18%", width: "100.09%", height: "148.76%" } },
  },
};

function CropImage({ crop, alt }: { crop: Crop; alt: string }) {
  return (
    <div className="absolute overflow-hidden" style={crop.frame}>
      <img src={crop.src} alt={alt} className="absolute max-w-none" style={crop.img} />
    </div>
  );
}

const R = LANDING.robotTypes;

function TypeCard({ card }: { card: (typeof R.cards)[number] }) {
  const art = TYPE_ART[card.id];
  const { left = 0, width, height } = art.box;
  return (
    // Cards share the row width; the Figma art (box + crop, ~134 wide) stays centred in the full-width image band.
    <div className="relative h-[247px] min-w-0 flex-1 overflow-clip rounded-[calc(var(--radius-xl)/2)] bg-[var(--bg-surface)]">
      <div className="absolute inset-x-0 top-0 bg-[var(--sage-50)]" style={{ height }} />
      <div className="absolute top-0" style={{ left: `calc(50% - ${Number(width) / 2}px + ${left}px)`, width, height }}>
        <div className="absolute inset-0 overflow-clip">
          {art.extra}
          {art.crop.src && <CropImage crop={art.crop} alt={card.name} />}
        </div>
        {card.id === "joint-fixed" && (
          // Overlay frame 901:7263: arm robot crop + its two eye highlights, overhanging the image box.
          <div className="absolute left-[34.58px] top-[-11.94px] h-[140.379px] w-[67.925px] overflow-clip">
            <div className="absolute left-0 top-[5.35px] h-[135.027px] w-[61.339px] overflow-hidden">
              <img src="/figma/landing/type-joint-fixed.png" alt={card.name} className="absolute left-[-101.32%] top-0 h-[223.33%] w-[395.58%] max-w-none" />
            </div>
            <div className="absolute left-[30.05px] top-[37.46px] h-[11.938px] w-[6.175px] rounded-[calc(var(--radius-2xs)/2)] bg-[var(--bg-surface)]" />
            <div className="absolute left-[18.94px] top-[37.46px] h-[11.938px] w-[6.175px] rounded-[calc(var(--radius-2xs)/2)] bg-[var(--bg-surface)]" />
          </div>
        )}
      </div>
      <div className="absolute left-[11.76px] top-[143.67px] flex flex-col whitespace-nowrap leading-[1.26]">
        <p className="text-[12px] font-semibold text-[var(--sage-800)]">{card.name}</p>
        <p className={`mt-[2.3px] text-[7px] ${art.muted ? "text-[var(--text-tertiary)]" : "text-[var(--sage-500)]"}`}>{card.description}</p>
        <p className="mt-[17px] text-[6px] text-[var(--text-tertiary)]">{R.jointsLabel}</p>
        <p className="mt-[0.4px] text-[7px] font-medium text-[var(--sage-800)]">{card.joints}</p>
        <p className="mt-[8.6px] text-[6px] text-[var(--text-tertiary)]">{R.channelsLabel}</p>
        <div className="mt-[2.1px] flex gap-[calc(var(--space-8)/2)]">
          {R.channels.map((ch) => (
            <span key={ch} className="rounded-full bg-[var(--bg-canvas)] px-[calc(var(--space-8)/2)] py-[calc(var(--space-4)/2)] text-[5px] leading-[1.26] text-[var(--text-secondary)]">
              {ch}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TypeCards() {
  return (
    <div className="flex w-full gap-[12px]">
      {R.cards.map((c) => (
        <TypeCard key={c.id} card={c} />
      ))}
    </div>
  );
}
