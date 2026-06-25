import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookshelf } from "@/components/library/bookshelf";
import { getCurrentUser } from "@/lib/auth";
import { getUserLanguageById, listStoriesByUser } from "@/lib/db";
import { hasLanguageProfile, newStoryHref } from "@/lib/guards/language";

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  const canCreate = hasLanguageProfile(user);
  const createHref = newStoryHref(canCreate);

  const stories = await listStoriesByUser(user.id);
  const enriched = await Promise.all(
    stories.map(async (story) => {
      const lang = await getUserLanguageById(user.id, story.languageId);
      return { ...story, languageName: lang?.languageName };
    }),
  );

  return (
    <main className="nook-page">
      <div className="nook-container-wide flex flex-col gap-10">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Link href="/dashboard" className="link-back">
              ← Reading nook
            </Link>
            <h1 className="nook-title text-4xl">Your bookshelf</h1>
            <p className="max-w-lg text-sm leading-relaxed text-ink-muted">
              Browse your stories spine by spine. A ribbon means you&apos;ve begun reading.
            </p>
          </div>
          <Link href={createHref} className="btn-primary shrink-0">
            {canCreate ? "New story" : "Add language first"}
          </Link>
        </header>

        {!canCreate && (
          <p className="text-sm text-ink-muted">
            Add a language before binding a new book to your shelf.{" "}
            <Link href="/languages/add" className="link-gold underline">
              Add language →
            </Link>
          </p>
        )}

        <Bookshelf stories={enriched} newStoryHref={createHref} />
      </div>
    </main>
  );
}
