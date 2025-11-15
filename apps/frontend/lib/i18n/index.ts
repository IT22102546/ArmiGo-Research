// Client-safe exports for i18n
export const locales = ["en", "ta", "si"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  ta: "தமிழ்",
  si: "සිංහල",
};
