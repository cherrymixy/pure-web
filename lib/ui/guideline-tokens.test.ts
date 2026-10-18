import { describe, expect, it } from "vitest";
import { pureTokensJson } from "./guideline-tokens";

describe("pure tokens JSON", () => {
  it("lists the tok.* primitives with size rows and the 8 signature axes", () => {
    const j = pureTokensJson();
    expect(j.format).toBe("pure.tokens/1");
    expect(j.primitiveTokens.every((t) => t.id.startsWith("tok."))).toBe(true);
    expect(j.primitiveTokens.filter((t) => /^tok\.(body|time)\./.test(t.id))).toHaveLength(10);
    expect(j.primitiveTokens.find((t) => t.id === "tok.body.tilt")?.parameters[1]).toEqual({ size: "m", value: "12°", use: "Greeting · default" });
    expect(j.signatureAxes).toHaveLength(8);
  });
});
