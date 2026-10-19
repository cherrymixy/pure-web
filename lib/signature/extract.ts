import fs from "node:fs/promises";
import zlib from "node:zlib";
import * as cheerio from "cheerio";
import pdf from "pdf-parse/lib/pdf-parse.js";
import { MIN_TEXT_CHARS, SignatureError } from "./errors";

/** What a brand source yields. `page` is the PDF page, or the section number for a URL. */
export interface Extracted {
  kind: "pdf" | "url";
  name: string;
  pages: { page: number; text: string }[];
  fonts: string[];
  colors: string[];
  pageCount: number;
}

const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("").toUpperCase();

/** Top colors by frequency, without pure greys/black/white (text and page furniture). */
export function topColors(counts: Map<string, number>, n = 5): string[] {
  return [...counts.entries()]
    .filter(([hex]) => !(hex.slice(1, 3) === hex.slice(3, 5) && hex.slice(3, 5) === hex.slice(5, 7)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([hex]) => hex);
}

function bump(counts: Map<string, number>, hex: string) {
  counts.set(hex, (counts.get(hex) ?? 0) + 1);
}

/** Font names written in the text ("Typeface: Purebot Sans"), which embedded fonts often hide. */
export function fontsFromText(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\b(?:Typeface|Font|Primary font|Secondary font)s?\s*[:\-–]\s*([A-Z][\w-]*(?:\s+[A-Z][\w-]*){0,3})/g)) {
    // PDF text runs lines together ("Typeface: Purebot Sans Purebot Sans is…"): drop a repeated phrase.
    const words = m[1].trim().split(/\s+/);
    let n = words.length;
    for (let k = 1; k * 2 <= words.length; k++) {
      if (words.slice(0, k).join(" ") === words.slice(k, 2 * k).join(" ")) {
        n = k;
        break;
      }
    }
    out.add(words.slice(0, n).join(" "));
  }
  return [...out];
}

// ---------------------------------------------------------------- PDF

export async function extractFromPdf(path: string, name: string): Promise<Extracted> {
  const buf = await fs.readFile(path);
  const pages: string[] = [];
  let numpages = 0;
  try {
    const result = await pdf(buf, {
      pagerender: async (page) => {
        const content = await page.getTextContent();
        const text = content.items.map((i) => i.str).join(" ").replace(/\s+/g, " ").trim();
        pages.push(text);
        return text;
      },
    });
    numpages = result.numpages;
  } catch (err) {
    throw new SignatureError("UNREADABLE", `Couldn't read this PDF (${err instanceof Error ? err.message : String(err)})`);
  }

  const raw = buf.toString("latin1");
  const fonts = new Set<string>();
  for (const m of raw.matchAll(/\/BaseFont\s*\/(?:[A-Z]{6}\+)?([^\s/>\]]+)/g)) fonts.add(m[1].replace(/[-,](Regular|Roman)$/i, ""));

  // Fill/stroke colors from (possibly Flate-compressed) content streams.
  const counts = new Map<string, number>();
  for (const m of raw.matchAll(/stream\r?\n/g)) {
    const start = m.index! + m[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0) continue;
    const chunk = buf.subarray(start, end);
    let text: string;
    try {
      text = zlib.inflateSync(chunk).toString("latin1");
    } catch {
      text = chunk.toString("latin1");
    }
    for (const c of text.matchAll(/(\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s+(?:rg|RG)\b/g)) {
      bump(counts, toHex(+c[1] * 255, +c[2] * 255, +c[3] * 255));
    }
  }

  const all = pages.join("\n");
  return {
    kind: "pdf",
    name,
    pages: pages.map((text, i) => ({ page: i + 1, text })).filter((p) => p.text),
    fonts: [...fontsFromText(all), ...fonts].filter((f, i, a) => a.indexOf(f) === i),
    colors: topColors(counts),
    pageCount: numpages,
  };
}

// ---------------------------------------------------------------- URL

const MAX_BYTES = 2 * 1024 * 1024;

async function fetchText(url: string, timeoutMs = 10_000): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), redirect: "follow", headers: { "user-agent": "PURE-Expert-Lab/0.1" } });
  } catch (err) {
    throw new SignatureError("FETCH_FAILED", `Couldn't open ${url} (${err instanceof Error ? err.message : String(err)})`);
  }
  if (!res.ok) throw new SignatureError("FETCH_FAILED", `Couldn't open ${url} (HTTP ${res.status})`);
  const text = await res.text();
  return text.slice(0, MAX_BYTES);
}

const CSS_COLOR = /#([0-9a-f]{6}|[0-9a-f]{3})\b|rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;

export function colorsFromCss(css: string, counts = new Map<string, number>()): Map<string, number> {
  for (const m of css.matchAll(CSS_COLOR)) {
    if (m[1]) {
      const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
      bump(counts, `#${h.toUpperCase()}`);
    } else {
      bump(counts, toHex(+m[2], +m[3], +m[4]));
    }
  }
  return counts;
}

export function fontsFromCss(css: string): string[] {
  const out = new Set<string>();
  for (const m of css.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) {
    const first = m[1].split(",")[0].trim().replace(/^['"]|['"]$/g, "");
    if (first && !/^(inherit|initial|var\(|-apple-system|system-ui|sans-serif|serif|monospace)/i.test(first)) out.add(first);
  }
  return [...out];
}

/** Parse fetched HTML (+ CSS texts) into an Extracted. Split into sections at headings. */
export function extractFromHtml(html: string, css: string[], url: string): Extracted {
  const $ = cheerio.load(html);
  const inline = [$("style").text(), ...$("[style]").map((_, el) => $(el).attr("style") ?? "").get()].join("\n");
  const allCss = [inline, ...css].join("\n");
  const googleFonts = $('link[href*="fonts.googleapis.com"]')
    .map((_, el) => [...($(el).attr("href") ?? "").matchAll(/family=([^:&]+)/g)].map((m) => decodeURIComponent(m[1]).replace(/\+/g, " ")))
    .get()
    .flat();
  $("script, style, noscript, svg, nav, footer").remove();

  const sections: string[] = [];
  let current = "";
  $("body")
    .find("h1, h2, h3, p, li, blockquote")
    .each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (!text) return;
      if (/^h[1-3]$/i.test(el.tagName) && current.length > 300) {
        sections.push(current.trim());
        current = "";
      }
      current += text + " ";
    });
  if (current.trim()) sections.push(current.trim());

  const title = $("title").first().text().trim() || new URL(url).hostname;
  // Thin landing pages (copy in divs/spans, e.g. pixar.com): fall back to the title, meta description and all body text.
  if (sections.join(" ").length < MIN_TEXT_CHARS) {
    const meta = ['meta[name="description"]', 'meta[property="og:description"]'].map((q) => $(q).attr("content")?.trim() ?? "");
    const body = $("body").text().replace(/\s+/g, " ").trim();
    const text = [title, ...meta, body].filter((t, i, a) => t && a.indexOf(t) === i).join(" ");
    sections.splice(0, sections.length, text);
  }
  return {
    kind: "url",
    name: title,
    pages: sections.map((text, i) => ({ page: i + 1, text })),
    fonts: [...googleFonts, ...fontsFromCss(allCss)].filter((f, i, a) => a.indexOf(f) === i).slice(0, 6),
    colors: topColors(colorsFromCss(allCss)),
    pageCount: sections.length,
  };
}

export async function extractFromUrl(url: string): Promise<Extracted> {
  const html = await fetchText(url);
  const $ = cheerio.load(html);
  const sheets = $('link[rel="stylesheet"]')
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter(Boolean)
    .slice(0, 3)
    .map((href) => new URL(href, url).href);
  const css = await Promise.all(sheets.map((href) => fetchText(href, 5000).catch(() => "")));
  return extractFromHtml(html, css, url);
}

// ---------------------------------------------------------------- shared

export type SourceInput = { kind: "pdf"; path: string; name: string } | { kind: "url"; url: string };

/** Figma links are not supported (PRD appendix D): E1 right away. */
export function classifyUrl(url: string): "url" | "figma" {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new SignatureError("FETCH_FAILED", "That doesn't look like a web address");
  }
  return /(^|\.)figma\.com$/i.test(host) ? "figma" : "url";
}

export function assertReadable(x: Extracted): void {
  const chars = x.pages.reduce((n, p) => n + p.text.length, 0);
  if (chars < MIN_TEXT_CHARS) throw new SignatureError("NO_TEXT", "No readable text was found in this source");
}
