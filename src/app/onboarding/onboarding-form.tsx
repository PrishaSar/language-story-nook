"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const INTEREST_OPTIONS = [
  "Technology",
  "Design",
  "Music",
  "Sports",
  "Travel",
  "Cooking",
  "Gaming",
  "Reading",
  "Fitness",
  "Photography",
  "Movies",
  "Science",
];

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  }

  function addCustomInterest() {
    const value = customInput.trim();
    if (!value) return;
    const exists = interests.some((i) => i.toLowerCase() === value.toLowerCase());
    if (!exists) setInterests((prev) => [...prev, value]);
    setCustomInput("");
  }

  function handleCustomKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomInterest();
    }
  }

  const customInterests = interests.filter((i) => !INTEREST_OPTIONS.includes(i));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, interests }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save your profile.");
      router.replace("/languages/add");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-nook flex flex-col gap-6 p-6">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        What&apos;s your name?
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          className="input-nook"
        />
      </label>

      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-medium text-ink">Pick a few interests</span>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const active = interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                aria-pressed={active}
                className={`chip-select ${active ? "chip-select-active" : ""}`}
              >
                {interest}
              </button>
            );
          })}
          {customInterests.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              aria-pressed
              className="chip-select chip-select-active flex items-center gap-1.5"
            >
              {interest}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>

        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleCustomKeyDown}
            placeholder="Add your own…"
            className="input-nook flex-1 text-sm"
          />
          <button
            type="button"
            onClick={addCustomInterest}
            disabled={!customInput.trim()}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Add
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-burgundy">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Saving…" : "Step into your nook"}
      </button>
    </form>
  );
}
