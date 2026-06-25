"use client";

import { useActionState } from "react";
import Link from "next/link";
import { addLanguageAction } from "../actions";
import { CEFR_LEVELS, LANGUAGE_OPTIONS } from "@/lib/constants/languages";
import { DEFAULT_CEFR_LEVEL } from "@/lib/types";

const initial = { error: null as string | null };

export function AddLanguageForm({ hasLanguage }: { hasLanguage: boolean }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => {
      const result = await addLanguageAction(formData);
      if (result?.error) return { error: result.error };
      return initial;
    },
    initial,
  );

  if (hasLanguage) {
    return (
      <div className="card-nook-dashed p-6 text-sm text-ink-muted">
        <p>You already have a language on your profile.</p>
        <p className="mt-2">Adding multiple languages is coming in a later phase.</p>
        <Link href="/dashboard" className="link-gold mt-4 inline-block underline">
          Back to reading nook
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="card-nook flex flex-col gap-5 p-6">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Which language do you want to learn?
        <select name="languageCode" required defaultValue={LANGUAGE_OPTIONS[0].code} className="input-nook">
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Your current level
        <select name="level" required defaultValue={DEFAULT_CEFR_LEVEL} className="input-nook">
          {CEFR_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
              {level === DEFAULT_CEFR_LEVEL ? " (default)" : ""}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-ink-faint">
          CEFR scale — A1 is beginner, C2 is near-native.
        </span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Why are you learning this language?
        <textarea
          name="reasonForLearning"
          required
          rows={3}
          placeholder="e.g. I'm traveling to Spain next year, or I want to read novels in French..."
          className="input-nook"
        />
      </label>

      {state.error && <p className="text-sm text-burgundy">{state.error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : "Add language"}
        </button>
        <Link href="/dashboard" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
