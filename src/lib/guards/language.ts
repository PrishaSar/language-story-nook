import { redirect } from "next/navigation";
import type { User } from "@/lib/db";

/** Redirect to language onboarding when the user has no language profile. */
export function requireLanguageProfile(user: User): void {
  if (user.languages.length === 0) {
    redirect("/languages/add");
  }
}

/** Link target for "create story" actions — gated on having a language. */
export function newStoryHref(hasLanguage: boolean): string {
  return hasLanguage ? "/stories/new" : "/languages/add";
}

export function hasLanguageProfile(user: User): boolean {
  return user.languages.length > 0;
}
