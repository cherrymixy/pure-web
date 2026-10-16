import type { Channel } from "@/lib/models";
import { Icon, type IconName } from "@/components/ui/icons/icon";

const LABEL: Record<Channel, string> = { motion: "Motion", face: "Face", sound: "Sound" };
// Same channel glyphs as the lab-home cards (Figma 901:8309).
const ICON: Record<Channel, IconName> = { motion: "running-round", face: "smile-square", sound: "volume-loud" };

// Channel icons on cards: used channels in icon/primary, unused dimmed.
export function ChannelBadges({ channels }: { channels: Channel[] }) {
  return (
    <div className="flex shrink-0 items-center gap-[var(--space-8)]">
      {(["motion", "face", "sound"] as Channel[]).map((c) => (
        <span key={c} title={LABEL[c]} className={channels.includes(c) ? "text-[var(--icon-primary)]" : "text-[var(--neutral-300)]"}>
          <Icon name={ICON[c]} size={18} label={LABEL[c]} />
        </span>
      ))}
    </div>
  );
}

export const CHANNEL_LABEL = LABEL;
