import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { findStoryById, getChapter, getPlotBible, getUserLanguageById } from "@/lib/db";
import { chapterFocusLabel, focusPatterns } from "@/lib/grammar/ladder";
import { statusLabel } from "@/lib/library/spine-utils";
import { ChapterNavButtons } from "./chapter-nav-buttons";
import { GrammarConfirm } from "./grammar-confirm";
import { HoverWords, ReadAloudButton } from "./story-reader";
import { StartStoryButton } from "./start-story-button";
// Saved for later: after-chapter recap + translation quiz.
// import { ChapterCheck } from "./chapter-check";

/** Allow long Ollama plot/chapter generations on this route. */
export const maxDuration = 300;

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
  const canGoBack = !!chapter && chapter.chapterNumber > 1;
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-xl font-semibold text-ink">
              {chapter ? `Chapter ${chapter.chapterNumber}` : "Reading"}
            </h2>
            {chapter && language && (
              <ReadAloudButton
                text={
                  chapter.scenes.some((scene) => scene.text)
                    ? chapter.scenes
                        .map((scene) => scene.text)
                        .filter(Boolean)
                        .join("\n")
                    : chapter.text
                }
                languageCode={language.languageCode}
              />
            )}
          </div>
          {chapter ? (
            <div className="flex flex-col gap-5">
              {chapter.scenes.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {chapter.sceneSet ? (
                    <p className="text-sm italic leading-relaxed text-ink-muted">
                      [{chapter.sceneSet}]
                    </p>
                  ) : null}
                  {chapter.scenes.map((scene, index) => (
                    <div key={`${chapter.id}-scene-${index}`} className="flex flex-col gap-2">
                      {scene.text && language ? (
                        <HoverWords
                          text={scene.text}
                          languageCode={language.languageCode}
                          className="story-prose whitespace-pre-wrap"
                        />
                      ) : null}
                      {scene.visual ? (
                        <p className="text-sm italic leading-relaxed text-ink-muted">
                          {scene.visual}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {chapter.sceneSet ? (
                    <p className="text-sm italic leading-relaxed text-ink-muted">
                      [{chapter.sceneSet}]
                    </p>
                  ) : null}
                  {language ? (
                    <HoverWords
                      text={chapter.text}
                      languageCode={language.languageCode}
                      className="story-prose whitespace-pre-wrap"
                    />
                  ) : (
                    <p className="story-prose whitespace-pre-wrap">{chapter.text}</p>
                  )}
                </div>
              )}
              {/* New-words UI hidden for now — vocabLayer still saved for introducedWords.
              {chapter.vocabLayer.length > 0 && (
                <div className="border-t border-[var(--border)] pt-4">
                  <p className="mb-2 text-xs font-medium tracking-wide text-gold uppercase">
                    New words this chapter
                  </p>
                  <ul className="flex flex-col gap-1.5 text-sm text-ink-muted">
                    {chapter.vocabLayer.map((item) => (
                      <li key={`${item.word}-${item.translation}`}>
                        <span className="font-medium text-ink">{item.word}</span>
                        {" — "}
                        {item.translation}
                        {item.context ? (
                          <span className="text-ink-muted/80"> ({item.context})</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              */}
              {chapter.grammarId && language && (
                <GrammarConfirm
                  storyId={story.id}
                  learnerLabel={chapterFocusLabel(chapter.grammarId)}
                  canConfirmGrammar={
                    focusPatterns(language.currentGrammarId, language.knownGrammarIds).some(
                      (pattern) => pattern.id === chapter.grammarId,
                    ) && !language.knownGrammarIds.includes(chapter.grammarId)
                  }
                  wordCount={language.lexicon.length}
                  canConfirmVocab={language.lexicon.length > language.vocabConfirmedCount}
                />
              )}
              {/* Saved for later — what happened + translate quiz.
              <ChapterCheck
                whatHappened={chapter.whatHappened}
                quiz={chapter.translationQuiz}
              />
              */}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">{readingPlaceholder(story.status)}</p>
          )}

          {canTurnPage && (
            <ChapterNavButtons
              storyId={story.id}
              canGoBack={canGoBack}
              isLastChapter={isLastChapter}
            />
          )}
        </section>
      </div>
    </main>
  );
}
