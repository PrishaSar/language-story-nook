import type { PlotBeat, PlotBible } from "@/lib/types";

export function getBeatsForChapter(bible: PlotBible, chapterNumber: number): PlotBeat[] {
  return bible.beats
    .filter((b) => b.chapter === chapterNumber)
    .sort((a, b) => a.arc.localeCompare(b.arc));
}

export function getPendingBeats(bible: PlotBible, completedBeatIds: string[]): PlotBeat[] {
  const done = new Set(completedBeatIds);
  return bible.beats.filter((b) => !done.has(b.id));
}

export function formatBeatsForPrompt(beats: PlotBeat[]): string {
  if (beats.length === 0) return "No specific beats — advance the story naturally.";
  return beats
    .map((b) => `- [${b.id}] (${b.arc}${b.twist ? ", twist" : ""}) ${b.goal}`)
    .join("\n");
}
