import { ICONS, type IconName } from "./registry";

/**
 * Figma icons (F / Icon: Material Symbols Round, 24px default). Color comes from the text color —
 * use icon tokens, e.g. className="text-icon-primary". `size` sets the width; height keeps the ratio.
 */
export function Icon({ name, size, className, label }: { name: IconName; size?: number; className?: string; label?: string }) {
  const icon = ICONS[name];
  const width = size ?? icon.width;
  const height = (width / icon.width) * icon.height;
  return (
    <svg
      width={width}
      height={height}
      viewBox={icon.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
}

export type { IconName };
export { ICONS };
