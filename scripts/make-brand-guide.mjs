// Generates the demo brand guides used in the signature step (W02C):
//   public/demo/Purebot_Brand_Guide.pdf — 12-page text PDF. Tone evidence: warm p.4, playful p.7, precise p.12.
//   public/demo/Scanned_Guide.pdf       — shapes only, no text layer (the E1 "no readable text" case).
// Run: node scripts/make-brand-guide.mjs
import fs from "node:fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const OUT = new URL("../public/demo/", import.meta.url);
const W = 595;
const H = 842;
const PALETTE = [
  { name: "Pure Pink", hex: "#F0126B" },
  { name: "Desk White", hex: "#F3F3F3" },
  { name: "Graphite", hex: "#2B2B30" },
  { name: "Soft Violet", hex: "#785CFF" },
  { name: "Warm Sand", hex: "#E8C9A0" },
];
const hexToRgb = (hex) => rgb(...[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255));

const PAGES = [
  ["Purebot Brand Guide", ["Version 1.0 · Purebot Co.", "How Purebot looks, sounds and moves."]],
  ["Contents", []],
  ["Who we are", ["Purebot builds small desk robots that keep people company while they work.", "We design for long days at a desk, not for showrooms."]],
  ["Voice", ["Purebot speaks warmly, like a friend at your desk.", "We are warm and kind before we are clever. We greet people by name and never rush them.", "Warm, gentle words; short sentences; no jargon."]],
  ["Typeface", ["Typeface: Purebot Sans", "Purebot Sans is our only typeface. Use Regular for body and Bold for headings.", "Secondary: system UI fonts on devices without Purebot Sans."]],
  ["Personality", ["Purebot is attentive and calm. It notices you, then gets out of the way.", "It is confident without being loud."]],
  ["Play", ["A little play keeps the day light.", "Purebot is playful in small doses: a quick bounce, a curious tilt, a cheerful chirp.", "Playful moments are short and always end in rest."]],
  ["Color", PALETTE.map((c) => `${c.name} ${c.hex}`)],
  ["Sound", ["Short, soft tones. Never more than two cues for one moment.", "Pitch sits slightly low and round."]],
  ["Layout", ["Generous margins. One idea per screen."]],
  ["Do and Don't", ["Do: rest between moves. Do: look at the person you talk to.", "Don't: jitter, loop endlessly, or move while someone is typing."]],
  ["Movement quality", ["Every movement lands exactly where it should.", "Purebot is precise: no wobble, no overshoot, a clean and soft stop.", "Precise timing builds trust; sloppy motion breaks it."]],
];

// Table of contents from the real page order.
PAGES[1][1] = PAGES.map(([title], i) => `${i + 1}  ${title}`).slice(2);

async function guide() {
  const doc = await PDFDocument.create();
  doc.setTitle("Purebot Brand Guide");
  doc.setAuthor("Purebot Co.");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  PAGES.forEach(([title, lines], i) => {
    const page = doc.addPage([W, H]);
    page.drawRectangle({ x: 0, y: H - 8, width: W, height: 8, color: hexToRgb(PALETTE[0].hex) });
    page.drawText(title, { x: 56, y: H - 96, size: 28, font: bold, color: hexToRgb(PALETTE[2].hex) });
    lines.forEach((line, j) => page.drawText(line, { x: 56, y: H - 150 - j * 24, size: 12, font: regular, color: hexToRgb(PALETTE[2].hex) }));
    if (title === "Color") {
      PALETTE.forEach((c, j) => page.drawRectangle({ x: 56 + j * 96, y: 300, width: 80, height: 80, color: hexToRgb(c.hex) }));
    }
    page.drawText(String(i + 1), { x: W - 72, y: 40, size: 10, font: regular, color: rgb(0.5, 0.5, 0.5) });
  });
  fs.writeFileSync(new URL("Purebot_Brand_Guide.pdf", OUT), await doc.save({ useObjectStreams: false }));
}

async function scanned() {
  const doc = await PDFDocument.create();
  for (let i = 0; i < 3; i++) {
    const page = doc.addPage([W, H]);
    page.drawRectangle({ x: 40, y: 40, width: W - 80, height: H - 80, color: rgb(0.93, 0.92, 0.9) });
    for (let j = 0; j < 18; j++) page.drawRectangle({ x: 70, y: H - 120 - j * 36, width: 300 + ((j * 47) % 140), height: 10, color: rgb(0.35, 0.35, 0.37) });
  }
  fs.writeFileSync(new URL("Scanned_Guide.pdf", OUT), await doc.save({ useObjectStreams: false }));
}

await guide();
await scanned();
console.log("wrote public/demo/Purebot_Brand_Guide.pdf and Scanned_Guide.pdf");
