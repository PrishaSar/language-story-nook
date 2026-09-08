import { generateFromPrompt, parseAIJson } from "@/lib/ai";
import { initLivingContext, savePlotBible, updateLivingContext } from "@/lib/db";
import type { PlotBeat, PlotBible, Story, UserLanguage } from "@/lib/types";

type PlotBibleAIResponse = {
  chapterCount?: number;
  beats?: Array<{
    id?: string;
    chapter?: number;
    goal?: string;
    arc?: string;
    twist?: boolean;
  }>;
};

const VALID_ARCS = new Set<PlotBeat["arc"]>(["main", "subplot1", "subplot2"]);

function normalizeBeat(
  raw: NonNullable<PlotBibleAIResponse["beats"]>[number],
  index: number,
): PlotBeat | null {
  const chapter = Number(raw.chapter);
  const goal = typeof raw.goal === "string" ? raw.goal.trim() : "";
  const arc = raw.arc as PlotBeat["arc"];

  if (!chapter || chapter < 1 || !goal || !VALID_ARCS.has(arc)) return null;

  const id =
    typeof raw.id === "string" && raw.id.trim()
      ? raw.id.trim()
      : `${arc}-${chapter}-${index + 1}`;

  return {
    id,
    chapter,
    goal,
    arc,
    twist: raw.twist === true,
  };
}

function normalizePlotBible(
  raw: PlotBibleAIResponse,
): Omit<PlotBible, "id" | "storyId" | "generatedAt"> {
  const beats = (Array.isArray(raw.beats) ? raw.beats : [])
    .map((b, i) => normalizeBeat(b, i))
    .filter((b): b is PlotBeat => b !== null);

  const chapterCount = Math.min(
    8,
    Math.max(5, Number(raw.chapterCount) || Math.max(0, ...beats.map((b) => b.chapter)) || 6),
  );

  const clamped = beats.filter((b) => b.chapter >= 1 && b.chapter <= chapterCount);

  if (clamped.length === 0) {
    return {
      chapterCount,
      beats: Array.from({ length: chapterCount }, (_, i) => ({
        id: `main-${i + 1}`,
        chapter: i + 1,
        goal:
          i === 0
            ? "Introduce the protagonist and the world."
            : `Advance the main story in chapter ${i + 1}.`,
        arc: "main" as const,
        twist: i === 2,
      })),
    };
  }

  const seenIds = new Set<string>();
  const deduped = clamped.map((beat) => {
    let id = beat.id;
    let n = 2;
    while (seenIds.has(id)) {
      id = `${beat.id}-${n++}`;
    }
    seenIds.add(id);
    return { ...beat, id };
  });

  return { chapterCount, beats: deduped };
}

/**
 * Calls the AI plot-bible prompt, saves the beat sheet, and seeds Living Context.
 * PlotBible is never returned to the client — call only from server actions.
 */
export async function generateAndSavePlotBible(input: {
  story: Story;
  language: UserLanguage;
  interests: string[];
}): Promise<PlotBible> {
  // Only required when using the OpenAI block in src/lib/ai/provider.ts
  if (process.env.AI_PROVIDER === "openai" && !process.env.OPENAI_API_KEY) {
    throw new Error(
      "OpenAI API key is not configured. Add OPENAI_API_KEY to .env.local (see .env.example).",
    );
  }

  const result = await generateFromPrompt("plot-bible.generate", {
    languageName: input.language.languageName,
    level: input.language.level,
    interests: input.interests,
    scenario: input.story.scenario === "fantasy" ? "fantasy" : "real life",
    worldDescription: input.story.worldDescription,
  });

  const parsed = parseAIJson<PlotBibleAIResponse>(result.text);
  const bibleData = normalizePlotBible(parsed);
  const saved = await savePlotBible(input.story.id, bibleData);

  await initLivingContext(input.story.id);
  await updateLivingContext(input.story.id, {
    completedBeatIds: [],
    eventsSoFar: [],
  });

  return saved;
}
