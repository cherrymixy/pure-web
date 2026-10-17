// STEP 25: warm Ollama when the server starts so the first generation in the demo doesn't pay the model load.
// Fire-and-forget; no Ollama → nothing happens (generation falls back to the demo recipes as always).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { OLLAMA_MODEL, OLLAMA_VISION_MODEL } = await import("./lib/env");
  const { OllamaClient } = await import("./lib/llm/ollama");
  const client = new OllamaClient();
  void client.preload(OLLAMA_MODEL).then(() => client.preload(OLLAMA_VISION_MODEL));
}
