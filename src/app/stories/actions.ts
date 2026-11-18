"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  createStory,
  findStoryById,
  getChapter,
  getPlotBible,
  getUserLanguageById,
  updateLanguageLearning,
  updateStoryChapter,
  updateStoryStatus,
} from "@/lib/db";
import { WORD_CAP_STEP, focusPatterns, nextGrammar } from "@/lib/grammar/ladder";
import { requireLanguageProfile } from "@/lib/guards/language";
import { generateAndSaveChapter } from "@/lib/stories/generate-chapter";
import { generateAndSavePlotBible } from "@/lib/stories/generate-plot-bible";
import type { StoryScenario } from "@/lib/types";

export async function createStoryAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  requireLanguageProfile(user);

  const languageId = String(formData.get("languageId") ?? "");
  const scenario = String(formData.get("scenario") ?? "fantasy") as StoryScenario;
  const worldDescription = String(formData.get("worldDescription") ?? "").trim();
  const title =
    String(formData.get("title") ?? "").trim() ||
    worldDescription.slice(0, 60) ||
    "Untitled Story";

  if (!languageId) {
    return { error: "Select a language for this story." };
  }
  if (!worldDescription) {
    return { error: "Describe the world or scenario for your story." };
  }
  if (scenario !== "fantasy" && scenario !== "real_life") {
    return { error: "Invalid scenario type." };
  }

  const language = await getUserLanguageById(user.id, languageId);
  if (!language) {
    return { error: "Language not found on your profile." };
  }

  // Draft only — no plot or chapters until the user opens the book.
  const story = await createStory({
    userId: user.id,
    languageId,
    title,
    scenario,
    worldDescription,
  });

  redirect(`/stories/${story.id}`);
}

/**
 * Open the book: generate Plot Bible only (Chapter 1 is a separate step).
 * Keeping these apart avoids one huge Ollama call that can look like a browser crash.
 */
export async function startStoryAction(storyId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const story = await findStoryById(storyId);
  if (!story || story.userId !== user.id) {
    return { error: "Story not found." };
  }

  const language = await getUserLanguageById(user.id, story.languageId);
  if (!language) {
    return { error: "Language not found for this story." };
  }

  let working = story;
  let bible = await getPlotBible(storyId);

  if (!bible) {
    if (working.status !== "draft" && working.status !== "generating_plot") {
      return { error: "Plot Bible missing — cannot open this book." };
    }

    await updateStoryStatus(storyId, "generating_plot");

    try {
      bible = await generateAndSavePlotBible({
        story: working,
        language,
        interests: user.interests,
        preferredGenres: user.preferredGenres,
        preferredMedia: user.preferredMedia,
        preferredWorld: user.preferredWorld,
      });
    } catch (err) {
      await updateStoryStatus(storyId, "draft");
      const message = formatAiError(err, "Could not generate the plot. Please try again.");
      return { error: message };
    }

    const refreshed = await findStoryById(storyId);
    if (refreshed) working = refreshed;
  }

  await updateStoryStatus(storyId, "active");

  const chapterOne = await getChapter(storyId, 1);
  if (chapterOne) {
    if (working.currentChapter < 1) {
      await updateStoryChapter(storyId, 1);
    }
    return { ok: true, chapterReady: true };
  }

  return { ok: true, chapterReady: false };
}

/** Generate Chapter 1 only — call after the plot bible exists. */
export async function generateChapterOneAction(storyId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const story = await findStoryById(storyId);
  if (!story || story.userId !== user.id) {
    return { error: "Story not found." };
  }

  if (story.status !== "active" && story.status !== "completed") {
    return { error: "Open the book (generate the plot) before writing Chapter 1." };
  }

  const language = await getUserLanguageById(user.id, story.languageId);
  if (!language) {
    return { error: "Language not found for this story." };
  }

  const bible = await getPlotBible(storyId);
  if (!bible) {
    return { error: "Plot Bible not found. Open the book first." };
  }

  try {
    await generateAndSaveChapter({
      story,
      language,
      chapterNumber: 1,
    });
    return { ok: true };
  } catch (err) {
    const message = formatAiError(err, "Could not write Chapter 1. Please try again.");
    return { error: message };
  }
}

function formatAiError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  if (/JSON|Unexpected token|parse/i.test(raw)) {
    return `${fallback} The local model returned invalid JSON — try again, or use a stronger model.`;
  }
  if (/fetch failed|ECONNREFUSED|timeout|Timed out|AbortError/i.test(raw)) {
    return `${fallback} Ollama looks unreachable or overloaded — confirm \`ollama serve\` is running and try again.`;
  }
  return raw || fallback;
}

/**
 * Advance one chapter. Uses a saved chapter if it already exists;
 * otherwise generates only that next chapter (never further ahead).
 */
export async function turnPageAction(storyId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const story = await findStoryById(storyId);
  if (!story || story.userId !== user.id) {
    return { error: "Story not found." };
  }

  if (story.status !== "active" && story.status !== "completed") {
    return { error: "Open the book before turning pages." };
  }

  const language = await getUserLanguageById(user.id, story.languageId);
  if (!language) {
    return { error: "Language not found for this story." };
  }

  const bible = await getPlotBible(storyId);
  if (!bible) {
    return { error: "Plot Bible not found. Open the book first." };
  }

  const current = story.currentChapter > 0 ? story.currentChapter : 1;
  const nextNumber = current + 1;

  if (nextNumber > bible.chapterCount) {
    await updateStoryStatus(storyId, "completed");
    return { ok: true, completed: true };
  }

  const existing = await getChapter(storyId, nextNumber);
  if (existing) {
    await updateStoryChapter(storyId, nextNumber);
    return { ok: true, chapterNumber: nextNumber, reused: true };
  }

  try {
    const chapter = await generateAndSaveChapter({
      story,
      language,
      chapterNumber: nextNumber,
    });

    if (nextNumber >= bible.chapterCount) {
      await updateStoryStatus(storyId, "completed");
    }

    return { ok: true, chapterNumber: chapter.chapterNumber, reused: false };
  } catch (err) {
    const message = formatAiError(
      err,
      "Could not write the next chapter. Please try again.",
    );
    return { error: message };
  }
}

/**
 * Go to the previous chapter. Only uses already-saved chapters — never regenerates.
 */
export async function turnBackPageAction(storyId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const story = await findStoryById(storyId);
  if (!story || story.userId !== user.id) {
    return { error: "Story not found." };
  }

  if (story.status !== "active" && story.status !== "completed") {
    return { error: "Open the book before turning pages." };
  }

  const current = story.currentChapter > 0 ? story.currentChapter : 1;
  if (current <= 1) {
    return { error: "You're already on the first chapter." };
  }

  const prevNumber = current - 1;
  const existing = await getChapter(storyId, prevNumber);
  if (!existing) {
    return { error: `Chapter ${prevNumber} hasn't been written yet.` };
  }

  await updateStoryChapter(storyId, prevNumber);
  return { ok: true, chapterNumber: prevNumber };
}

/**
 * Mark the chapter's grammar pattern as known and point the language at the next one.
 * Turning the page does not do this.
 */
export async function confirmGrammarAction(storyId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const story = await findStoryById(storyId);
  if (!story || story.userId !== user.id) {
    return { error: "Story not found." };
  }

  const language = await getUserLanguageById(user.id, story.languageId);
  if (!language) {
    return { error: "Language not found for this story." };
  }

  const focus = focusPatterns(language.currentGrammarId, language.knownGrammarIds);
  const frontier = focus[focus.length - 1]!;
  if (language.knownGrammarIds.includes(frontier.id)) {
    return { ok: true, alreadyKnown: true };
  }

  const knownGrammarIds = [...new Set([...language.knownGrammarIds, ...focus.map((pattern) => pattern.id)])];
  const upcoming = nextGrammar(frontier.id);

  await updateLanguageLearning(user.id, language.id, {
    knownGrammarIds,
    currentGrammarId: upcoming?.id ?? frontier.id,
  });

  return { ok: true, nextLabel: upcoming?.learnerLabel ?? null };
}

/**
 * Raise the word cap. Grammar stays where it is.
 * Turning the page does not do this.
 */
export async function confirmVocabAction(storyId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const story = await findStoryById(storyId);
  if (!story || story.userId !== user.id) {
    return { error: "Story not found." };
  }

  const language = await getUserLanguageById(user.id, story.languageId);
  if (!language) {
    return { error: "Language not found for this story." };
  }

  if (language.lexicon.length === 0 || language.lexicon.length <= language.vocabConfirmedCount) {
    return { ok: true, alreadyKnown: true };
  }

  await updateLanguageLearning(user.id, language.id, {
    vocabConfirmedCount: language.lexicon.length,
    wordCap: language.lexicon.length + WORD_CAP_STEP,
  });

  return { ok: true, wordCap: language.lexicon.length + WORD_CAP_STEP };
}
