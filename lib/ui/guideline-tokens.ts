import { GUIDELINE } from "@/data/guideline";
import { AXIS_INFO, AXIS_ORDER, DEFAULT_AXES } from "@/data/signature";

export const PURE_TOKENS_FORMAT = "pure.tokens/1";

/** "Download pure tokens JSON" (W03): primitive tokens with their parameter tables + the 8 signature axes. */
export function pureTokensJson() {
  const section = GUIDELINE.find((s) => s.id === "primitive-tokens");
  return {
    format: PURE_TOKENS_FORMAT,
    primitiveTokens: (section?.entries ?? []).map((e) => ({
      id: e.slug,
      name: e.title,
      summary: e.summary,
      parameters: e.body.filter((b) => b.kind === "table").flatMap((b) => (b.kind === "table" ? b.rows.map((r) => Object.fromEntries(b.head.map((h, i) => [h.toLowerCase(), r[i] ?? ""]))) : [])),
      ...(e.placeholder ? { placeholder: true } : {}),
    })),
    signatureAxes: AXIS_ORDER.map((axis) => ({ axis, ...AXIS_INFO[axis], default: DEFAULT_AXES[axis], range: [0, 100] })),
  };
}
