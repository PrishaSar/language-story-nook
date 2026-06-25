import { generateText } from "ai";
import { buildPrompt } from "./prompts/registry";
import type { PromptId, PromptInputMap } from "./prompts/types";
import { getLanguageModel } from "./provider";

export type GeneratePromptInput = {
  system: string;
  user: string;
};

export type GeneratePromptResult = {
  text: string;
  provider: string;
  model: string;
  promptId?: PromptId;
};

/**
 * Provider-agnostic text generation wrapper.
 * Same interface whether using OpenAI, Ollama, or future Gemini adapter.
 */
export async function generatePromptResponse(
  input: GeneratePromptInput,
  promptId?: PromptId,
): Promise<GeneratePromptResult> {
  const model = getLanguageModel();
  const provider = process.env.AI_PROVIDER ?? "openai";
  const modelId = process.env.AI_MODEL ?? (provider === "ollama" ? "llama3.2" : "gpt-4o-mini");

  const { text } = await generateText({
    model,
    system: input.system,
    prompt: input.user,
  });

  return { text, provider, model: modelId, promptId };
}

/**
 * Look up a prompt from the central registry and run it.
 * Prefer this over calling generatePromptResponse directly so all AI calls
 * go through the registry.
 */
export async function generateFromPrompt<K extends PromptId>(
  id: K,
  input: PromptInputMap[K],
): Promise<GeneratePromptResult> {
  const messages = buildPrompt(id, input);
  return generatePromptResponse(messages, id);
}

/**
 * Parse JSON from an AI response, stripping optional markdown fences.
 */
export function parseAIJson<T>(raw: string): T {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonStr) as T;
}
