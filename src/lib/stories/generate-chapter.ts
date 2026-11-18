import { generateFromPrompt, parseAIJson } from "@/lib/ai";
import { assertAiConfigured } from "@/lib/ai/assert-configured";
import { shouldIncludeVisualBeats } from "@/lib/ai/chapter-options";
import {
  getLivingContext,
  getPlotBible,
  getChapter,
  saveChapter,
  updateLanguageLearning,
  updateLivingContext,
  updateStoryChapter,
} from "@/lib/db";
import {
  STARTER_WORD_CAP,
  describeFocus,
  focusPatterns,
  grammarById,
} from "@/lib/grammar/ladder";
import type {
  Chapter,
  ChapterScene,
  Story,
  TranslationQuiz,
  UserLanguage,
  VocabItem,
} from "@/lib/types";
import { formatBeatsForPrompt, getBeatsForChapter } from "./plot-beats";
import { stripRomanizationHints } from "./text-cleanup";

type ChapterAIResponse = {
  text?: string;
  sceneSet?: string | null;
  scenes?: Array<{ visual?: string; text?: string }>;
  vocabLayer?: Array<{ word?: string; translation?: string; context?: string }>;
  eventsThatHappened?: string[];
  whatHappened?: string;
  translationQuiz?: {
    sentence?: string;
    correct?: string;
    distractors?: string[];
  };
  completedBeatIds?: string[];
};

function normalizeVocabLayer(
  raw: ChapterAIResponse["vocabLayer"],
  languageName: string,
): VocabItem[] {
  if (!Array.isArray(raw)) return [];
  const lang = languageName.toLowerCase();
  return raw
    .filter(
      (item): item is { word: string; translation: string; context: string } =>
        typeof item?.word === "string" &&
        item.word.trim().length > 0 &&
        typeof item?.translation === "string" &&
        typeof item?.context === "string",
    )
    .map((item) => ({
      word: item.word.trim(),
      translation: item.translation.trim(),
      context: item.context.trim(),
    }))
    .filter((item) => isPlausibleTargetWord(item.word, lang));
}

/** Reject obvious junk tokens (e.g. Chinese chars / latin-only for Korean). */
function isPlausibleTargetWord(word: string, languageNameLower: string): boolean {
  if (languageNameLower.includes("korean")) {
    return /[\uAC00-\uD7A3]/.test(word) && !/[\u4E00-\u9FFF]/.test(word);
  }
  if (languageNameLower.includes("japanese")) {
    return /[\u3040-\u30FF\u4E00-\u9FFF]/.test(word);
  }
  if (languageNameLower.includes("chinese")) {
    return /[\u4E00-\u9FFF]/.test(word);
  }
  if (languageNameLower.includes("arabic")) {
    return /[\u0600-\u06FF]/.test(word);
  }
  if (languageNameLower.includes("russian")) {
    return /[\u0400-\u04FF]/.test(word);
  }
  if (languageNameLower.includes("hindi")) {
    return /[\u0900-\u097F]/.test(word);
  }
  // Latin-script languages: keep normal words, drop empty/symbol junk.
  return /[\p{L}]/u.test(word);
}

function normalizeScenes(
  raw: ChapterAIResponse["scenes"],
  includeVisualBeats: boolean,
): ChapterScene[] {
  if (!includeVisualBeats || !Array.isArray(raw)) return [];
  return raw
    .map((scene) => ({
      text: stripRomanizationHints(
        typeof scene?.text === "string" ? scene.text.trim() : "",
      ),
      visual: typeof scene?.visual === "string" ? scene.visual.trim() : "",
    }))
    .filter((scene) => scene.visual.length > 0 || scene.text.length > 0);
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function normalizeTranslationQuiz(
  raw: ChapterAIResponse["translationQuiz"],
): TranslationQuiz | null {
  const sentence = stripRomanizationHints(
    typeof raw?.sentence === "string" ? raw.sentence.trim() : "",
  );
  const correct = typeof raw?.correct === "string" ? raw.correct.trim() : "";
  const distractors = Array.isArray(raw?.distractors)
    ? raw.distractors
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0 && item.toLowerCase() !== correct.toLowerCase())
    : [];

  if (!sentence || !correct || distractors.length < 2) return null;

  const choices = shuffle([correct, ...distractors.slice(0, 3)]);
  const correctIndex = choices.findIndex((choice) => choice === correct);
  if (correctIndex < 0) return null;

  return { sentence, choices, correctIndex };
}

function mergeCompletedBeatIds(current: string[], added: string[]): string[] {
  return [...new Set([...current, ...added.filter((id) => typeof id === "string" && id.trim())])];
}

function mergeEventsSoFar(current: string[], added: string[], chapterNumber: number): string[] {
  const next = [...current];
  for (const event of added) {
    const trimmed = typeof event === "string" ? event.trim() : "";
    if (!trimmed) continue;
    const line = trimmed.startsWith(`Ch${chapterNumber}`) ? trimmed : `Ch${chapterNumber}: ${trimmed}`;
    if (!next.includes(line)) next.push(line);
  }
  return next;
}

/**
 * Generates one chapter from the Plot Bible beat sheet + Living Context position.
 * Saves new vocabLayer words into introducedWords for later chapters.
 * Updates plot position (completedBeatIds, eventsSoFar) so later chapters never repeat.
 */
export async function generateAndSaveChapter(input: {
  story: Story;
  language: UserLanguage;
  chapterNumber: number;
}): Promise<Chapter> {
  assertAiConfigured();

  const bible = await getPlotBible(input.story.id);
  if (!bible) {
    throw new Error("Plot Bible not found. Open the book first to generate the story arc.");
  }

  const context = await getLivingContext(input.story.id);
  if (!context) {
    throw new Error("Living Context not found for this story.");
  }

  if (input.chapterNumber < 1 || input.chapterNumber > bible.chapterCount) {
    throw new Error(`Chapter ${input.chapterNumber} is outside this story's arc.`);
  }

  // Never regenerate — return the saved chapter if it already exists.
  const existing = await getChapter(input.story.id, input.chapterNumber);
  if (existing) {
    if (input.story.currentChapter !== input.chapterNumber) {
      await updateStoryChapter(input.story.id, input.chapterNumber);
    }
    return existing;
  }

  const chapterBeats = getBeatsForChapter(bible, input.chapterNumber);
  const focus = focusPatterns(input.language.currentGrammarId, input.language.knownGrammarIds ?? []);
  const described = describeFocus(focus);
  const focusIds = new Set(focus.map((pattern) => pattern.id));
  const lexicon = input.language.lexicon ?? [];
  const wordCap = input.language.wordCap ?? STARTER_WORD_CAP;
  const newWordBudget = Math.max(0, wordCap - lexicon.length);
  const knownLabels = (input.language.knownGrammarIds ?? [])
    .filter((id) => !focusIds.has(id))
    .map((id) => grammarById(id)?.learnerLabel)
    .filter((label): label is string => !!label);
  const includeVisualBeats = shouldIncludeVisualBeats(input.language.level);

  const result = await generateFromPrompt("chapter.generate", {
    chapterNumber: input.chapterNumber,
    chapterCount: bible.chapterCount,
    languageName: input.language.languageName,
    level: input.language.level,
    chapterBeats: formatBeatsForPrompt(chapterBeats),
    completedBeatIds: context.completedBeatIds,
    eventsSoFar: context.eventsSoFar,
    knownWords: lexicon,
    grammarLabel: described.label,
    grammarInstruction: described.instruction,
    knownGrammarLabels: knownLabels,
    newWordBudget,
    includeVisualBeats,
  });

  const parsed = parseAIJson<ChapterAIResponse>(result.text);
  const scenes = normalizeScenes(parsed.scenes, includeVisualBeats);
  const textFromScenes = scenes
    .map((s) => s.text)
    .filter(Boolean)
    .join("\n\n");
  const text = stripRomanizationHints(
    (typeof parsed.text === "string" ? parsed.text.trim() : "") || textFromScenes,
  );

  if (!text) {
    throw new Error("AI returned an empty chapter.");
  }

  const sceneSet =
    includeVisualBeats && typeof parsed.sceneSet === "string" && parsed.sceneSet.trim()
      ? parsed.sceneSet.trim()
      : null;

  const vocabLayer = normalizeVocabLayer(parsed.vocabLayer, input.language.languageName);
  const freshWords = vocabLayer
    .map((item) => item.word)
    .filter((word) => !lexicon.some((known) => known.toLowerCase() === word.toLowerCase()));
  const acceptedWords = freshWords.slice(0, Math.max(0, newWordBudget));
  const keptVocab = vocabLayer.filter((item) =>
    acceptedWords.some((word) => word.toLowerCase() === item.word.toLowerCase()),
  );
  const whatHappened =
    typeof parsed.whatHappened === "string" && parsed.whatHappened.trim()
      ? parsed.whatHappened.trim()
      : null;
  const translationQuiz = normalizeTranslationQuiz(parsed.translationQuiz);

  const chapter = await saveChapter({
    storyId: input.story.id,
    chapterNumber: input.chapterNumber,
    text,
    sceneSet,
    scenes,
    vocabLayer: keptVocab,
    grammarId: focus[focus.length - 1]!.id,
    whatHappened,
    translationQuiz,
  });

  const reportedBeatIds = Array.isArray(parsed.completedBeatIds)
    ? parsed.completedBeatIds.filter((id): id is string => typeof id === "string")
    : [];
  const beatIdsThisChapter =
    reportedBeatIds.length > 0 ? reportedBeatIds : chapterBeats.map((b) => b.id);

  const reportedEvents = Array.isArray(parsed.eventsThatHappened)
    ? parsed.eventsThatHappened.filter((e): e is string => typeof e === "string")
    : [`Ch${input.chapterNumber}: Chapter events recorded.`];

  await updateLivingContext(input.story.id, {
    chapterNumber: input.chapterNumber,
    completedBeatIds: mergeCompletedBeatIds(context.completedBeatIds, beatIdsThisChapter),
    eventsSoFar: mergeEventsSoFar(context.eventsSoFar, reportedEvents, input.chapterNumber),
    introducedWords: [...new Set([...context.introducedWords, ...acceptedWords])],
  });

  await updateLanguageLearning(input.story.userId, input.language.id, {
    lexicon: [...new Set([...lexicon, ...acceptedWords])],
  });

  await updateStoryChapter(input.story.id, input.chapterNumber);

  return chapter;
}
