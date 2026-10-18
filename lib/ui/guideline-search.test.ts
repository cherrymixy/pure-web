import { describe, expect, it } from "vitest";
import { searchIndex } from "@/data/guideline";
import { searchGuideline } from "./guideline-search";

const index = searchIndex("/guideline");

describe("guideline search", () => {
  it("is null for an empty query", () => {
    expect(searchGuideline(index, "  ")).toBeNull();
  });
  it("searches the whole guideline, title hits first", () => {
    const r = searchGuideline(index, "approach")!;
    expect(r[0].href).toMatch(/approach$/);
    expect(r.some((x) => x.href === "/guideline/behavior/approach")).toBe(true);
  });
  it("forgives one typo", () => {
    expect(searchGuideline(index, "approacj")!.some((x) => x.href === "/guideline/behavior/approach")).toBe(true);
  });
  it("finds pages by ref", () => {
    expect(searchGuideline(index, "ch.face")!.some((x) => x.href === "/guideline/principles/face")).toBe(true);
  });
  it("returns nothing for gibberish", () => {
    expect(searchGuideline(index, "zzqx")).toEqual([]);
  });
});
