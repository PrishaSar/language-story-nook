"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startStoryAction } from "../actions";

export function StartStoryButton({ storyId, status }: { storyId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "draft" && status !== "generating_plot") return null;

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

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handleStart} disabled={loading} className="btn-primary w-fit">
        {loading ? "Weaving your plot…" : "Open this book"}
      </button>
      {loading && (
        <p className="text-sm text-ink-muted">
          The hidden story arc is being written — this may take a moment.
        </p>
      )}
      {error && <p className="text-sm text-burgundy">{error}</p>}
    </div>
  );
}
