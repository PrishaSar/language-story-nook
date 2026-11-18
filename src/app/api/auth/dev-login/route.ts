import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/db";

/** Fixed local account so developer sessions keep stories and profile data. */
const DEV_EMAIL = "dev@local.nook";

/**
 * Development-only shortcut. Not available in production builds.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  let user = await findUserByEmail(DEV_EMAIL);
  if (!user) {
    user = await createUser(DEV_EMAIL, hashPassword(randomBytes(24).toString("hex")));
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, onboarded: user.onboarded });
}
