import type { PromptRegistryEntry, PlotBiblePromptInput } from "./types";

/** TODO: revisit prompt — tune plot beat sheet structure before production. */
export const plotBibleGenerate: PromptRegistryEntry<PlotBiblePromptInput> = {
  meta: {
    id: "plot-bible.generate",
    label: "Plot Bible Generator",
    description:
      "Creates a per-chapter beat sheet (hidden arc) when the user opens a book.",
    phase: "Phase 3",
    status: "placeholder",
    revisit: true,
  },
  build: (input) => ({
    // TODO: revisit prompt
    system: `You are a story architect for a language-learning app.
Generate a structured plot bible as a PER-CHAPTER BEAT SHEET — not one long summary.
Each beat is a single concrete story goal for one chapter. Beats must not overlap or repeat.
The story must have 5–8 chapters with 2–3 beats marked twist: true on main arc.
Include subplot1 beats woven through chapters 2–6 and optional subplot2 beats resolving by chapter 7.
Every beat needs a unique id (e.g. main-1, subplot1-3).
Output valid JSON only.`,
    // TODO: revisit prompt
    user: `Create a plot beat sheet for a ${input.scenario} story.
Story setting (from this book): ${input.worldDescription}.
Preferred genres: ${input.preferredGenres.join(", ") || "general fiction"}.
Media they consume most (mirror pacing/tone when useful — e.g. webcomic = short punchy beats, news = clear factual-feeling scenes, TV = episodic hooks): ${input.preferredMedia.join(", ") || "general entertainment"}.
${
  input.preferredWorld
    ? `Preferred fictional world (lean into tone, tropes, and setting vibes of "${input.preferredWorld}" — invent ORIGINAL characters and plot; do not retell copyrighted stories): ${input.preferredWorld}.`
    : "No preferred fictional world — invent an original setting from the description above."
}
Target language: ${input.languageName}. Learner level: ${input.level}.
User interests: ${input.interests.join(", ") || "general fiction"}.

Return JSON with this shape:
{
  "chapterCount": 6,
  "beats": [
    { "id": "main-1", "chapter": 1, "goal": "Introduce protagonist and ordinary world", "arc": "main", "twist": false },
    { "id": "subplot1-2", "chapter": 2, "goal": "Hint at the hidden connection", "arc": "subplot1", "twist": false },
    { "id": "main-3", "chapter": 3, "goal": "Major revelation changes everything", "arc": "main", "twist": true }
  ]
}

Rules:
- chapterCount between 5 and 8
- each chapter 1..chapterCount must have at least one "main" beat
- arc is one of: main, subplot1, subplot2
- twist is true only on 2-3 main beats across the full story
- goals must be specific and sequential — no beat should repeat a prior beat's events`,
  }),
};
