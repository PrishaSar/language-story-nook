"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateChapterOneAction, startStoryAction } from "../actions";

type Phase = "idle" | "plot" | "chapter";

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
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const canStart =
    status === "draft" || status === "generating_plot" || needsChapterOne;
  if (!canStart) return null;

  const loading = phase !== "idle";

  async function handleStart() {
    setError(null);

    try {
      if (!needsChapterOne) {
        setPhase("plot");
        const plotResult = await startStoryAction(storyId);
        if (plotResult?.error) {
          setError(plotResult.error);
          setPhase("idle");
          return;
        }
        router.refresh();
        if (plotResult.chapterReady) {
          setPhase("idle");
          return;
        }
      }

      setPhase("chapter");
      const chapterResult = await generateChapterOneAction(storyId);
      if (chapterResult?.error) {
        setError(chapterResult.error);
        setPhase("idle");
        router.refresh();
        return;
      }

      router.refresh();
      setPhase("idle");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong talking to the server.";
      setError(
        /fetch|network|Failed to fetch|timeout/i.test(message)
          ? "The request timed out or dropped — usually Ollama taking too long. Keep Ollama open and try again (progress may already be saved)."
          : message,
      );
      setPhase("idle");
      router.refresh();
    }
  }

  const label =
    phase === "plot"
      ? "Weaving your plot…"
      : phase === "chapter"
        ? "Writing Chapter 1…"
        : needsChapterOne
          ? "Begin Chapter 1"
          : "Open this book";

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handleStart} disabled={loading} className="btn-primary w-fit">
        {label}
      </button>
      {loading && (
        <p className="text-sm text-ink-muted">
          {phase === "plot"
            ? "Step 1/2: hidden plot arc. Local models can take a few minutes — don’t close this tab."
            : "Step 2/2: Chapter 1 only. Later chapters wait until you turn the page."}
        </p>
      )}
      {error && <p className="text-sm text-burgundy">{error}</p>}
    </div>
  );
}
