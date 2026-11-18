import type { ChapterPromptInput, PromptRegistryEntry } from "./types";

function grammarRule(input: ChapterPromptInput): string {
  const known =
    input.knownGrammarLabels.length > 0
      ? input.knownGrammarLabels.join("; ")
      : "none yet";
  const lexicon =
    input.knownWords.length > 0 ? input.knownWords.join(", ") : "(empty — build the starter list)";

  const wordRule =
    input.newWordBudget <= 0
      ? `WORD LIST: closed. Use ONLY these ${input.languageName} words: ${lexicon}. Do not add new words. vocabLayer may be [].`
      : input.knownWords.length === 0
        ? `WORD LIST: this is the starter lexicon. Use at most ${input.newWordBudget} very common ${input.languageName} words, and no others. List EVERY word you use in vocabLayer.`
        : `WORD LIST: reuse these words: ${lexicon}. You may add at most ${input.newWordBudget} new common words. List ONLY the new ones in vocabLayer.`;

  return `GRAMMAR (required):
- Focus: ${input.grammarLabel}.
- ${input.grammarInstruction}
- Patterns the reader already knows (allowed, do not make them the lesson): ${known}.
- Do not use any other tense, clause type, or connector.

${wordRule}
- vocabLayer words must be real ${input.languageName} script only. No romanization. No characters from the wrong writing system.`;
}

function visualRule(input: ChapterPromptInput): string {
  if (!input.includeVisualBeats) {
    return `VISUAL / SCENE FORMAT: Off for this level (${input.level}).
- Return "sceneSet": null and "scenes": [].
- Put the full chapter in "text" only (${input.languageName}).
- No English in the chapter body.`;
  }

  return `VISUAL / SCENE FORMAT: On for CEFR ${input.level}.
Use this exact reading order (the UI will display it this way):
1) "sceneSet": ONE short English sentence setting the scene for the whole chapter (place/mood only), e.g. "A rainy afternoon by the café window."
2) "scenes": an array of beats. For EACH beat:
   - "text": ${input.languageName} dialogue/narration ONLY
   - "visual": ONE short English STAGE ACTION that comes AFTER the lines (what we see next), e.g. "She takes the umbrella and sits down."
- Do NOT put stage actions before the ${input.languageName} text.
- "visual" is English action/picture only — NOT a translation of the dialogue.
- Also set top-level "text" to all scene texts joined with blank lines.`;
}

function scriptHygiene(input: ChapterPromptInput): string {
  return `SCRIPT HYGIENE (critical):
- "text" / scene "text" must be written in ${input.languageName} script ONLY.
- NO romanization, NO transliteration in parentheses, NO English mixed into the ${input.languageName} lines.
- Bad: "안녕하세요 (annyeonghaseyo)."  Good: "안녕하세요."
- Do not use characters from the wrong writing system (e.g. no Chinese characters in Korean text; no Latin letters standing in for ${input.languageName} words).
- Keep sentences short and clear for CEFR ${input.level}.`;
}

/** TODO: revisit prompt — tune difficulty and visual-beat layout before production. */
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
    system: `You are a language-learning story writer for an app that teaches through short, readable scenes.
Write exactly ONE chapter of an ongoing serialized story.

LANGUAGE:
- Learner target language: ${input.languageName}. CEFR level: ${input.level}.
- Keep ${input.languageName} sentences short and clear — like everyday speech, not literary prose.

${scriptHygiene(input)}

${grammarRule(input)}

${visualRule(input)}

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

Grammar focus: ${input.grammarLabel}.
Closed words: ${input.knownWords.join(", ") || "none yet — build the starter list"}.
New-word budget this chapter: ${input.newWordBudget}.

Return JSON with this shape and display order:
{
  "sceneSet": ${
    input.includeVisualBeats
      ? `"A rainy afternoon by the café window."`
      : `null`
  },
  "text": "full chapter in ${input.languageName} only — no romanization",
  "scenes": ${
    input.includeVisualBeats
      ? `[
    {
      "text": "(${input.languageName} lines only — no romanization)",
      "visual": "She takes the umbrella and sits down."
    },
    {
      "text": "(more ${input.languageName} lines)",
      "visual": "Rain hits the window."
    }
  ]`
      : `[]`
  },
  "vocabLayer": [{ "word": "correct ${input.languageName} word", "translation": "English", "context": "how it appeared" }],
  "eventsThatHappened": ["Ch${input.chapterNumber}: one-line English summary of what occurred"],
  "completedBeatIds": ["beat-id-you-covered"]
}`,
    // Saved for later — ask the model for a reader recap + multiple-choice translation quiz:
    // "whatHappened": "1-2 short English sentences recapping what the reader just saw.",
    // "translationQuiz": {
    //   "sentence": "ONE short sentence copied from the chapter, target language only",
    //   "correct": "accurate simple English translation",
    //   "distractors": ["wrong English", "wrong English", "wrong English"]
    // }
  }),
};
