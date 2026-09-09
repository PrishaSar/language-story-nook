"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startStoryAction } from "../actions";

export function StartStoryButton({
  storyId,
  status,
  needsChapterOne = false,
}: {
  storyId: string;
  status: string;
  /** Active story that has a plot but never got Chapter 1 (resume path). */
  needsChapterOne?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canStart =
    status === "draft" || status === "generating_plot" || needsChapterOne;
  if (!canStart) return null;

  async function handleStart() {
    setLoading(true);
    setError(null);
    const result = await startStoryAction(storyId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  const label = needsChapterOne
    ? loading
      ? "Writing Chapter 1…"
      : "Begin Chapter 1"
    : loading
      ? "Opening your book…"
      : "Open this book";

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handleStart} disabled={loading} className="btn-primary w-fit">
        {label}
      </button>
      {loading && (
        <p className="text-sm text-ink-muted">
          {needsChapterOne
            ? "Generating Chapter 1 only — later chapters wait until you turn the page."
            : "Writing the hidden plot arc, then Chapter 1 — this may take a moment."}
        </p>
      )}
      {error && <p className="text-sm text-burgundy">{error}</p>}
    </div>
  );
}
