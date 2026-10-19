import path from "node:path";
import { Memory } from "lowdb";
import { describe, expect, it } from "vitest";
import { seedDb } from "@/data/seed";
import { DEMO_EXTRACTION } from "../llm/extraction";
import type { Db } from "../models";
import { LowRepo } from "../repo-lowdb";
import { DEFAULT_AXES } from "@/data/signature";
import { axesFromTone, compareSignatures, signatureToParams } from "./axes";
import { SignatureError } from "./errors";
import { assertReadable, classifyUrl, extractFromHtml, extractFromPdf, fontsFromText, topColors } from "./extract";
import { buildDraft } from "./run";

const demoPdf = path.join(process.cwd(), "public/demo/Purebot_Brand_Guide.pdf");
const scannedPdf = path.join(process.cwd(), "public/demo/Scanned_Guide.pdf");
const code = async (p: Promise<unknown> | (() => unknown)) => {
  try {
    await (typeof p === "function" ? p() : p);
    return null;
  } catch (e) {
    return e instanceof SignatureError ? e.code : String(e);
  }
};

describe("tone → axes", () => {
  it("adds dictionary offsets to 50 and writes How it maps with pages", () => {
    const { axes, mapping } = axesFromTone(DEMO_EXTRACTION.tone);
    // warm + precise + playful
    expect(axes.settle).toBe(50 + 14 + 18);
    expect(axes.tempo).toBe(50 - 8);
    expect(axes.rhythm).toBe(50 - 8 + 16);
    const settle = mapping.find((m) => m.axis === "settle")!;
    expect(settle.page).toBe(12);
    expect(settle.reason).toBe("“precise” on p.12 raises Settle to 82 (soft landing).");
    expect(mapping.find((m) => m.axis === "tempo")!.reason).toMatch(/^“warm” on p\.4 lowers Tempo to 42 \(speed ×0\.99\)\.$/);
  });

  it("credits a keyword that moved the axis in the same direction", () => {
    const { axes, mapping } = axesFromTone([{ keyword: "playful", page: 7 }, { keyword: "calm", page: 6 }, { keyword: "gentle", page: 4 }]);
    expect(axes.amp).toBe(50 + 14 - 10 - 8);
    expect(mapping.find((m) => m.axis === "amp")!.reason).toMatch(/^\u201ccalm\u201d on p\.6 lowers Amplitude/);
  });

  it("clamps to 0–100 and skips axes left at 50", () => {
    const { axes, mapping } = axesFromTone(["energetic", "dynamic", "bold", "playful", "innovative"].map((keyword) => ({ keyword })));
    expect(Math.max(...Object.values(axes))).toBeLessThanOrEqual(100);
    expect(mapping.every((m) => m.value !== 50 && m.page === undefined)).toBe(true);
    expect(axesFromTone([]).mapping).toEqual([]);
  });

  it("signature → playback params follows PRD §6-7", () => {
    const p = signatureToParams({ tempo: 0, amp: 100, settle: 50, antic: 20, rhythm: 50, eyes: 100, pitch: 0, density: 100 });
    expect(p.playback.speed).toBeCloseTo(0.7);
    expect(p.playback.amplitude).toBeCloseTo(1.3);
    expect(p.playback.settle).toBeCloseTo(0.5);
    expect(p.playback.antic).toBeCloseTo(0.2);
    expect(p.playback.rhythm).toBeCloseTo(1.1);
    expect(p.face.video).toBe("smile");
    expect(signatureToParams({ ...DEFAULT_AXES, eyes: 10 }).face.video).toBe("sleepy");
    expect(signatureToParams({ ...DEFAULT_AXES, eyes: 50 }).face.video).toBe("neutral");
    expect(p.sound).toEqual({ pitchSt: -4, maxCues: 4 });
  });
});

describe("sources", () => {
  it("rejects Figma links", () => {
    expect(classifyUrl("https://www.figma.com/design/abc/Brand")).toBe("figma");
    expect(classifyUrl("https://purebot.com/brand")).toBe("url");
  });

  it("reads the demo PDF: 12 pages, evidence pages, type and palette", async () => {
    const x = await extractFromPdf(demoPdf, "Purebot_Brand_Guide.pdf");
    expect(x.pageCount).toBe(12);
    expect(x.pages.find((p) => p.page === 4)!.text).toMatch(/warmly/);
    expect(x.pages.find((p) => p.page === 7)!.text).toMatch(/playful/);
    expect(x.pages.find((p) => p.page === 12)!.text).toMatch(/precise/);
    expect(x.fonts[0]).toBe("Purebot Sans");
    expect(x.colors).toEqual(expect.arrayContaining(["#F0126B", "#2B2B30", "#785CFF"]));
    expect(() => assertReadable(x)).not.toThrow();
  });

  it("a scanned PDF is E1 (unreadable or no text)", async () => {
    const result = await code(async () => assertReadable(await extractFromPdf(scannedPdf, "Scanned_Guide.pdf")));
    expect(["NO_TEXT", "UNREADABLE"]).toContain(result);
  });

  it("parses a web page: sections, CSS colors and fonts", () => {
    const html = `<html><head><title>Acme Brand</title><style>body{font-family:'Acme Grotesk',sans-serif;color:#112233} .cta{background:#ff6600}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400" rel="stylesheet"></head>
      <body><h1>Voice</h1><p>${"We are calm and gentle. ".repeat(20)}</p><h2>Motion</h2><p>Bold moves only.</p><script>var x='#000000'</script></body></html>`;
    const x = extractFromHtml(html, [".btn{color:rgb(255,102,0)}"], "https://acme.test");
    expect(x.name).toBe("Acme Brand");
    expect(x.pages).toHaveLength(2);
    expect(x.fonts).toEqual(["Inter", "Acme Grotesk"]);
    expect(x.colors[0]).toBe("#FF6600");
  });

  it("a landing page with copy in divs still reads (title, meta description, body text)", () => {
    const html = `<html><head><title>Studio</title><meta name="description" content="Stories for every age."></head>
      <body><p>Careers at Studio.</p><div><span>${"We tell heartfelt stories with characters you love. ".repeat(5)}</span></div></body></html>`;
    const x = extractFromHtml(html, [], "https://studio.test");
    expect(() => assertReadable(x)).not.toThrow();
    expect(x.pages[0].text).toContain("Stories for every age.");
    expect(x.pages[0].text).toContain("heartfelt stories");
  });

  it("helpers: font lines and grey filtering", () => {
    expect(fontsFromText("Typeface: Purebot Sans. Secondary font - Inter Display")).toEqual(["Purebot Sans", "Inter Display"]);
    expect(topColors(new Map([["#808080", 9], ["#FFFFFF", 9], ["#F0126B", 2]]))).toEqual(["#F0126B"]);
  });
});

describe("versions", () => {
  it("draft → v1, regenerate → v2, restore → v3, compare shows deltas", async () => {
    const repo = new LowRepo(new Memory<Db>(), { seed: seedDb });
    const x = await extractFromPdf(demoPdf, "Purebot_Brand_Guide.pdf");
    const source = { kind: "pdf" as const, path: "p/pdf/guide.pdf", name: "Purebot_Brand_Guide.pdf" };
    const p = await repo.projects.create({ name: "Sig", type: "joint-fixed", source: "pure-desk" });
    const v1 = await repo.signatures.addVersion(p.id, buildDraft(x, DEMO_EXTRACTION, { source }));
    expect(v1).toMatchObject({ version: 1, name: "Purebot Brand Guide", tone: ["warm", "precise", "playful"] });
    expect(v1.note).toContain("Purebot Sans");
    const calm = { tone: [{ keyword: "calm", page: 6, quote: "" }, { keyword: "gentle", page: 4, quote: "" }, { keyword: "minimal", page: 10, quote: "" }] };
    const v2 = await repo.signatures.addVersion(p.id, buildDraft(x, calm, { source }));
    expect(v2.version).toBe(2);
    const diff = compareSignatures(v1, v2);
    expect(diff.find((d) => d.axis === "tempo")!.delta).toBe(v2.axes.tempo - v1.axes.tempo);
    const v3 = await repo.signatures.restore(p.id, 1);
    expect(v3.version).toBe(3);
    expect(v3.axes).toEqual(v1.axes);
  });
});
