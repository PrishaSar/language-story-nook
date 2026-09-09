"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  createStory,
  findStoryById,
  getChapter,
  getPlotBible,
  getUserLanguageById,
  updateStoryChapter,
  updateStoryStatus,
} from "@/lib/db";
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
 * Open the book: generate Plot Bible (if needed), then Chapter 1 only.
 * Later chapters wait for "Turn the page".
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
        preferredWorld: user.preferredWorld,
      });
    } catch (err) {
      await updateStoryStatus(storyId, "draft");
      const message =
        err instanceof Error ? err.message : "Could not generate the plot. Please try again.";
      return { error: message };
    }

    const refreshed = await findStoryById(storyId);
    if (refreshed) working = refreshed;
  }

  await updateStoryStatus(storyId, "active");

  try {
    // Chapter 1 only — never pre-generate chapter 2+.
    await generateAndSaveChapter({
      story: { ...working, status: "active" },
      language,
      chapterNumber: 1,
    });
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not write Chapter 1. Please try again.";
    return { error: message };
  }
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
    const message =
      err instanceof Error ? err.message : "Could not write the next chapter. Please try again.";
    return { error: message };
  }
}
