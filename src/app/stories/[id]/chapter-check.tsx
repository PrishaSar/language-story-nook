"use client";

import { useState } from "react";
import type { TranslationQuiz } from "@/lib/types";

/**
 * After-chapter check: English recap + multiple-choice translation.
 *
 * BOOKMARK: later swap the choices for a free-response box graded by AI.
 * BOOKMARK: after WRITE_OWN_SENTENCE_START_CHAPTER, also ask the learner
 * to write their own sentence in the target language.
 */
export function ChapterCheck({
  whatHappened,
  quiz,
}: {
  whatHappened: string | null;
  quiz: TranslationQuiz | null;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  if (!whatHappened && !quiz) return null;

  const answered = picked !== null;
  const correct = answered && quiz !== null && picked === quiz.correctIndex;

  return (
    <div className="flex flex-col gap-5 border-t border-[var(--border)] pt-5">
      {whatHappened && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium tracking-wide text-gold uppercase">
            What happened
          </p>
          <p className="text-sm leading-relaxed text-ink">{whatHappened}</p>
        </div>
      )}

      {quiz && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium tracking-wide text-gold uppercase">
            Translate this sentence
          </p>
          <p className="story-prose">{quiz.sentence}</p>
          <div className="flex flex-col gap-2">
            {quiz.choices.map((choice, index) => {
              const isPick = picked === index;
              const isAnswer = index === quiz.correctIndex;
              let tone = "border-[var(--border)] text-ink";
              if (answered && isAnswer) tone = "border-gold text-ink";
              else if (answered && isPick && !isAnswer) tone = "border-burgundy text-burgundy";

              return (
                <button
                  key={`${index}-${choice}`}
                  type="button"
                  disabled={answered}
                  onClick={() => setPicked(index)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm leading-relaxed disabled:cursor-default ${tone}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
          {answered && (
            <p className={`text-sm ${correct ? "text-ink" : "text-burgundy"}`}>
              {correct ? "That’s the one." : `Not quite. ${quiz.choices[quiz.correctIndex]}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
