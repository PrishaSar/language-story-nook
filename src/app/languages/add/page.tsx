import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AddLanguageForm } from "./add-language-form";

export default async function AddLanguagePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  return (
    <main className="nook-page flex min-h-screen items-center justify-center">
      <div className="nook-container flex max-w-lg flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Link href="/dashboard" className="link-back">
            ← Reading nook
          </Link>
          <h1 className="nook-title text-4xl">Add a language</h1>
          <p className="text-sm leading-relaxed text-ink-muted">
            Stories will be written at this level, in this language.
          </p>
        </div>

        <AddLanguageForm hasLanguage={user.languages.length >= 1} />
      </div>
    </main>
  );
}
