import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type AIProviderName = "gemini" | "ollama" | "openai" | "anthropic";

/**
 * Language model for all AI calls (plot bible, chapters, etc.).
 *
 * Switch providers by commenting / uncommenting the blocks below
 * (and matching AI_PROVIDER / AI_MODEL in .env.local).
 *
 * Put your Google AI Studio key in .env.local as:
 *   GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
 */
export function getLanguageModel(): LanguageModel {
  // --- Google Gemini (AI Studio free tier) — ACTIVE ---
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
  return google(process.env.AI_MODEL ?? "gemini-3.6-flash");

  // --- Ollama (local) — uncomment this block and comment Gemini above to switch ---
  // const ollama = createOpenAI({
  //   baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  //   apiKey: "ollama",
  // });
  // return ollama(process.env.AI_MODEL ?? "llama3.2");

  // --- OpenAI (cloud) ---
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
