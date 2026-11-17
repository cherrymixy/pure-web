// Server-side environment. Defaults match docs/decisions.md (STEP 0).
export const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:8b";
export const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL ?? "gemma3:4b";
/** How long Ollama keeps a model loaded after a call ("10m"; scripts/demo.sh sets -1 = until Ollama stops). */
const keepAlive = process.env.OLLAMA_KEEP_ALIVE ?? "10m";
export const OLLAMA_KEEP_ALIVE: string | number = /^-?\d+$/.test(keepAlive) ? Number(keepAlive) : keepAlive;

/** Set → all LLM calls go to OpenAI instead of Ollama (the deployed site has no Ollama). */
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

// Experimental flags — all default off (docs/conventions.md rule 13).
export const FLAGS = {
  directClip: process.env.FLAG_DIRECT_CLIP === "1",
} as const;

// Demo mode lives in the DB (settings.demoMode), toggled from /dev.
