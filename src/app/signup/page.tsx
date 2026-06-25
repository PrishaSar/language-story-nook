import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboarded ? "/dashboard" : "/onboarding");

  return (
    <main className="nook-page flex min-h-screen items-center justify-center">
      <div className="nook-container flex max-w-md flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm tracking-wide text-gold uppercase">StoryLang</p>
          <h1 className="nook-title text-4xl">Create your account</h1>
          <p className="text-sm text-ink-muted">Your reading nook awaits.</p>
        </div>

        <SignupForm />

        <p className="text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="link-gold underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
