/** Currencies an investment can be held in. Everything else is in CLP. */
export const CURRENCIES = [
  { code: "CLP", name: "Peso chileno", symbol: "$" },
  { code: "USD", name: "Dólar estadounidense", symbol: "US$" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

/** The app is built for Chile: every amount, budget and balance is in CLP. */
export const APP_CURRENCY: CurrencyCode = "CLP";

/** Chile's IANA zone; it follows the country's daylight saving changes. */
export const APP_TIMEZONE = "America/Santiago";
