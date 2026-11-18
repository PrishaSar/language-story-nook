import { randomUUID } from "crypto";
import { readJsonFile, writeJsonFile } from "./file-store";
import type {
  Chapter,
  LivingContext,
  PlotBible,
  Story,
  StoryScenario,
  StoryStatus,
} from "../types";

const STORIES_FILE = "stories.json";
const PLOT_BIBLES_FILE = "plot-bibles.json";
const CHAPTERS_FILE = "chapters.json";
const LIVING_CONTEXTS_FILE = "living-contexts.json";

async function readStories(): Promise<Story[]> {
  return readJsonFile<Story[]>(STORIES_FILE, []);
}

async function writeStories(stories: Story[]): Promise<void> {
  await writeJsonFile(STORIES_FILE, stories);
}

async function readPlotBibles(): Promise<PlotBible[]> {
  return readJsonFile<PlotBible[]>(PLOT_BIBLES_FILE, []);
}

async function writePlotBibles(bibles: PlotBible[]): Promise<void> {
  await writeJsonFile(PLOT_BIBLES_FILE, bibles);
}

async function readChapters(): Promise<Chapter[]> {
  return readJsonFile<Chapter[]>(CHAPTERS_FILE, []);
}

async function writeChapters(chapters: Chapter[]): Promise<void> {
  await writeJsonFile(CHAPTERS_FILE, chapters);
}

async function readLivingContexts(): Promise<LivingContext[]> {
  return readJsonFile<LivingContext[]>(LIVING_CONTEXTS_FILE, []);
}

async function writeLivingContexts(contexts: LivingContext[]): Promise<void> {
  await writeJsonFile(LIVING_CONTEXTS_FILE, contexts);
}

export async function createStory(input: {
  userId: string;
  languageId: string;
  title: string;
  scenario: StoryScenario;
  worldDescription: string;
}): Promise<Story> {
  const stories = await readStories();
  const now = new Date().toISOString();
  const story: Story = {
    id: randomUUID(),
    userId: input.userId,
    languageId: input.languageId,
    title: input.title.trim(),
    scenario: input.scenario,
    worldDescription: input.worldDescription.trim(),
    status: "draft",
    currentChapter: 0,
    createdAt: now,
    updatedAt: now,
  };
  stories.push(story);
  await writeStories(stories);
  return story;
}

export async function findStoryById(id: string): Promise<Story | null> {
  const stories = await readStories();
  return stories.find((s) => s.id === id) ?? null;
}

export async function listStoriesByUser(userId: string): Promise<Story[]> {
  const stories = await readStories();
  return stories
    .filter((s) => s.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function updateStoryStatus(
  storyId: string,
  status: StoryStatus,
): Promise<Story | null> {
  const stories = await readStories();
  const idx = stories.findIndex((s) => s.id === storyId);
  if (idx === -1) return null;
  stories[idx] = {
    ...stories[idx],
    status,
    updatedAt: new Date().toISOString(),
  };
  await writeStories(stories);
  return stories[idx];
}

export async function updateStoryChapter(
  storyId: string,
  currentChapter: number,
): Promise<Story | null> {
  const stories = await readStories();
  const idx = stories.findIndex((s) => s.id === storyId);
  if (idx === -1) return null;
  stories[idx] = {
    ...stories[idx],
    currentChapter,
    updatedAt: new Date().toISOString(),
  };
  await writeStories(stories);
  return stories[idx];
}

/** Server-only — never expose to client API responses. */
export async function savePlotBible(
  storyId: string,
  bible: Omit<PlotBible, "id" | "storyId" | "generatedAt">,
): Promise<PlotBible> {
  const bibles = await readPlotBibles();
  const existing = bibles.findIndex((b) => b.storyId === storyId);
  const record: PlotBible = {
    id: randomUUID(),
    storyId,
    ...bible,
    generatedAt: new Date().toISOString(),
  };
  if (existing >= 0) {
    bibles[existing] = record;
  } else {
    bibles.push(record);
  }
  await writePlotBibles(bibles);
  return record;
}

export async function getPlotBible(storyId: string): Promise<PlotBible | null> {
  const bibles = await readPlotBibles();
  const bible = bibles.find((b) => b.storyId === storyId);
  if (!bible || !Array.isArray((bible as PlotBible).beats)) return null;
  return bible as PlotBible;
}

export async function saveChapter(
  chapter: Omit<Chapter, "id" | "generatedAt">,
): Promise<Chapter> {
  const chapters = await readChapters();
  const record: Chapter = {
    id: randomUUID(),
    ...chapter,
    generatedAt: new Date().toISOString(),
  };
  const existing = chapters.findIndex(
    (c) => c.storyId === chapter.storyId && c.chapterNumber === chapter.chapterNumber,
  );
  if (existing >= 0) {
    chapters[existing] = record;
  } else {
    chapters.push(record);
  }
  await writeChapters(chapters);
  return record;
}

export async function getChapter(
  storyId: string,
  chapterNumber: number,
): Promise<Chapter | null> {
  const chapters = await readChapters();
  const chapter = chapters.find(
    (c) => c.storyId === storyId && c.chapterNumber === chapterNumber,
  );
  if (!chapter) return null;
  return {
    ...chapter,
    sceneSet: chapter.sceneSet ?? null,
    scenes: chapter.scenes ?? [],
    vocabLayer: chapter.vocabLayer ?? [],
    grammarId: chapter.grammarId ?? null,
    whatHappened: chapter.whatHappened ?? null,
    translationQuiz: chapter.translationQuiz ?? null,
  };
}

export async function listChapters(storyId: string): Promise<Chapter[]> {
  const chapters = await readChapters();
  return chapters
    .filter((c) => c.storyId === storyId)
    .sort((a, b) => a.chapterNumber - b.chapterNumber);
}

export async function initLivingContext(storyId: string): Promise<LivingContext> {
  const contexts = await readLivingContexts();
  const existing = contexts.find((c) => c.storyId === storyId);
  if (existing) return existing;

  const context: LivingContext = {
    id: randomUUID(),
    storyId,
    chapterNumber: 0,
    completedBeatIds: [],
    eventsSoFar: [],
    introducedWords: [],
    learnedWords: [],
    updatedAt: new Date().toISOString(),
  };
  contexts.push(context);
  await writeLivingContexts(contexts);
  return context;
}

export async function getLivingContext(storyId: string): Promise<LivingContext | null> {
  const contexts = await readLivingContexts();
  const raw = contexts.find((c) => c.storyId === storyId);
  if (!raw) return null;
  return {
    ...raw,
    completedBeatIds: raw.completedBeatIds ?? [],
    eventsSoFar: raw.eventsSoFar ?? [],
    introducedWords: raw.introducedWords ?? [],
    learnedWords: raw.learnedWords ?? [],
  };
}

export async function updateLivingContext(
  storyId: string,
  patch: Partial<
    Pick<
      LivingContext,
      | "chapterNumber"
      | "completedBeatIds"
      | "eventsSoFar"
      | "introducedWords"
      | "learnedWords"
    >
  >,
): Promise<LivingContext | null> {
  const contexts = await readLivingContexts();
  const idx = contexts.findIndex((c) => c.storyId === storyId);
  if (idx === -1) return null;
  contexts[idx] = {
    ...contexts[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeLivingContexts(contexts);
  return contexts[idx];
}
