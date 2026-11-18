"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createStoryAction } from "../actions";
import { suggestWorldDescription } from "@/lib/stories/suggest-world-description";
import type { StoryScenario, UserLanguage } from "@/lib/types";

const initial = { error: null as string | null };

export function NewStoryForm({
  languages,
  preferredWorld,
  preferredGenres,
}: {
  languages: UserLanguage[];
  preferredWorld: string | null;
  preferredGenres: string[];
}) {
  const [scenario, setScenario] = useState<StoryScenario>("fantasy");
  const [worldDescription, setWorldDescription] = useState(() =>
    preferredWorld
      ? suggestWorldDescription({
          scenario: "fantasy",
          preferredWorld,
          preferredGenres,
          salt: 1,
        })
      : "",
  );

  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => {
      const result = await createStoryAction(formData);
      if (result?.error) return { error: result.error };
      return initial;
    },
    initial,
  );

  function regenerateDescription() {
    setWorldDescription(
      suggestWorldDescription({
        scenario,
        preferredWorld,
        preferredGenres,
        salt: Date.now(),
      }),
    );
  }

  if (languages.length === 0) {
    return (
      <div className="card-nook-dashed p-6 text-sm text-ink-muted">
        <p>Add a language before binding a new book to your shelf.</p>
        <Link href="/languages/add" className="btn-primary mt-4 inline-flex">
          Add a language
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="card-nook flex flex-col gap-5 p-6">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Story title (optional)
        <input
          name="title"
          placeholder="Auto-generated from description if left blank"
          className="input-nook"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Language
        <select
          name="languageId"
          required
          defaultValue={languages.find((l) => l.isActive)?.id ?? languages[0]?.id}
          className="input-nook"
        >
          {languages.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.languageName} ({lang.level})
              {lang.isActive ? " — active" : ""}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-ink">Scenario type</legend>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="radio"
            name="scenario"
            value="fantasy"
            checked={scenario === "fantasy"}
            onChange={() => setScenario("fantasy")}
          />
          Fantasy world
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="radio"
            name="scenario"
            value="real_life"
            checked={scenario === "real_life"}
            onChange={() => setScenario("real_life")}
          />
          Real-life scenario
        </label>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="worldDescription" className="text-sm font-medium text-ink">
            World or scenario description
          </label>
          <button
            type="button"
            onClick={regenerateDescription}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            Regenerate
          </button>
        </div>
        <textarea
          id="worldDescription"
          name="worldDescription"
          required
          rows={5}
          value={worldDescription}
          onChange={(e) => setWorldDescription(e.target.value)}
          placeholder={
            preferredWorld
              ? `e.g. A quiet corner of ${preferredWorld}, or invent your own setting…`
              : "Describe the setting — e.g. a medieval village where you run a bakery, or a space station orbiting Mars..."
          }
          className="input-nook"
        />
        <span className="text-xs font-normal text-ink-muted">
          Regenerate cycles local suggestions (no AI wait). Edit freely before binding.
          {preferredGenres.length > 0 || preferredWorld
            ? ` Uses your onboarding tastes${preferredGenres.length > 0 ? ` (${preferredGenres.join(", ")})` : ""}${preferredWorld ? ` · ${preferredWorld}` : ""}.`
            : ""}
        </span>
      </div>

      {state.error && <p className="text-sm text-burgundy">{state.error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Binding…" : "Bind to shelf"}
        </button>
        <Link href="/library" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
