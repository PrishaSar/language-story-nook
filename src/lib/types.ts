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
  /** Highest grammar pattern the next chapter may teach. */
  currentGrammarId: string;
  /** Patterns the reader has confirmed they know. */
  knownGrammarIds: string[];
  /** Closed word list in the target language. */
  lexicon: string[];
  /** How many words the list may hold. Grows only when the reader confirms the words. */
  wordCap: number;
  /** How many lexicon words the reader has already confirmed. */
  vocabConfirmedCount: number;
  /** Kept so older profiles still load. Word growth no longer follows grammar. */
  lexiconGrammarId: string | null;
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

/**
 * Multiple-choice translation check shown after a chapter.
 * BOOKMARK: later replace this with free-response answers graded by AI.
 */
export type TranslationQuiz = {
  /** One sentence from the chapter, in the target language. */
  sentence: string;
  /** English options, already shuffled. */
  choices: string[];
  correctIndex: number;
};

/** One cinematic beat: target-language lines, then an English stage action. */
export type ChapterScene = {
  /** Prose/dialogue in the learner's target language for this beat. */
  text: string;
  /** English stage action shown AFTER the target-language lines. */
  visual: string;
};

export type Chapter = {
  id: string;
  storyId: string;
  chapterNumber: number;
  /** Full chapter in the target language (scenes joined). */
  text: string;
  /** Optional English scene-setting line for the whole chapter (lower CEFR). */
  sceneSet: string | null;
  /**
   * Optional cinematic breakdown for lower CEFR levels.
   * Empty when visuals are off (higher levels).
   * Display order per beat: text, then visual (stage action).
   */
  scenes: ChapterScene[];
  vocabLayer: VocabItem[];
  /** Grammar pattern this chapter was written with. */
  grammarId: string | null;
  /** Short English recap shown to the reader after the chapter. */
  whatHappened: string | null;
  /** Multiple-choice “translate this sentence” check. Null on older chapters. */
  translationQuiz: TranslationQuiz | null;
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
