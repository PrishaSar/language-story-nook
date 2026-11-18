/** BCP-47 tags for the browser's built-in speech synthesis. No API key. */
const SPEECH_LOCALES: Record<string, string> = {
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
  return SPEECH_LOCALES[languageCode.toLowerCase()] ?? languageCode;
}
