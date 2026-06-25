import Link from "next/link";
import { getSpineStyle, hasBookmark, statusLabel } from "@/lib/library/spine-utils";
import type { Story } from "@/lib/types";

type BookshelfStory = Story & {
  languageName?: string;
};

type BookshelfProps = {
  stories: BookshelfStory[];
  /** Where the "+" spine and empty-shelf CTA link — `/stories/new` or `/languages/add`. */
  newStoryHref?: string;
};

export function Bookshelf({ stories, newStoryHref = "/stories/new" }: BookshelfProps) {
  if (stories.length === 0) {
    return (
      <div className="bookshelf-wrap">
        <div className="bookshelf-scroll min-h-[12rem] items-end">
          <Link href={newStoryHref} className="book-spine-new" title="Add a new story">
            +
          </Link>
        </div>
        <div className="shelf-board" />
        <p className="mt-6 text-center text-sm text-ink-muted">
          Your shelf is empty.{" "}
          <Link href={newStoryHref} className="link-gold underline">
            Bind your first book
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="bookshelf-wrap">
      <div className="bookshelf-scroll">
        {stories.map((story) => {
          const spine = getSpineStyle(story.id);
          const bookmark = hasBookmark(story);
          return (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              className="book-spine group"
              style={{ height: spine.height, backgroundColor: spine.color }}
              title={`${story.title}${story.languageName ? ` · ${story.languageName}` : ""}`}
            >
              {bookmark && <span className="bookmark-ribbon" aria-hidden />}
              <span className="book-spine-gilding" aria-hidden />
              <span className="book-spine-title">{story.title}</span>
            </Link>
          );
        })}
        <Link href={newStoryHref} className="book-spine-new" title="Add a new story">
          +
        </Link>
      </div>
      <div className="shelf-board" />
      <ul className="mt-6 flex flex-col gap-2 sm:hidden">
        {stories.map((story) => (
          <li key={story.id} className="text-sm text-ink-muted">
            <Link href={`/stories/${story.id}`} className="font-serif text-ink hover:text-burgundy">
              {story.title}
            </Link>
            {" · "}
            {statusLabel(story.status)}
            {story.languageName && ` · ${story.languageName}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
