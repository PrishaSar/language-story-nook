import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.onboarded ? "/dashboard" : "/onboarding");

  return (
    <main className="nook-page flex min-h-screen items-center justify-center">
      <div className="nook-container flex max-w-md flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm tracking-wide text-gold uppercase">StoryLang</p>
          <h1 className="nook-title text-4xl">Welcome back</h1>
          <p className="text-sm text-ink-muted">Pick up where you left off.</p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-ink-muted">
          New here?{" "}
          <Link href="/signup" className="link-gold underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
