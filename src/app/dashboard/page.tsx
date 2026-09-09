import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listStoriesByUser } from "@/lib/db";
import { hasLanguageProfile, newStoryHref } from "@/lib/guards/language";
import { LanguageCard } from "./language-card";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  const canCreate = hasLanguageProfile(user);

  const stories = await listStoriesByUser(user.id);
  const activeStories = stories.filter((s) => s.status === "active").length;

  const storiesCreatedByLanguage = new Map<string, number>();
  for (const story of stories) {
    storiesCreatedByLanguage.set(
      story.languageId,
      (storiesCreatedByLanguage.get(story.languageId) ?? 0) + 1,
    );
  }

  return (
    <main className="nook-page">
      <div className="nook-container flex flex-col gap-10">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium tracking-wide text-gold uppercase">Reading nook</p>
            <h1 className="nook-title text-4xl">Welcome, {user.name}</h1>
          </div>
          <LogoutButton />
        </header>

        <Link href="/library" className="nook-hero-link">
          <div>
            <p className="font-serif text-xl font-semibold text-ink">Your bookshelf</p>
            <p className="mt-1 text-sm text-ink-muted">
              {canCreate ? (
                <>
                  {stories.length} {stories.length === 1 ? "volume" : "volumes"}
                  {activeStories > 0 && ` · ${activeStories} in progress`}
                </>
              ) : (
                <>Add a language to start your collection</>
              )}
            </p>
          </div>
          <span className="text-2xl text-gold">→</span>
        </Link>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-ink">Your languages</h2>
            <span className="badge-rose">Multi-language — Phase 8</span>
          </div>

          {user.languages.length === 0 ? (
            <div className="card-nook-dashed p-8 text-center">
              <p className="text-sm text-ink-muted">
                Add a language to begin binding stories to your shelf.
              </p>
              <Link href="/languages/add" className="btn-primary mt-4 inline-flex">
                Add your first language
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {user.languages.map((lang) => (
                <LanguageCard
                  key={lang.id}
                  language={lang}
                  storiesCreated={storiesCreatedByLanguage.get(lang.id) ?? 0}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="card-nook flex flex-col gap-3 p-6">
          <h2 className="font-serif text-lg font-semibold text-ink">Your interests</h2>
          {user.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <span key={interest} className="interest-chip">
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">No interests selected.</p>
          )}
        </section>

        <section className="card-nook flex flex-col gap-3 p-6">
          <h2 className="font-serif text-lg font-semibold text-ink">Story tastes</h2>
          {user.preferredGenres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.preferredGenres.map((genre) => (
                <span key={genre} className="interest-chip">
                  {genre}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">No genres selected yet.</p>
          )}
          {user.preferredWorld && (
            <p className="text-sm text-ink-muted">
              Favorite world: <span className="text-ink">{user.preferredWorld}</span>
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
