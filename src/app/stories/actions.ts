"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  createStory,
  findStoryById,
  getPlotBible,
  getUserLanguageById,
  updateStoryStatus,
} from "@/lib/db";
import { requireLanguageProfile } from "@/lib/guards/language";
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

  const story = await createStory({
    userId: user.id,
    languageId,
    title,
    scenario,
    worldDescription,
  });

  redirect(`/stories/${story.id}`);
}

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

  const existingBible = await getPlotBible(storyId);
  if (existingBible && story.status !== "draft") {
    return { ok: true, alreadyStarted: true };
  }

  if (story.status !== "draft" && story.status !== "generating_plot") {
    return { error: "This book has already been opened." };
  }

  await updateStoryStatus(storyId, "generating_plot");

  try {
    await generateAndSavePlotBible({
      story,
      language,
      interests: user.interests,
    });
    await updateStoryStatus(storyId, "active");
    return { ok: true };
  } catch (err) {
    await updateStoryStatus(storyId, "draft");
    const message =
      err instanceof Error ? err.message : "Could not generate the plot. Please try again.";
    return { error: message };
  }
}
