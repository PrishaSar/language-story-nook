/** Common languages offered during onboarding. Expand later. */
export const LANGUAGE_OPTIONS = [
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese (Mandarin)" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "ru", name: "Russian" },
  { code: "nl", name: "Dutch" },
] as const;

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const CEFR_LABELS: Record<(typeof CEFR_LEVELS)[number], string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper intermediate",
  C1: "Advanced",
  C2: "Proficient",
};

/** Why the learner is studying — chips + optional custom. Blank → DEFAULT_LEARNING_REASON. */
export const LEARNING_REASON_OPTIONS = [
  "For fun",
  "For work",
  "Travel",
  "School / studies",
  "Family or friends",
  "Moving abroad",
  "Media (shows, books, games)",
] as const;

export const DEFAULT_LEARNING_REASON = "For fun";

