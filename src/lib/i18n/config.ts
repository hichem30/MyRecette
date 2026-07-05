export const locales = ["en", "es", "fr", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

// RTL languages for layout direction
export const rtlLocales = ["ar"] as const;
export type RtlLocale = (typeof rtlLocales)[number];
export const isRtl = (locale: string): boolean => rtlLocales.includes(locale as RtlLocale);
