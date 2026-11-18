import { NextResponse } from "next/server";

/**
 * Word lookup for hover tooltips.
 *
 * PennApps used https://ftapi.pythonanywhere.com/translate (free, no key).
 * That host now returns a "coming soon" page, so this proxies MyMemory's
 * free translation API instead. No API key.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text")?.trim() ?? "";
  const source = (searchParams.get("source") ?? "auto").toLowerCase();

  if (!text) {
    return NextResponse.json({ error: "No word to translate." }, { status: 400 });
  }
  if (text.length > 80) {
    return NextResponse.json({ error: "Look up one word at a time." }, { status: 400 });
  }

  const sourceCode = source === "auto" ? "autodetect" : source;
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${sourceCode}|en`);

  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Translation service unavailable." },
        { status: 502 },
      );
    }
    const data = (await response.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number;
    };
    const translated = data.responseData?.translatedText?.trim() ?? "";
    if (!translated || data.responseStatus === 403) {
      return NextResponse.json({ error: "No translation found." }, { status: 404 });
    }
    return NextResponse.json({ word: text, translation: translated });
  } catch {
    return NextResponse.json(
      { error: "Translation service unavailable." },
      { status: 503 },
    );
  }
}
