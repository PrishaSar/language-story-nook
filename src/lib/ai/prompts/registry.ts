import { chapterGenerate } from "./chapter";
import { contentFlagSummarize } from "./content-flag";
import { plotBibleGenerate } from "./plot-bible";
import type {
  PromptId,
  PromptInputMap,
  PromptMessages,
  PromptMeta,
  PromptRegistryEntry,
} from "./types";
import { vocabReviewGenerate } from "./vocab-review";

/**
 * Central prompt registry — single source of truth for every AI prompt in the app.
 *
 * Usage:
 *   const messages = buildPrompt("plot-bible.generate", input);
 *   await generatePromptResponse(messages);
 *
 * Every entry is marked revisit: true until you tune the prompt text.
 * Search for "TODO: revisit prompt" to find all prompt bodies.
 */
const ENTRIES: { [K in PromptId]: PromptRegistryEntry<PromptInputMap[K]> } = {
  "plot-bible.generate": plotBibleGenerate,
  "chapter.generate": chapterGenerate,
  "vocab-review.generate": vocabReviewGenerate,
  "content-flag.summarize": contentFlagSummarize,
};

/** List all registered prompts with metadata (for debugging / admin UI later). */
export function listPrompts(): PromptMeta[] {
  return Object.values(ENTRIES).map((entry) => entry.meta);
}

/** Look up metadata for a single prompt ID. */
export function getPromptMeta(id: PromptId): PromptMeta {
  return ENTRIES[id].meta;
}

/** Build system + user messages for a registered prompt. */
export function buildPrompt<K extends PromptId>(
  id: K,
  input: PromptInputMap[K],
): PromptMessages {
  return ENTRIES[id].build(input);
}

/** Prompt IDs that still need tuning (revisit: true). */
export function listPromptsToRevisit(): PromptMeta[] {
  return listPrompts().filter((p) => p.revisit);
}

export {
  chapterGenerate,
  contentFlagSummarize,
  plotBibleGenerate,
  vocabReviewGenerate,
};

export type {
  ChapterPromptInput,
  ContentFlagPromptInput,
  PlotBiblePromptInput,
  PromptId,
  PromptInputMap,
  PromptMessages,
  PromptMeta,
  VocabReviewPromptInput,
} from "./types";
