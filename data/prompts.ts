// Suggested prompts in the editor (W02D). Each has a demo recipe in data/demo-recipes.ts.
export const SUGGESTED_PROMPTS = [
  { id: "here", text: "Hey, I'm here!" },
  { id: "presentation", text: "The presentation went well today!" },
  { id: "tired", text: "I'm so tired, I keep nodding off" },
  { id: "startled", text: "Wow, that startled me!" },
] as const;

export type SuggestedPromptId = (typeof SUGGESTED_PROMPTS)[number]["id"];
