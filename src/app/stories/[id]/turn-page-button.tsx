"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { turnPageAction } from "../actions";

export function TurnPageButton({
  storyId,
  disabled,
  isLastChapter,
}: {
  storyId: string;
  disabled?: boolean;
  isLastChapter?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTurn() {
    setLoading(true);
    setError(null);
    const result = await turnPageAction(storyId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  if (isLastChapter) {
    return (
      <p className="text-sm text-ink-muted">
        You&apos;ve reached the end of this book.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleTurn}
        disabled={disabled || loading}
        className="btn-secondary w-fit"
      >
        {loading ? "Writing the next chapter…" : "Turn the page →"}
      </button>
      {loading && (
        <p className="text-sm text-ink-muted">
          Only this next chapter is generated — nothing further ahead.
        </p>
      )}
      {error && <p className="text-sm text-burgundy">{error}</p>}
    </div>
  );
}
