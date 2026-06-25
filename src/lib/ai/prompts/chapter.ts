import type { ChapterPromptInput, PromptRegistryEntry } from "./types";

/** TODO: revisit prompt — tune before chapter generation in production. */
export const chapterGenerate: PromptRegistryEntry<ChapterPromptInput> = {
  meta: {
    id: "chapter.generate",
    label: "Chapter Generator",
    description:
      "Writes one chapter from the current beat(s) and events-so-far — never repeats prior events.",
    phase: "Phase 4–5",
    status: "placeholder",
    revisit: true,
  },
  build: (input) => ({
    // TODO: revisit prompt
    system: `You are a language-learning story writer.
Write exactly ONE chapter of an ongoing serialized story in the target language, calibrated to the learner's CEFR level.
Reuse words the learner already knows. Introduce a small number of new words with clear context.

CRITICAL: Do NOT repeat, re-tell, or re-introduce any event listed in eventsSoFar.
Only advance the beats assigned to this chapter. Do not spoil or execute beats from future chapters.
Output valid JSON only.`,
    // TODO: revisit prompt
    user: `Write chapter ${input.chapterNumber} of ${input.chapterCount} in ${input.languageName} for a ${input.level} learner.

Beats to cover THIS chapter only:
${input.chapterBeats}

Already completed beat IDs (do not repeat these): ${input.completedBeatIds.join(", ") || "none"}

Events that already happened (DO NOT repeat any of this):
${input.eventsSoFar.length > 0 ? input.eventsSoFar.map((e) => `- ${e}`).join("\n") : "- (story just beginning)"}

Words the learner knows: ${input.knownWords.join(", ") || "none yet"}

Return JSON:
{
  "text": "chapter prose in target language",
  "vocabLayer": [{ "word": "...", "translation": "...", "context": "..." }],
  "eventsThatHappened": ["Ch${input.chapterNumber}: one-line summary of what occurred"],
  "completedBeatIds": ["beat-id-you-covered"]
}`,
  }),
};
