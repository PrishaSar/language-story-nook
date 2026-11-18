"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmGrammarAction, confirmVocabAction } from "../actions";

export function GrammarConfirm({
  storyId,
  learnerLabel,
  canConfirmGrammar,
  wordCount,
  canConfirmVocab,
}: {
  storyId: string;
  learnerLabel: string;
  canConfirmGrammar: boolean;
  wordCount: number;
  canConfirmVocab: boolean;
}) {
  const router = useRouter();
  const [grammarLoading, setGrammarLoading] = useState(false);
  const [vocabLoading, setVocabLoading] = useState(false);
  const [grammarDone, setGrammarDone] = useState(false);
  const [vocabDone, setVocabDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGrammar() {
    setGrammarLoading(true);
    setError(null);
    const result = await confirmGrammarAction(storyId);
    if (result?.error) {
      setError(result.error);
      setGrammarLoading(false);
      return;
    }
    setGrammarDone(true);
    setGrammarLoading(false);
    router.refresh();
  }

  async function handleVocab() {
    setVocabLoading(true);
    setError(null);
    const result = await confirmVocabAction(storyId);
    if (result?.error) {
      setError(result.error);
      setVocabLoading(false);
      return;
    }
    setVocabDone(true);
    setVocabLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
      <p className="text-sm text-ink">
        This chapter uses: <span className="font-medium">{learnerLabel}</span>
      </p>
      {canConfirmGrammar && !grammarDone ? (
        <button
          type="button"
          onClick={handleGrammar}
          disabled={grammarLoading}
          className="btn-secondary w-fit text-sm"
        >
          {grammarLoading ? "Saving…" : "I know this grammar"}
        </button>
      ) : (
        <p className="text-sm text-ink-muted">
          {grammarDone
            ? "Saved. The next chapter can use a new pattern."
            : "You already know this grammar."}
        </p>
      )}

      <p className="text-sm text-ink">
        Words in this list: <span className="font-medium">{wordCount}</span>
      </p>
      {canConfirmVocab && !vocabDone ? (
        <button
          type="button"
          onClick={handleVocab}
          disabled={vocabLoading}
          className="btn-secondary w-fit text-sm"
        >
          {vocabLoading ? "Saving…" : "I know these words"}
        </button>
      ) : (
        <p className="text-sm text-ink-muted">
          {vocabDone
            ? "Saved. The next chapter can add more words."
            : wordCount === 0
              ? "Words show up after the first chapter is written."
              : "You already know these words."}
        </p>
      )}
      {error && <p className="text-sm text-burgundy">{error}</p>}
    </div>
  );
}
