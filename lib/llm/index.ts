import "server-only";
import { getRepo } from "../repo-server";
import type { LlmClient } from "./client";
import { DemoExtraction, OllamaExtraction, type ExtractionClient } from "./extraction";
import { DemoGeneration, OllamaGeneration, type GenerationClient } from "./generation";
import { OllamaClient } from "./ollama";
import { DemoOptions, OllamaOptions, type OptionsClient } from "./options";

// Factories used by API routes. Demo mode (DB settings) short-circuits to the demo
// implementations; otherwise the Ollama implementations fall back to demo on failure.

const g = globalThis as typeof globalThis & { __pureLlm?: LlmClient; __pureLastLlm?: LastCall };

export interface LastCall {
  at: string;
  ms: number;
  model?: string;
  source: "ollama" | "demo";
  kind: string;
}

export function llmClient(): LlmClient {
  g.__pureLlm ??= new OllamaClient();
  return g.__pureLlm;
}

async function demoMode(): Promise<boolean> {
  return (await getRepo().settings.get()).demoMode;
}

export async function getGeneration(): Promise<GenerationClient> {
  return (await demoMode()) ? new DemoGeneration("Demo mode is on") : new OllamaGeneration(llmClient());
}

export async function getExtraction(): Promise<ExtractionClient> {
  return (await demoMode()) ? new DemoExtraction("Demo mode is on") : new OllamaExtraction(llmClient());
}

export async function getOptions(): Promise<OptionsClient> {
  return (await demoMode()) ? new DemoOptions() : new OllamaOptions(llmClient());
}

/** Shown on /dev ("last response time"). */
export function recordCall(call: Omit<LastCall, "at">): void {
  g.__pureLastLlm = { ...call, at: new Date().toISOString() };
}

export function lastCall(): LastCall | null {
  return g.__pureLastLlm ?? null;
}
