import type { StoryScenario } from "@/lib/types";

const FANTASY_SEEDS = [
  "a misty harbor town where every shopkeeper knows a secret",
  "a boarding school perched on a cliff above stormy seas",
  "a marketplace that only appears under moonlight",
  "a forest village protected by old stone guardians",
  "a sky-train station connecting floating islands",
  "a dusty archive of forbidden maps beneath a library",
  "a quiet bakery that sells charms baked into bread",
  "a lighthouse that signals to travelers from another realm",
];

const REAL_LIFE_SEEDS = [
  "a neighborhood café where regulars trade stories every morning",
  "a university campus during the first week of classes",
  "a small train station in a city you are visiting alone",
  "a shared apartment kitchen on a rainy evening",
  "a bookstore with a reading nook in the back",
  "a weekend market full of street food and musicians",
  "an office break room where unexpected friendships start",
  "a seaside boardwalk at the start of summer",
];

function pick<T>(items: T[], salt: number): T {
  return items[Math.abs(salt) % items.length]!;
}

/**
 * Instant, local description suggestions (no LLM).
 * Clicking regenerate cycles through seeds shaped by scenario / genres / preferred world.
 */
export function suggestWorldDescription(input: {
  scenario: StoryScenario;
  preferredWorld?: string | null;
  preferredGenres?: string[];
  /** Change this (e.g. Date.now()) to get a different suggestion. */
  salt: number;
}): string {
  const seeds = input.scenario === "real_life" ? REAL_LIFE_SEEDS : FANTASY_SEEDS;
  const setting = pick(seeds, input.salt);
  const genre =
    input.preferredGenres && input.preferredGenres.length > 0
      ? pick(input.preferredGenres, input.salt + 3)
      : input.scenario === "real_life"
        ? "everyday adventure"
        : "gentle fantasy";

  if (input.preferredWorld?.trim()) {
    const world = input.preferredWorld.trim();
    const angles = [
      `A language-learning story inspired by ${world}, set in ${setting}. Tone: ${genre}.`,
      `An original tale with the vibe of ${world}: ${setting}, told with a ${genre} feel.`,
      `Somewhere that feels like ${world} — ${setting}. Keep the plot original; lean into ${genre}.`,
    ];
    return pick(angles, input.salt + 7);
  }

  const angles = [
    `You arrive in ${setting}. The story leans ${genre}.`,
    `Set in ${setting}, with a ${genre} tone and room for small mysteries.`,
    `Everyday life in ${setting} — until a ${genre}-flavored twist pulls you in.`,
  ];
  return pick(angles, input.salt + 11);
}
