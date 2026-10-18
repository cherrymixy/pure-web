import { describe, expect, it } from "vitest";
import { GUIDELINE } from "@/data/guideline";
import { blocksToSections, entryDoc, sectionDoc } from "./guideline-doc";

const section = (id: string) => GUIDELINE.find((s) => s.id === id)!;
const entry = (id: string, slug: string) => section(id).entries.find((e) => e.slug === slug)!;

describe("guideline doc template", () => {
  it("titled blocks start sections, untitled ones join the section above, leading paragraphs join the lead", () => {
    const lead = ["Summary"];
    const rows = blocksToSections(
      [
        { kind: "p", text: "Intro" },
        { kind: "table", title: "Rules", head: ["a"], rows: [] },
        { kind: "p", text: "Note" },
        { kind: "list", title: "Rules", items: [] },
      ],
      lead,
    );
    expect(lead).toEqual(["Summary", "Intro"]);
    expect(rows.map((r) => [r.id, r.kind === "blocks" ? r.blocks.length : 0])).toEqual([["rules", 2], ["rules-2", 1]]);
  });
  it("every page gets a doc with sections and neighbours", () => {
    for (const s of GUIDELINE) {
      expect(sectionDoc(s).rows.length).toBeGreaterThan(0);
      for (const e of s.entries) {
        const d = entryDoc(s, e);
        expect(d.rows.length, `${s.id}/${e.slug}`).toBeGreaterThan(0);
        // Approach (808:1277) has no sibling list
        if (d.pages?.length) expect(d.pages.some((p) => p.current)).toBe(true);
        expect(d.prev || d.next).toBeTruthy();
      }
    }
  });
  it("channel principles list Common · Motion · Face · Sound like Figma 808:1657", () => {
    expect(entryDoc(section("principles"), entry("principles", "face")).pages?.map((p) => p.label)).toEqual(["Common", "Motion", "Face", "Sound"]);
    expect(entryDoc(section("principles"), entry("principles", "sound")).pages?.map((p) => p.label)).toEqual(["Common", "Motion", "Face", "Sound"]);
  });
  it("tokens list only their own channel", () => {
    const labels = entryDoc(section("primitive-tokens"), entry("primitive-tokens", "tilt")).pages!.map((p) => p.label);
    expect(labels).toHaveLength(5);
  });
});
