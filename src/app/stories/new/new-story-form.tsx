"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createStoryAction } from "../actions";
import type { UserLanguage } from "@/lib/types";

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
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => {
      const result = await createStoryAction(formData);
      if (result?.error) return { error: result.error };
      return initial;
    },
    initial,
  );

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
          <input type="radio" name="scenario" value="fantasy" defaultChecked />
          Fantasy world
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="radio" name="scenario" value="real_life" />
          Real-life scenario
        </label>
      </fieldset>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        World or scenario description
        <textarea
          name="worldDescription"
          required
          rows={5}
          defaultValue={
            preferredWorld
              ? `A language-learning story inspired by ${preferredWorld}`
              : undefined
          }
          placeholder={
            preferredWorld
              ? `e.g. A quiet corner of ${preferredWorld}, or invent your own setting…`
              : "Describe the setting — e.g. a medieval village where you run a bakery, or a space station orbiting Mars..."
          }
          className="input-nook"
        />
        {(preferredGenres.length > 0 || preferredWorld) && (
          <span className="text-xs font-normal text-ink-muted">
            From onboarding
            {preferredGenres.length > 0 ? `: ${preferredGenres.join(", ")}` : ""}
            {preferredWorld ? ` · world vibe: ${preferredWorld}` : ""}. You can edit this
            description per story.
          </span>
        )}
      </label>

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
