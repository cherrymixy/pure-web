import type { GuidelineSearchItem } from "@/data/guideline";

// Guideline-wide search for the doc page search box (Figma 808:1580).

const MAX_RESULTS = 8;

/** null = empty query. Title hits first, then text hits, then words within one typo (query words of 4+ letters). */
export function searchGuideline(index: GuidelineSearchItem[], query: string): GuidelineSearchItem[] | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const words = q.split(/\s+/);
  const rank = (it: GuidelineSearchItem) => {
    if (it.title.toLowerCase().includes(q)) return 0;
    if (words.every((w) => it.text.includes(w))) return 1;
    const vocab = it.text.split(/[^a-z0-9]+/);
    if (words.every((w) => it.text.includes(w) || (w.length >= 4 && vocab.some((v) => withinOne(w, v))))) return 2;
    return -1;
  };
  return index
    .map((it) => ({ it, r: rank(it) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r)
    .slice(0, MAX_RESULTS)
    .map((x) => x.it);
}

/** Edit distance ≤ 1, or a typo inside a longer word's prefix ("approacj" ~ "approach"). */
function withinOne(a: string, b: string): boolean {
  if (b.length > a.length + 1) b = b.slice(0, a.length);
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}
