/** BCP-47 tags for the browser Speech Synthesis API (no key). */
const SPEECH_LOCALE: Record<string, string> = {
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  pt: "pt-PT",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  ar: "ar-SA",
  hi: "hi-IN",
  ru: "ru-RU",
  nl: "nl-NL",
};

export function speechLocale(languageCode: string): string {
  return SPEECH_LOCALE[languageCode.toLowerCase()] ?? "en-US";
}

/** ISO code MyMemory accepts in langpair (source|en). */
export function translateSourceCode(languageCode: string): string {
  const code = languageCode.toLowerCase();
  return code === "zh" ? "zh-CN" : code;
}
