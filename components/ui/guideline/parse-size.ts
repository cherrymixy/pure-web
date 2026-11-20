/** "12°" → [12, 12, "°"], "30–90°" → [30, 90, "°"], "±30° …" → [-30, 30, "°"]; null when the value has no number. */
export function parseSize(value: string): [number, number, string] | null {
  const m = value.replace(/−/g, "-").match(/(±)?\s*([-+]?\d*\.?\d+)(?:\s*–\s*(\d*\.?\d+))?\s*(%|°|×|[a-zA-Z]+)?/);
  if (!m) return null;
  const a = parseFloat(m[2]);
  const unit = m[4] ?? "";
  if (m[1]) return [-Math.abs(a), Math.abs(a), unit];
  return m[3] ? [a, parseFloat(m[3]), unit] : [a, a, unit];
}
