/** CEFR proficiency levels — default scale for now; may expand later. */
export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const DEFAULT_CEFR_LEVEL: CEFRLevel = "A1";

export type LanguageProgress = {
  storiesCompleted: number;
  chaptersRead: number;
  wordsLearned: number;
};

/** One language the user is learning. Multiple supported in data model; UI focuses on one active. */
export type UserLanguage = {
  id: string;
  languageCode: string;
  languageName: string;
  level: CEFRLevel;
  reasonForLearning: string;
  progress: LanguageProgress;
  isActive: boolean;
  createdAt: string;
};

export type StoryScenario = "fantasy" | "real_life";

export type StoryStatus =
  | "draft"
  | "ready_for_plot"
  | "generating_plot"
  | "active"
  | "completed";

export type Story = {
  id: string;
  userId: string;
  languageId: string;
  title: string;
  scenario: StoryScenario;
  worldDescription: string;
  status: StoryStatus;
  currentChapter: number;
  createdAt: string;
  updatedAt: string;
};

/** A single story beat in the hidden Plot Bible — one concrete goal for a chapter. */
export type PlotBeat = {
  id: string;
  chapter: number;
  goal: string;
  arc: "main" | "subplot1" | "subplot2";
  twist?: boolean;
};

/** Hidden from the user — server-only story arc blueprint (per-chapter beat sheet). */
export type PlotBible = {
  id: string;
  storyId: string;
  chapterCount: number;
  beats: PlotBeat[];
  generatedAt: string;
};

export type VocabItem = {
  word: string;
  translation: string;
  context: string;
};

export type Chapter = {
  id: string;
  storyId: string;
  chapterNumber: number;
  text: string;
  vocabLayer: VocabItem[];
  generatedAt: string;
};

/** Per-story dynamic memory — tracks plot position, vocab, and what already happened. */
export type LivingContext = {
  id: string;
  storyId: string;
  /** Last chapter generated or read. */
  chapterNumber: number;
  /** Beat IDs from the Plot Bible that have been covered. */
  completedBeatIds: string[];
  /** Short bullets of story events so far — fed to AI to prevent repetition. */
  eventsSoFar: string[];
  introducedWords: string[];
  learnedWords: string[];
  updatedAt: string;
};

/** Safe story view for the client — never includes PlotBible. */
export type StoryPublic = Omit<Story, never>;
