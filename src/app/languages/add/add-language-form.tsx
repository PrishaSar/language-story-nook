"use client";

import { useActionState, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { addLanguageAction } from "../actions";
import {
  CEFR_LEVELS,
  LANGUAGE_OPTIONS,
  LEARNING_REASON_OPTIONS,
} from "@/lib/constants/languages";
import { DEFAULT_CEFR_LEVEL } from "@/lib/types";

const initial = { error: null as string | null };

export function AddLanguageForm({ hasLanguage }: { hasLanguage: boolean }) {
  const [reasons, setReasons] = useState<string[]>([]);
  const [customReasonInput, setCustomReasonInput] = useState("");

  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initial, formData: FormData) => {
      const result = await addLanguageAction(formData);
      if (result?.error) return { error: result.error };
      return initial;
    },
    initial,
  );

  function toggleReason(reason: string) {
    setReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason],
    );
  }

  function addCustomReason() {
    const value = customReasonInput.trim();
    if (!value) return;
    const exists = reasons.some((r) => r.toLowerCase() === value.toLowerCase());
    if (!exists) setReasons((prev) => [...prev, value]);
    setCustomReasonInput("");
  }

  function handleCustomKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomReason();
    }
  }

  const customReasons = reasons.filter(
    (r) => !(LEARNING_REASON_OPTIONS as readonly string[]).includes(r),
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

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ink">
            Why are you learning this language?{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
          </span>
          <span className="text-xs text-ink-muted">
            Leave blank and we&apos;ll default to &ldquo;For fun.&rdquo;
          </span>
        </div>

        <input type="hidden" name="reasonForLearning" value={reasons.join(", ")} />

        <div className="flex flex-wrap gap-2">
          {LEARNING_REASON_OPTIONS.map((reason) => {
            const active = reasons.includes(reason);
            return (
              <button
                key={reason}
                type="button"
                onClick={() => toggleReason(reason)}
                aria-pressed={active}
                className={`chip-select ${active ? "chip-select-active" : ""}`}
              >
                {reason}
              </button>
            );
          })}
          {customReasons.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => toggleReason(reason)}
              aria-pressed
              className="chip-select chip-select-active flex items-center gap-1.5"
            >
              {reason}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>

        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={customReasonInput}
            onChange={(e) => setCustomReasonInput(e.target.value)}
            onKeyDown={handleCustomKeyDown}
            placeholder="Add your own…"
            className="input-nook flex-1 text-sm"
          />
          <button
            type="button"
            onClick={addCustomReason}
            disabled={!customReasonInput.trim()}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Add
          </button>
        </div>
      </div>

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
