// Server-side environment. Defaults match docs/decisions.md (STEP 0).
export const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:8b";
export const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL ?? "gemma3:4b";

// Experimental flags — all default off (CLAUDE.md rule 13).
export const FLAGS = {
  directClip: process.env.FLAG_DIRECT_CLIP === "1",
} as const;

// Demo mode is a per-browser cookie toggled from /dev; LLM routes read it in STEP 6.
export const DEMO_COOKIE = "pure_demo";
