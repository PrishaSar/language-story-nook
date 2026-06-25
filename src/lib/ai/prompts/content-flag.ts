import type { ContentFlagPromptInput, PromptRegistryEntry } from "./types";

/** TODO: revisit prompt — tune before Phase 7 (flag weird content). */
export const contentFlagSummarize: PromptRegistryEntry<ContentFlagPromptInput> = {
  meta: {
    id: "content-flag.summarize",
    label: "Content Flag Summarizer",
    description:
      "Summarizes a user report about plot errors or weird AI content for developer review.",
    phase: "Phase 7",
    status: "placeholder",
    revisit: true,
  },
  build: (input) => ({
    // TODO: revisit prompt
    system: `You summarize user feedback about AI-generated story content.
Identify whether the report describes a plot inconsistency, factual error, or off-tone content.
Output valid JSON only.`,
    // TODO: revisit prompt
    user: `Chapter ${input.chapterNumber} text:
${input.chapterText.slice(0, 800)}

User report: ${input.userReport}

Return JSON:
{
  "category": "plot_inconsistency | factual_error | off_tone | other",
  "summary": "...",
  "suggestedAction": "..."
}`,
  }),
};
