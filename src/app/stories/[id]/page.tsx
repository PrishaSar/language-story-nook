import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { findStoryById, getChapter, getPlotBible, getUserLanguageById } from "@/lib/db";
import { statusLabel } from "@/lib/library/spine-utils";
import { StartStoryButton } from "./start-story-button";
import { TurnPageButton } from "./turn-page-button";

function readingPlaceholder(status: string): string {
  switch (status) {
    case "draft":
      return "Open the book to begin — a hidden plot arc and Chapter 1 will be written for you.";
    case "generating_plot":
      return "Your plot is being woven. If this takes too long, refresh and try opening again.";
    case "active":
      return "Chapter 1 should appear after you open the book. Try opening again if it’s missing.";
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
  const bible = await getPlotBible(story.id);
  const chapterNumber = story.currentChapter > 0 ? story.currentChapter : 0;
  const chapter =
    chapterNumber > 0 ? await getChapter(story.id, chapterNumber) : null;

  const isDraft = story.status === "draft";
  const isGenerating = story.status === "generating_plot";
  const needsChapterOne =
    (story.status === "active" || story.status === "completed") &&
    !!bible &&
    !chapter;
  const canTurnPage =
    (story.status === "active" || story.status === "completed") && !!chapter;
  const isLastChapter =
    !!bible && !!chapter && chapter.chapterNumber >= bible.chapterCount;

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
            {bible && chapter && (
              <>
                <span>·</span>
                <span>
                  Chapter {chapter.chapterNumber} of {bible.chapterCount}
                </span>
              </>
            )}
          </div>
        </header>

        <section className="card-nook p-6">
          <h2 className="mb-2 text-xs font-medium tracking-wide text-gold uppercase">Setting</h2>
          <p className="text-sm leading-relaxed text-ink-muted italic">{story.worldDescription}</p>
        </section>

        {(isDraft || isGenerating || needsChapterOne) && (
          <section className="flex flex-col gap-3">
            <p className="text-sm text-ink-muted">
              {needsChapterOne
                ? "Your plot arc is ready. Begin Chapter 1 when you’re ready — later chapters wait until you turn the page."
                : "When you open this book, a hidden plot arc is written, then Chapter 1 only. Later chapters appear when you turn the page — never ahead of time."}
            </p>
            <StartStoryButton
              storyId={story.id}
              status={story.status}
              needsChapterOne={needsChapterOne}
            />
          </section>
        )}

        <section className="story-page card-nook flex flex-col gap-4 p-8">
          <h2 className="font-serif text-xl font-semibold text-ink">
            {chapter ? `Chapter ${chapter.chapterNumber}` : "Reading"}
          </h2>
          {chapter ? (
            <p className="story-prose whitespace-pre-wrap">{chapter.text}</p>
          ) : (
            <p className="text-sm text-ink-muted">{readingPlaceholder(story.status)}</p>
          )}

          {canTurnPage && (
            <TurnPageButton
              storyId={story.id}
              isLastChapter={isLastChapter || story.status === "completed"}
            />
          )}
        </section>
      </div>
    </main>
  );
}
