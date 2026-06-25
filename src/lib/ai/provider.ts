import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type AIProviderName = "openai" | "ollama";

/**
 * Returns a provider-agnostic language model.
 * Uses the Vercel AI SDK so the same generateText() calls work with OpenAI, Ollama, Gemini, etc.
 */
export function getLanguageModel(): LanguageModel {
  const provider = (process.env.AI_PROVIDER ?? "openai") as AIProviderName;

  switch (provider) {
    case "ollama": {
      const ollama = createOpenAI({
        baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
        apiKey: "ollama",
      });
      return ollama(process.env.AI_MODEL ?? "llama3.2");
    }
    case "openai":
    default: {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      return openai(process.env.AI_MODEL ?? "gpt-4o-mini");
    }
  }
}
