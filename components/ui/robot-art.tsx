/* eslint-disable @next/next/no-img-element */
import type { ArtLayer, ArtShadow, Box, RobotArt } from "@/data/lab-showcase";

const at = ([left, top, width, height]: Box) => ({ left, top, width, height });

function Shadow({ s }: { s: ArtShadow }) {
  const [y, x] = s.bleed;
  return (
    <div className="absolute" style={at(s.box)}>
      <div className="absolute" style={{ inset: `-${y}% -${x}%` }}>
        <img src={s.src} alt="" className="block size-full max-w-none" />
      </div>
    </div>
  );
}

function Robot({ r, alt }: { r: ArtLayer; alt: string }) {
  const fit = typeof r.crop === "string";
  return (
    <div className="absolute overflow-hidden" style={{ ...at(r.box), transform: r.flip ? "scaleX(-1)" : undefined }}>
      <img
        src={r.src}
        alt={alt}
        className={`absolute max-w-none ${fit ? `inset-0 size-full ${r.crop === "cover" ? "object-cover" : "object-contain"}` : ""}`}
        style={fit ? undefined : { left: `${r.crop[0]}%`, top: `${r.crop[1]}%`, width: `${r.crop[2]}%`, height: `${r.crop[3]}%` }}
      />
    </div>
  );
}

/** Robot cut-out + floor shadow placed with Figma px (data/lab-showcase.ts). Parent must be `relative overflow-hidden`. */
export function RobotArtLayers({ art, alt = "" }: { art: RobotArt; alt?: string }) {
  const { shadow, patch, robot, shadowOnTop } = art;
  return (
    <>
      {shadow && !shadowOnTop && <Shadow s={shadow} />}
      {patch && (
        <div className="absolute flex items-center justify-center" style={at(patch.box)}>
          <div className="bg-[var(--neutral-0)]" style={{ width: patch.w, height: patch.h, transform: `rotate(${patch.rotate}deg)` }} />
        </div>
      )}
      <Robot r={robot} alt={alt} />
      {shadow && shadowOnTop && <Shadow s={shadow} />}
    </>
  );
}
