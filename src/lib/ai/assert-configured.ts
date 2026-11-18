/** Fail early with a clear message if the active provider is missing its key. */
export function assertAiConfigured(): void {
  const provider = process.env.AI_PROVIDER ?? "gemini";

  if (
    (provider === "gemini" || !process.env.AI_PROVIDER) &&
    !process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ) {
    throw new Error(
      "Google Gemini API key is missing. Add GOOGLE_GENERATIVE_AI_API_KEY to .env.local (see .env.example).",
    );
  }
  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key is not configured. Add OPENAI_API_KEY to .env.local (see .env.example).",
    );
  }
  if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "Anthropic API key is not configured. Add ANTHROPIC_API_KEY to .env.local (see .env.example).",
    );
  }
}
