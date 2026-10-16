import { z } from "zod";
import { OLLAMA_MODEL } from "../env";
import { LlmError, type LlmClient } from "./client";
import { chatValidated } from "./retry";

// Short suggestions (expression names, example prompts). Small, fast, optional.

const OptionsSchema = z.object({ options: z.array(z.string().min(1)).min(1).max(5) });

export type OptionsKind = "name" | "prompt";

export interface OptionsClient {
  suggest(kind: OptionsKind, context: string, opts?: { signal?: AbortSignal }): Promise<{ options: string[]; source: "ollama" | "demo" }>;
}

const SYSTEM: Record<OptionsKind, string> = {
  name: "Suggest 3 short names (2–3 everyday words, no identifiers or robot names) for a robot expression described below. Answer with JSON only.",
  prompt: "Suggest 3 short first-person moments (under 10 words each) a desk robot could express, related to the context below. Answer with JSON only.",
};

function demoOptions(kind: OptionsKind, context: string): string[] {
  if (kind === "prompt") return ["Hey, I'm here!", "The presentation went well today!", "Wow, that startled me!"];
  const words = context.replace(/[^\w\s']/g, "").split(/\s+/).filter((w) => w.length > 3).slice(0, 2);
  const base = words.length ? words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ") : "New";
  return [`${base} moment`, `${base} reaction`, `Quiet ${base.toLowerCase()}`];
}

export class DemoOptions implements OptionsClient {
  async suggest(kind: OptionsKind, context: string) {
    return { options: demoOptions(kind, context), source: "demo" as const };
  }
}

export class OllamaOptions implements OptionsClient {
  constructor(private readonly client: LlmClient, private readonly model = OLLAMA_MODEL) {}

  async suggest(kind: OptionsKind, context: string, opts: { signal?: AbortSignal } = {}) {
    try {
      if (!(await this.client.available())) throw new LlmError("network", "Ollama unreachable");
      const res = await chatValidated(this.client, OptionsSchema, { system: SYSTEM[kind], user: context, model: this.model, signal: opts.signal, timeoutMs: 30_000 });
      return { options: res.value.options.slice(0, 3), source: "ollama" as const };
    } catch (err) {
      if (err instanceof LlmError && err.kind === "canceled") throw err;
      return { options: demoOptions(kind, context), source: "demo" as const };
    }
  }
}
