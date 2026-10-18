import { GUIDELINE } from "@/data/guideline";
import { AXIS_INFO, AXIS_ORDER, DEFAULT_AXES } from "@/data/signature";

export const PURE_TOKENS_FORMAT = "pure.tokens/1";

/** "Download pure tokens JSON" (W03): the tok.* primitives with their size/value rows + the 8 signature axes. */
export function pureTokensJson() {
  const section = GUIDELINE.find((s) => s.id === "primitive-tokens");
  return {
    format: PURE_TOKENS_FORMAT,
    primitiveTokens: (section?.entries ?? [])
      .filter((e) => e.ref?.startsWith("tok."))
      .map((e) => {
        const table = e.body.find((b) => b.kind === "table");
        return {
          id: e.ref!,
          name: e.title,
          summary: e.summary,
          parameters: table?.kind === "table" ? table.rows.map((r) => Object.fromEntries(table.head.map((h, i) => [h.toLowerCase(), r[i] ?? ""]))) : [],
          ...(e.proposed ? { proposed: true } : {}),
        };
      }),
    signatureAxes: AXIS_ORDER.map((axis) => ({ axis, ...AXIS_INFO[axis], default: DEFAULT_AXES[axis], range: [0, 100] })),
  };
}
