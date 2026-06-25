import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { requireLanguageProfile } from "@/lib/guards/language";
import { NewStoryForm } from "./new-story-form";

export default async function NewStoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");
  requireLanguageProfile(user);

  return (
    <main className="nook-page">
      <div className="nook-container flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Link href="/library" className="link-back">
            ← Bookshelf
          </Link>
          <h1 className="nook-title text-4xl">Bind a new book</h1>
          <p className="text-sm leading-relaxed text-ink-muted">
            Choose a world and language. The hidden plot arc is written when you open the book.
          </p>
        </div>

        <NewStoryForm languages={user.languages} />
      </div>
    </main>
  );
}
