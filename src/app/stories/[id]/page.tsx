import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { findStoryById, getChapter, getUserLanguageById } from "@/lib/db";
import { statusLabel } from "@/lib/library/spine-utils";
import { StartStoryButton } from "./start-story-button";

function readingPlaceholder(status: string, hasChapter: boolean): string {
  if (hasChapter) return "";
  switch (status) {
    case "draft":
      return "Open the book to begin — a hidden plot arc will guide every chapter.";
    case "generating_plot":
      return "Your plot is being woven. If this takes too long, refresh and try opening again.";
    case "active":
      return "The story arc is ready. Chapter 1 will appear here in the next phase.";
    case "completed":
      return "You finished this book.";
    default:
      return "No chapters yet.";
  }
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  const { id } = await params;
  const story = await findStoryById(id);
  if (!story || story.userId !== user.id) notFound();

  const language = await getUserLanguageById(user.id, story.languageId);
  const chapter =
    story.currentChapter > 0
      ? await getChapter(story.id, story.currentChapter)
      : null;

  const isDraft = story.status === "draft";
  const isGenerating = story.status === "generating_plot";
  const plotReady = story.status === "active" || story.status === "completed";

  return (
    <main className="nook-page">
      <div className="nook-container flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link href="/library" className="link-back">
            ← Bookshelf
          </Link>
          <h1 className="nook-title text-4xl">{story.title}</h1>
          <div className="flex flex-wrap gap-2 text-sm text-ink-muted">
            {language && (
              <span>
                {language.languageName} · {language.level}
              </span>
            )}
            <span>·</span>
            <span>{story.scenario === "fantasy" ? "Fantasy" : "Real life"}</span>
            <span>·</span>
            <span className="text-gold">{statusLabel(story.status)}</span>
          </div>
        </header>

        <section className="card-nook p-6">
          <h2 className="mb-2 text-xs font-medium tracking-wide text-gold uppercase">Setting</h2>
          <p className="text-sm leading-relaxed text-ink-muted italic">{story.worldDescription}</p>
        </section>

        {(isDraft || isGenerating) && (
          <section className="flex flex-col gap-3">
            <p className="text-sm text-ink-muted">
              When you open this book, a hidden plot arc is written just for you — main story,
              subplots, and twist points. You&apos;ll never see the blueprint, only the chapters
              it shapes.
            </p>
            <StartStoryButton storyId={story.id} status={story.status} />
          </section>
        )}

        {plotReady && !chapter && (
          <section className="card-nook border-l-4 border-l-gold p-5">
            <p className="text-sm text-ink-muted">
              <span className="font-medium text-ink">Plot ready.</span> The story arc is in
              place and your bookmark is set. Chapter 1 generation is next.
            </p>
          </section>
        )}

        <section className="story-page card-nook flex flex-col gap-4 p-8">
          <h2 className="font-serif text-xl font-semibold text-ink">
            {chapter ? `Chapter ${chapter.chapterNumber}` : "Reading"}
          </h2>
          {chapter ? (
            <p className="story-prose whitespace-pre-wrap">{chapter.text}</p>
          ) : (
            <p className="text-sm text-ink-muted">
              {readingPlaceholder(story.status, !!chapter)}
            </p>
          )}

          <button
            type="button"
            disabled
            className="btn-secondary w-fit opacity-50"
            title="Available in Phase 4–5"
          >
            Turn the page →
          </button>
        </section>
      </div>
    </main>
  );
}
