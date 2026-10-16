import { z } from "zod";
import { TONE_DICTIONARY } from "@/data/signature";
import { OLLAMA_MODEL } from "../env";
import { LlmError, type LlmClient } from "./client";
import { EXTRACTION_SYSTEM } from "./prompts";
import { chatValidated } from "./retry";

const ToneEnum = z.enum(Object.keys(TONE_DICTIONARY) as [string, ...string[]]);

export const ExtractionOutputSchema = z.object({
  tone: z
    .array(z.object({ keyword: ToneEnum, page: z.number().int(), quote: z.string() }))
    .min(3)
    .max(5),
});
export type ExtractionOutput = z.infer<typeof ExtractionOutputSchema>;

export interface ExtractionRequest {
  /** Text per page (pdf-parse / cheerio), trimmed by the caller */
  pages: { page: number; text: string }[];
  fonts?: string[];
  colors?: string[];
}

export interface ExtractionResult {
  output: ExtractionOutput;
  source: "ollama" | "demo";
  fallbackReason?: string;
  raw?: string;
  ms: number;
}

export interface ExtractionClient {
  extract(req: ExtractionRequest, opts?: { signal?: AbortSignal }): Promise<ExtractionResult>;
}

/** Purebot brand guide tone (matches the seeded "Purebot Brand" signature). */
export const DEMO_EXTRACTION: ExtractionOutput = {
  tone: [
    { keyword: "warm", page: 4, quote: "Purebot speaks warmly, like a friend at your desk" },
    { keyword: "precise", page: 12, quote: "Every movement lands exactly where it should" },
    { keyword: "playful", page: 7, quote: "A little play keeps the day light" },
  ],
};

export class DemoExtraction implements ExtractionClient {
  constructor(private readonly reason = "Demo mode") {}
  async extract(): Promise<ExtractionResult> {
    return { output: DEMO_EXTRACTION, source: "demo", fallbackReason: this.reason, ms: 0 };
  }
}

export class OllamaExtraction implements ExtractionClient {
  constructor(private readonly client: LlmClient, private readonly model = OLLAMA_MODEL) {}

  async extract(req: ExtractionRequest, opts: { signal?: AbortSignal } = {}): Promise<ExtractionResult> {
    try {
      if (!(await this.client.available())) throw new LlmError("network", "Ollama unreachable");
      const body = req.pages.map((p) => `--- page ${p.page} ---\n${p.text}`).join("\n").slice(0, 12_000);
      const user = [
        `Allowed tone keywords: ${Object.keys(TONE_DICTIONARY).join(", ")}`,
        req.fonts?.length ? `Fonts: ${req.fonts.join(", ")}` : "",
        req.colors?.length ? `Colors: ${req.colors.join(", ")}` : "",
        body,
      ].filter(Boolean).join("\n");
      const res = await chatValidated(this.client, ExtractionOutputSchema, { system: EXTRACTION_SYSTEM, user, model: this.model, signal: opts.signal, temperature: 0.2 });
      return { output: res.value, source: "ollama", raw: res.raw, ms: res.ms };
    } catch (err) {
      if (err instanceof LlmError && err.kind === "canceled") throw err;
      return new DemoExtraction(err instanceof Error ? err.message : String(err)).extract();
    }
  }
}
