/**
 * Universal beginner grammar ladder, described in English.
 * The chapter model realizes each step in the learner's target language.
 */
export type GrammarPattern = {
  id: string;
  /** Short label shown to the reader. */
  learnerLabel: string;
  /** Constraint sent to the chapter model. */
  instruction: string;
};

export const GRAMMAR_LADDER: GrammarPattern[] = [
  {
    id: "svo-present",
    learnerLabel: "who does what",
    instruction:
      "Only one short clause in the present: who + does + what. No questions, no past, no because/so, no joining two clauses.",
  },
  {
    id: "simple-questions",
    learnerLabel: "yes/no and where/what questions",
    instruction:
      "You may use the simple present clause, plus yes/no questions and simple where/what questions. No past. No because/so.",
  },
  {
    id: "and-but",
    learnerLabel: "and / but",
    instruction:
      "You may join two short present clauses with and or but. No past. No because/so.",
  },
  {
    id: "simple-past",
    learnerLabel: "simple past",
    instruction:
      "Same short clause as before, now in the simple past. You may still use and/but and simple questions. No because/so.",
  },
  {
    id: "because-so",
    learnerLabel: "because / so",
    instruction:
      "You may add because or so to link a reason and a result. Stay with short clauses. No new tenses beyond simple present and simple past.",
  },
];

/** Absolute beginners may use this many words. The cap grows only when they confirm the list. */
export const STARTER_WORD_CAP = 10;

/** Words added to the cap each time the reader confirms the current list. */
export const WORD_CAP_STEP = 10;

export function firstGrammar(): GrammarPattern {
  return GRAMMAR_LADDER[0]!;
}

export function grammarById(id: string | null | undefined): GrammarPattern | null {
  if (!id) return null;
  return GRAMMAR_LADDER.find((pattern) => pattern.id === id) ?? null;
}

export function nextGrammar(id: string): GrammarPattern | null {
  const index = GRAMMAR_LADDER.findIndex((pattern) => pattern.id === id);
  if (index < 0 || index >= GRAMMAR_LADDER.length - 1) return null;
  return GRAMMAR_LADDER[index + 1]!;
}

export function resolveCurrentGrammar(currentGrammarId: string | null | undefined): GrammarPattern {
  return grammarById(currentGrammarId) ?? firstGrammar();
}

/** Pattern 2. A new learner's frontier, so patterns 1 and 2 are both in play. */
export function beginnerFrontier(): GrammarPattern {
  return GRAMMAR_LADDER[1]!;
}

/**
 * Patterns the next chapter may teach.
 * A learner who has confirmed nothing gets patterns 1 and 2 together.
 * After that, the frontier is one new pattern; earlier ones stay allowed.
 */
export function focusPatterns(
  currentGrammarId: string | null | undefined,
  knownIds: string[],
): GrammarPattern[] {
  const known = new Set(knownIds);
  const stored = resolveCurrentGrammar(currentGrammarId);
  const frontier =
    known.size === 0 && stored.id === firstGrammar().id ? beginnerFrontier() : stored;
  const end = GRAMMAR_LADDER.findIndex((pattern) => pattern.id === frontier.id);
  const focus = GRAMMAR_LADDER.slice(0, Math.max(0, end) + 1).filter(
    (pattern) => !known.has(pattern.id),
  );
  return focus.length > 0 ? focus : [frontier];
}

/** Label for a saved chapter. Beginner chapters store pattern 2 and used patterns 1 and 2. */
export function chapterFocusLabel(grammarId: string): string {
  if (grammarId === "simple-questions") {
    return describeFocus(GRAMMAR_LADDER.slice(0, 2)).label;
  }
  return grammarById(grammarId)?.learnerLabel ?? firstGrammar().learnerLabel;
}

/** Prompt text for the patterns in focus. The beginner pair is one combined rule. */
export function describeFocus(patterns: GrammarPattern[]): { label: string; instruction: string } {
  const pair =
    patterns.length === 2 &&
    patterns[0]?.id === "svo-present" &&
    patterns[1]?.id === "simple-questions";
  if (pair) {
    return {
      label: "who does what, and yes/no or where/what questions",
      instruction:
        "Use short present clauses (who + does + what) and yes/no or simple where/what questions. No past. No and/but. No because/so. No other clause types.",
    };
  }
  return {
    label: patterns.map((pattern) => pattern.learnerLabel).join("; "),
    instruction: patterns.map((pattern) => pattern.instruction).join(" "),
  };
}
