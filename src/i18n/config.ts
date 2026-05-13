export const defaultLocale = "en" as const;
export const locales = ["en", "sv"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(s: string | undefined): s is Locale {
  return s === "en" || s === "sv";
}

export function dateLocaleTag(locale: Locale): string {
  return locale === "sv" ? "sv-SE" : "en-GB";
}
