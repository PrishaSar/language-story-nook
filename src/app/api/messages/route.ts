import { NextResponse } from "next/server";

type Message = {
  id: number;
  text: string;
  createdAt: string;
};

// In-memory store for demo purposes. Replace with a real database
// (e.g. Postgres, SQLite, MongoDB) for persistence across restarts.
let messages: Message[] = [
  { id: 1, text: "Welcome to your full-stack Next.js app!", createdAt: new Date().toISOString() },
];
let nextId = 2;

export async function GET() {
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text) {
    return NextResponse.json({ error: "`text` is required" }, { status: 400 });
  }

  const message: Message = { id: nextId++, text, createdAt: new Date().toISOString() };
  messages = [...messages, message];

  return NextResponse.json({ message }, { status: 201 });
}
