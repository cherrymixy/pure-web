/** "just now" / "5 min ago" / "3 h ago" / "2 days ago" / "Oct 12". */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) {
    const d = Math.floor(s / 86400);
    return `${d} day${d > 1 ? "s" : ""} ago`;
  }
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
