import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateUser } from "@/lib/db";

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        name?: unknown;
        interests?: unknown;
        preferredGenres?: unknown;
        preferredMedia?: unknown;
        preferredWorld?: unknown;
      }
    | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  // Optional tastes — empty arrays are fine; AI prompts fall back to defaults.
  const interests = stringList(body?.interests);
  const preferredGenres = stringList(body?.preferredGenres);
  const preferredMedia = stringList(body?.preferredMedia);
  const preferredWorld =
    typeof body?.preferredWorld === "string" && body.preferredWorld.trim()
      ? body.preferredWorld.trim()
      : null;

  if (!name) {
    return NextResponse.json({ error: "Your name is required." }, { status: 400 });
  }

  await updateUser(user.id, {
    name,
    interests,
    preferredGenres,
    preferredMedia,
    preferredWorld,
    onboarded: true,
  });

  return NextResponse.json({ ok: true });
}
