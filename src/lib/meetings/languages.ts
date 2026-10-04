export const SESSION_LANGUAGES = [
  { id: "en", speech: "en-US", label: "English" },
  { id: "es", speech: "es-ES", label: "Spanish" },
  { id: "hi", speech: "hi-IN", label: "Hindi" },
  { id: "fr", speech: "fr-FR", label: "French" },
  { id: "de", speech: "de-DE", label: "German" },
  { id: "pt", speech: "pt-BR", label: "Portuguese" },
  { id: "ja", speech: "ja-JP", label: "Japanese" },
  { id: "ko", speech: "ko-KR", label: "Korean" },
  { id: "ar", speech: "ar-SA", label: "Arabic" },
  { id: "it", speech: "it-IT", label: "Italian" },
  { id: "nl", speech: "nl-NL", label: "Dutch" },
  { id: "tr", speech: "tr-TR", label: "Turkish" },
  { id: "zh", speech: "zh-CN", label: "Chinese" },
] as const;

export function speechLang(id: string): string {
  return SESSION_LANGUAGES.find((l) => l.id === id)?.speech ?? "en-US";
}

export function languageLabel(id: string): string {
  return SESSION_LANGUAGES.find((l) => l.id === id)?.label ?? "English";
}
