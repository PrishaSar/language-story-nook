import type { CEFRLevel } from "@/lib/types";

/**
 * Chapter generation / display toggles.
 * Flip these without hunting through prompt strings.
 */

/** CEFR levels that get English visual stage-directions (not a full translation). */
export const VISUAL_BEAT_LEVELS: CEFRLevel[] = ["A1", "A2"];

export function shouldIncludeVisualBeats(level: string): boolean {
  return (VISUAL_BEAT_LEVELS as string[]).includes(level);
}

/**
 * BOOKMARK — not built yet.
 * After this chapter number, ask the learner to write their own sentence
 * in the target language (in addition to the translation quiz).
 */
export const WRITE_OWN_SENTENCE_START_CHAPTER = 4;
