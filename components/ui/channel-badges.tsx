import type { Channel } from "@/lib/models";

const LABEL: Record<Channel, string> = { motion: "Motion", face: "Face", sound: "Sound" };

// Channel icons on cards (gray-box: text badges).
export function ChannelBadges({ channels }: { channels: Channel[] }) {
  return (
    <div className="flex gap-1">
      {(["motion", "face", "sound"] as Channel[]).map((c) => (
        <span
          key={c}
          title={LABEL[c]}
          className={`rounded border px-1.5 text-xs ${channels.includes(c) ? "border-neutral-700 text-neutral-900" : "border-neutral-200 text-neutral-300"}`}
        >
          {LABEL[c][0]}
        </span>
      ))}
    </div>
  );
}

export const CHANNEL_LABEL = LABEL;
