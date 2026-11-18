"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { turnBackPageAction, turnPageAction } from "../actions";

export function ChapterNavButtons({
  storyId,
  canGoBack,
  isLastChapter,
}: {
  storyId: string;
  canGoBack: boolean;
  isLastChapter?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"back" | "forward" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBack() {
    setLoading("back");
    setError(null);
    const result = await turnBackPageAction(storyId);
    if (result?.error) {
      setError(result.error);
      setLoading(null);
      return;
    }
    router.refresh();
    setLoading(null);
  }

  async function handleForward() {
    setLoading("forward");
    setError(null);
    const result = await turnPageAction(storyId);
    if (result?.error) {
      setError(result.error);
      setLoading(null);
      return;
    }
    router.refresh();
    setLoading(null);
  }

  const busy = loading !== null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={!canGoBack || busy}
          className="btn-secondary w-fit disabled:opacity-40"
        >
          {loading === "back" ? "Turning back…" : "← Turn back the page"}
        </button>

        {isLastChapter ? (
          <p className="self-center text-sm text-ink-muted">
            You&apos;ve reached the end of this book.
          </p>
        ) : (
          <button
            type="button"
            onClick={handleForward}
            disabled={busy}
            className="btn-secondary w-fit"
          >
            {loading === "forward" ? "Writing the next chapter…" : "Turn the page →"}
          </button>
        )}
      </div>
      {loading === "forward" && (
        <p className="text-sm text-ink-muted">
          Only this next chapter is generated — nothing further ahead.
        </p>
      )}
      {loading === "back" && (
        <p className="text-sm text-ink-muted">Showing the previous chapter (already saved).</p>
      )}
      {error && <p className="text-sm text-burgundy">{error}</p>}
    </div>
  );
}
