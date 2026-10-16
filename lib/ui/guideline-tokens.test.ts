import { describe, expect, it } from "vitest";
import { pureTokensJson } from "./guideline-tokens";

describe("pure tokens JSON", () => {
  it("lists primitive tokens with parameter rows and the 8 signature axes", () => {
    const j = pureTokensJson();
    expect(j.format).toBe("pure.tokens/1");
    expect(j.primitiveTokens.length).toBeGreaterThan(10);
    expect(j.primitiveTokens.find((t) => t.id === "tilt")?.parameters[0]).toHaveProperty("token");
    expect(j.signatureAxes).toHaveLength(8);
  });
});
