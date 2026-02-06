export const SUPPORTED_LOCALES = ["en", "es", "zh-CN", "zh-TW", "ja", "ko", "ru", "pt-BR", "th", "vi", "id", "tr"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number] | string;

export const DEFAULT_LOCALE: SupportedLocale = "en";
