import type { PromptRegistryEntry, VocabReviewPromptInput } from "./types";

/** TODO: revisit prompt — tune before Phase 6 (interactive vocab questions). */
export const vocabReviewGenerate: PromptRegistryEntry<VocabReviewPromptInput> = {
  meta: {
    id: "vocab-review.generate",
    label: "Vocab Review Questions",
    description:
      "Generates comprehension or fill-in questions based on words introduced in a chapter.",
    phase: "Phase 6",
    status: "placeholder",
    revisit: true,
  },
  build: (input) => ({
    // TODO: revisit prompt
    system: `You create short vocabulary review questions for a language learner.
Questions must match the learner's CEFR level and only test words from the provided list.
Output valid JSON only.`,
    // TODO: revisit prompt
    user: `Language: ${input.languageName}. Level: ${input.level}.
Chapter excerpt: ${input.chapterText.slice(0, 500)}...
Target words: ${input.targetWords.join(", ")}

Return JSON:
{
  "questions": [
    { "prompt": "...", "answer": "...", "word": "..." }
  ]
}`,
  }),
};
