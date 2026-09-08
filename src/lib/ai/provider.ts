import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type AIProviderName = "ollama" | "openai" | "anthropic";

/**
 * Language model for all AI calls (plot bible, chapters, etc.).
 *
 * Switch providers by commenting / uncommenting the blocks below
 * (and matching AI_PROVIDER / AI_MODEL in .env.local).
 */
export function getLanguageModel(): LanguageModel {
  // --- Ollama (local) — ACTIVE ---
  const ollama = createOpenAI({
    baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
    apiKey: "ollama",
  });
  return ollama(process.env.AI_MODEL ?? "llama3.2");

  // --- OpenAI (cloud) — uncomment this block and comment Ollama above to switch ---
  // const openai = createOpenAI({
  //   apiKey: process.env.OPENAI_API_KEY,
  // });
  // return openai(process.env.AI_MODEL ?? "gpt-4o-mini");

  // --- Anthropic (cloud) — needs: npm i @ai-sdk/anthropic ---
  // import { createAnthropic } from "@ai-sdk/anthropic";
  // const anthropic = createAnthropic({
  //   apiKey: process.env.ANTHROPIC_API_KEY,
  // });
  // return anthropic(process.env.AI_MODEL ?? "claude-sonnet-4-5");
}
