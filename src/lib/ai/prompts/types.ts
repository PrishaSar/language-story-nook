/** Every AI prompt in the app has a stable ID listed here. */
export type PromptId =
  | "plot-bible.generate"
  | "chapter.generate"
  | "vocab-review.generate"
  | "content-flag.summarize";

export type PromptStatus = "placeholder" | "active";

export type PromptMeta = {
  id: PromptId;
  label: string;
  description: string;
  /** Which implementation phase first uses this prompt. */
  phase: string;
  status: PromptStatus;
  /** All prompts start as placeholders — flip to false once tuned. */
  revisit: true;
};

export type PromptMessages = {
  system: string;
  user: string;
};

export type PromptRegistryEntry<TInput> = {
  meta: PromptMeta;
  build: (input: TInput) => PromptMessages;
};

export type PlotBiblePromptInput = {
  languageName: string;
  level: string;
  interests: string[];
  scenario: string;
  worldDescription: string;
};

export type ChapterPromptInput = {
  chapterNumber: number;
  chapterCount: number;
  languageName: string;
  level: string;
  chapterBeats: string;
  completedBeatIds: string[];
  eventsSoFar: string[];
  knownWords: string[];
};

export type VocabReviewPromptInput = {
  languageName: string;
  level: string;
  chapterText: string;
  targetWords: string[];
};

export type ContentFlagPromptInput = {
  chapterNumber: number;
  chapterText: string;
  userReport: string;
};

export type PromptInputMap = {
  "plot-bible.generate": PlotBiblePromptInput;
  "chapter.generate": ChapterPromptInput;
  "vocab-review.generate": VocabReviewPromptInput;
  "content-flag.summarize": ContentFlagPromptInput;
};
