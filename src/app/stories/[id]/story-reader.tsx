"use client";

import { useEffect, useRef, useState } from "react";
import { speechLocale } from "@/lib/languages/speech";

type Token = { word: boolean; value: string };

function tokenize(text: string): Token[] {
  return text
    .split(/(\s+|[^\p{L}\p{N}']+)/u)
    .filter((part) => part.length > 0)
    .map((value) => ({
      word: /[\p{L}\p{N}]/u.test(value),
      value,
    }));
}

export function ReadAloudButton({
  text,
  languageCode,
}: {
  text: string;
  languageCode: string;
}) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  function toggle() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLocale(languageCode);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <button type="button" onClick={toggle} className="btn-secondary w-fit text-sm">
      {speaking ? "Stop reading" : "Read aloud"}
    </button>
  );
}

export function HoverWords({
  text,
  languageCode,
  className,
}: {
  text: string;
  languageCode: string;
  className?: string;
}) {
  const cache = useRef(new Map<string, string>());
  const [tip, setTip] = useState<{
    word: string;
    text: string;
    x: number;
    y: number;
  } | null>(null);

  async function lookup(word: string, x: number, y: number) {
    const key = word.toLowerCase();
    const cached = cache.current.get(key);
    if (cached) {
      setTip({ word, text: cached, x, y });
      return;
    }
    setTip({ word, text: "Looking up…", x, y });
    try {
      const params = new URLSearchParams({ text: word, source: languageCode });
      const res = await fetch(`/api/translate?${params}`);
      const data = (await res.json()) as { translation?: string; error?: string };
      const meaning = res.ok && data.translation ? data.translation : "No translation";
      cache.current.set(key, meaning);
      setTip({ word, text: meaning, x, y });
    } catch {
      setTip({ word, text: "Lookup failed", x, y });
    }
  }

  return (
    <p className={className} onMouseLeave={() => setTip(null)}>
      {tokenize(text).map((token, index) =>
        token.word ? (
          <span
            key={`${index}-${token.value}`}
            className="cursor-help rounded-sm underline decoration-dotted decoration-gold/70 underline-offset-4 hover:bg-gold/10"
            onMouseEnter={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              void lookup(token.value, rect.left, rect.bottom + 6);
            }}
          >
            {token.value}
          </span>
        ) : (
          <span key={`${index}-gap`}>{token.value}</span>
        ),
      )}
      {tip && (
        <span
          className="pointer-events-none fixed z-20 max-w-xs rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-ink shadow-sm"
          style={{ left: tip.x, top: tip.y }}
        >
          <span className="font-medium">{tip.word}</span>
          {" — "}
          {tip.text}
        </span>
      )}
    </p>
  );
}
