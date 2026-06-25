/** Deterministic spine color and height from story id — consistent between renders. */
const SPINE_COLORS = [
  "#6B3340", // burgundy
  "#2D5A4A", // emerald
  "#5C4A3A", // worn leather
  "#8B4A52", // dusty wine
  "#3D4F5F", // slate
  "#4A3728", // dark umber
  "#6B5344", // taupe brown
  "#7A4A3A", // terracotta deep
] as const;

export type SpineStyle = {
  height: number;
  color: string;
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

export function getSpineStyle(storyId: string): SpineStyle {
  const hash = hashString(storyId);
  return {
    height: 140 + (hash % 72),
    color: SPINE_COLORS[hash % SPINE_COLORS.length],
  };
}

/** Ribbon bookmark = story has been started or has reading progress. */
export function hasBookmark(story: {
  status: string;
  currentChapter: number;
}): boolean {
  if (story.currentChapter > 0) return true;
  return ["ready_for_plot", "generating_plot", "active", "completed"].includes(
    story.status,
  );
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Unopened",
    ready_for_plot: "Opening…",
    generating_plot: "Weaving plot…",
    active: "Ready to read",
    completed: "Finished",
  };
  return labels[status] ?? status;
}
