import { generateFromPrompt, parseAIJson } from "@/lib/ai";
import {
  getLivingContext,
  getPlotBible,
  saveChapter,
  updateLivingContext,
  updateStoryChapter,
} from "@/lib/db";
import type { Chapter, Story, UserLanguage, VocabItem } from "@/lib/types";
import { formatBeatsForPrompt, getBeatsForChapter } from "./plot-beats";

type ChapterAIResponse = {
  text?: string;
  vocabLayer?: Array<{ word?: string; translation?: string; context?: string }>;
  eventsThatHappened?: string[];
  completedBeatIds?: string[];
};

function normalizeVocabLayer(raw: ChapterAIResponse["vocabLayer"]): VocabItem[] {
  if (!Array.isArray(raw)) return [];
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
    }));
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
 * Updates plot position (completedBeatIds, eventsSoFar) so later chapters never repeat.
 */
export async function generateAndSaveChapter(input: {
  story: Story;
  language: UserLanguage;
  chapterNumber: number;
}): Promise<Chapter> {
  const provider = process.env.AI_PROVIDER ?? "openai";
  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key is not configured. Add OPENAI_API_KEY to .env.local (see .env.example).",
    );
  }

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

  const chapterBeats = getBeatsForChapter(bible, input.chapterNumber);
  const knownWords = [...context.learnedWords, ...context.introducedWords];

  const result = await generateFromPrompt("chapter.generate", {
    chapterNumber: input.chapterNumber,
    chapterCount: bible.chapterCount,
    languageName: input.language.languageName,
    level: input.language.level,
    chapterBeats: formatBeatsForPrompt(chapterBeats),
    completedBeatIds: context.completedBeatIds,
    eventsSoFar: context.eventsSoFar,
    knownWords,
  });

  const parsed = parseAIJson<ChapterAIResponse>(result.text);
  const text = typeof parsed.text === "string" ? parsed.text.trim() : "";
  if (!text) {
    throw new Error("AI returned an empty chapter.");
  }

  const vocabLayer = normalizeVocabLayer(parsed.vocabLayer);
  const newWords = vocabLayer.map((v) => v.word);

  const chapter = await saveChapter({
    storyId: input.story.id,
    chapterNumber: input.chapterNumber,
    text,
    vocabLayer,
  });

  const reportedBeatIds = Array.isArray(parsed.completedBeatIds)
    ? parsed.completedBeatIds.filter((id): id is string => typeof id === "string")
    : [];
  const beatIdsThisChapter =
    reportedBeatIds.length > 0
      ? reportedBeatIds
      : chapterBeats.map((b) => b.id);

  const reportedEvents = Array.isArray(parsed.eventsThatHappened)
    ? parsed.eventsThatHappened.filter((e): e is string => typeof e === "string")
    : [`Ch${input.chapterNumber}: Chapter events recorded.`];

  await updateLivingContext(input.story.id, {
    chapterNumber: input.chapterNumber,
    completedBeatIds: mergeCompletedBeatIds(context.completedBeatIds, beatIdsThisChapter),
    eventsSoFar: mergeEventsSoFar(context.eventsSoFar, reportedEvents, input.chapterNumber),
    introducedWords: [...new Set([...context.introducedWords, ...newWords])],
  });

  await updateStoryChapter(input.story.id, input.chapterNumber);

  return chapter;
}
