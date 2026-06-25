import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { requireLanguageProfile } from "@/lib/guards/language";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");
  if (user.languages.length === 0) redirect("/languages/add");
  redirect("/dashboard");
}
