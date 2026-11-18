"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { addUserLanguage } from "@/lib/db";
import { DEFAULT_LEARNING_REASON, LANGUAGE_OPTIONS } from "@/lib/constants/languages";
import type { CEFRLevel } from "@/lib/types";

export async function addLanguageAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.languages.length >= 1) {
    return {
      error: "Only one language is supported for now. Multi-language support is coming soon.",
    };
  }

  const languageCode = String(formData.get("languageCode") ?? "").trim().toLowerCase();
  const level = String(formData.get("level") ?? "A1") as CEFRLevel;
  const reasonForLearning =
    String(formData.get("reasonForLearning") ?? "").trim() || DEFAULT_LEARNING_REASON;

  const option = LANGUAGE_OPTIONS.find((l) => l.code === languageCode);
  if (!option) {
    return { error: "Please select a valid language." };
  }

  const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  if (!validLevels.includes(level)) {
    return { error: "Please select a valid CEFR level." };
  }

  const existing = user.languages.find((l) => l.languageCode === languageCode);
  if (existing) {
    return { error: "You already have this language on your profile." };
  }

  await addUserLanguage(user.id, {
    languageCode: option.code,
    languageName: option.name,
    level,
    reasonForLearning,
  });

  redirect("/dashboard");
}
