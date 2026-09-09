import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateUser } from "@/lib/db";

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
        preferredWorld?: unknown;
      }
    | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const interests = Array.isArray(body?.interests)
    ? body.interests.filter((i): i is string => typeof i === "string" && i.trim().length > 0)
    : [];
  const preferredGenres = Array.isArray(body?.preferredGenres)
    ? body.preferredGenres
        .filter((g): g is string => typeof g === "string" && g.trim().length > 0)
        .map((g) => g.trim())
    : [];
  const preferredWorld =
    typeof body?.preferredWorld === "string" && body.preferredWorld.trim()
      ? body.preferredWorld.trim()
      : null;

  if (!name) {
    return NextResponse.json({ error: "Your name is required." }, { status: 400 });
  }
  if (interests.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one interest." },
      { status: 400 },
    );
  }
  if (preferredGenres.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one story genre." },
      { status: 400 },
    );
  }

  await updateUser(user.id, {
    name,
    interests,
    preferredGenres,
    preferredWorld,
    onboarded: true,
  });

  return NextResponse.json({ ok: true });
}
