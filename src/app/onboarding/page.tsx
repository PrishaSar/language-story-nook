import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.onboarded) redirect("/dashboard");

  return (
    <main className="nook-page flex min-h-screen items-center justify-center">
      <div className="nook-container flex max-w-lg flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm tracking-wide text-gold uppercase">First chapter</p>
          <h1 className="nook-title text-4xl">Tell us about yourself</h1>
          <p className="text-sm leading-relaxed text-ink-muted">
            This only happens once — we&apos;ll use it to shape stories you&apos;ll love.
          </p>
        </div>

        <OnboardingForm />
      </div>
    </main>
  );
}
