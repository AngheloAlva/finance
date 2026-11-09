export const locales = ["es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

/** Locales the app used to serve; their URLs redirect to the default locale. */
export const retiredLocales = ["en"] as const;
