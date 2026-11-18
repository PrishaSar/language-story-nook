"use client";

import { useRouter } from "next/navigation";
import { useState, type Dispatch, type KeyboardEvent, type SetStateAction } from "react";

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

const GENRE_OPTIONS = [
  "Fantasy",
  "Sci-fi",
  "Mystery",
  "Romance",
  "Adventure",
  "Thriller",
  "Horror",
  "Comedy",
  "Historical",
  "Slice of life",
  "Drama",
  "Detective",
];

const MEDIA_OPTIONS = ["News", "Webcomics", "Books", "TV shows"];

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [preferredGenres, setPreferredGenres] = useState<string[]>([]);
  const [preferredMedia, setPreferredMedia] = useState<string[]>([]);
  const [preferredWorld, setPreferredWorld] = useState("");
  const [customInterestInput, setCustomInterestInput] = useState("");
  const [customGenreInput, setCustomGenreInput] = useState("");
  const [customMediaInput, setCustomMediaInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleInList(value: string, setter: Dispatch<SetStateAction<string[]>>) {
    setter((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value],
    );
  }

  function addCustom(
    raw: string,
    current: string[],
    setter: Dispatch<SetStateAction<string[]>>,
    clear: () => void,
  ) {
    const value = raw.trim();
    if (!value) return;
    const exists = current.some((i) => i.toLowerCase() === value.toLowerCase());
    if (!exists) setter((prev) => [...prev, value]);
    clear();
  }

  function handleChipKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    onEnter: () => void,
  ) {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter();
    }
  }

  const customInterests = interests.filter((i) => !INTEREST_OPTIONS.includes(i));
  const customGenres = preferredGenres.filter((g) => !GENRE_OPTIONS.includes(g));
  const customMedia = preferredMedia.filter((m) => !MEDIA_OPTIONS.includes(m));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          interests,
          preferredGenres,
          preferredMedia,
          preferredWorld: preferredWorld.trim() || null,
        }),
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
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ink">
            Pick a few interests{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
          </span>
          <span className="text-xs text-ink-muted">
            Skip if you like — stories will use a general default.
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const active = interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInList(interest, setInterests)}
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
              onClick={() => toggleInList(interest, setInterests)}
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
            value={customInterestInput}
            onChange={(e) => setCustomInterestInput(e.target.value)}
            onKeyDown={(e) =>
              handleChipKeyDown(e, () =>
                addCustom(customInterestInput, interests, setInterests, () =>
                  setCustomInterestInput(""),
                ),
              )
            }
            placeholder="Add your own…"
            className="input-nook flex-1 text-sm"
          />
          <button
            type="button"
            onClick={() =>
              addCustom(customInterestInput, interests, setInterests, () =>
                setCustomInterestInput(""),
              )
            }
            disabled={!customInterestInput.trim()}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ink">
            Story genres you want{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
          </span>
          <span className="text-xs text-ink-muted">
            We&apos;ll lean on these for your plot bible, or use general fiction if blank.
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {GENRE_OPTIONS.map((genre) => {
            const active = preferredGenres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggleInList(genre, setPreferredGenres)}
                aria-pressed={active}
                className={`chip-select ${active ? "chip-select-active" : ""}`}
              >
                {genre}
              </button>
            );
          })}
          {customGenres.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleInList(genre, setPreferredGenres)}
              aria-pressed
              className="chip-select chip-select-active flex items-center gap-1.5"
            >
              {genre}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>

        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={customGenreInput}
            onChange={(e) => setCustomGenreInput(e.target.value)}
            onKeyDown={(e) =>
              handleChipKeyDown(e, () =>
                addCustom(customGenreInput, preferredGenres, setPreferredGenres, () =>
                  setCustomGenreInput(""),
                ),
              )
            }
            placeholder="Add a genre…"
            className="input-nook flex-1 text-sm"
          />
          <button
            type="button"
            onClick={() =>
              addCustom(customGenreInput, preferredGenres, setPreferredGenres, () =>
                setCustomGenreInput(""),
              )
            }
            disabled={!customGenreInput.trim()}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ink">
            What type of media do you consume most?{" "}
            <span className="font-normal text-ink-muted">(optional)</span>
          </span>
          <span className="text-xs text-ink-muted">
            We&apos;ll shape chapter pacing and tone to feel closer to what you already enjoy.
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {MEDIA_OPTIONS.map((media) => {
            const active = preferredMedia.includes(media);
            return (
              <button
                key={media}
                type="button"
                onClick={() => toggleInList(media, setPreferredMedia)}
                aria-pressed={active}
                className={`chip-select ${active ? "chip-select-active" : ""}`}
              >
                {media}
              </button>
            );
          })}
          {customMedia.map((media) => (
            <button
              key={media}
              type="button"
              onClick={() => toggleInList(media, setPreferredMedia)}
              aria-pressed
              className="chip-select chip-select-active flex items-center gap-1.5"
            >
              {media}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>

        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={customMediaInput}
            onChange={(e) => setCustomMediaInput(e.target.value)}
            onKeyDown={(e) =>
              handleChipKeyDown(e, () =>
                addCustom(customMediaInput, preferredMedia, setPreferredMedia, () =>
                  setCustomMediaInput(""),
                ),
              )
            }
            placeholder="Add your own…"
            className="input-nook flex-1 text-sm"
          />
          <button
            type="button"
            onClick={() =>
              addCustom(customMediaInput, preferredMedia, setPreferredMedia, () =>
                setCustomMediaInput(""),
              )
            }
            disabled={!customMediaInput.trim()}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Add
          </button>
        </div>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        A fictional world you love{" "}
        <span className="font-normal text-ink-muted">(optional)</span>
        <input
          type="text"
          value={preferredWorld}
          onChange={(e) => setPreferredWorld(e.target.value)}
          placeholder='e.g. "Middle-earth", "Star Wars", "Studio Ghibli"'
          className="input-nook"
        />
        <span className="text-xs font-normal text-ink-muted">
          We&apos;ll borrow the vibe and setting — not retell the original plot.
        </span>
      </label>

      {error && <p className="text-sm text-burgundy">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Saving…" : "Step into your nook"}
      </button>
    </form>
  );
}
