/**
 * Strip common LLM romanization / transliteration leftovers from chapter text.
 * e.g. "안녕하세요 (annyeonghaseyo)." → "안녕하세요."
 */
export function stripRomanizationHints(text: string): string {
  return text
    .replace(/\s*\(([A-Za-z][A-Za-z0-9\s\-'.]*)\)/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
