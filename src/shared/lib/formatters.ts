import type { CurrencyCode } from "./constants";

const ZERO_DECIMAL_CURRENCIES = ["JPY", "CLP"] as const;

function isZeroDecimal(currencyCode: CurrencyCode): boolean {
  return (ZERO_DECIMAL_CURRENCIES as readonly string[]).includes(currencyCode);
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currencyCode: CurrencyCode, locale = "en-US"): Intl.NumberFormat {
  const cacheKey = `${locale}:${currencyCode}`;
  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    const zeroDecimal = isZeroDecimal(currencyCode);
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: zeroDecimal ? 0 : 2,
      maximumFractionDigits: zeroDecimal ? 0 : 2,
    });
    formatterCache.set(cacheKey, formatter);
  }
  return formatter;
}

export function formatCurrency(
  cents: number,
  currencyCode: CurrencyCode,
  locale = "en-US",
): string {
  const amount = isZeroDecimal(currencyCode) ? cents : cents / 100;
  return getCurrencyFormatter(currencyCode, locale).format(amount);
}

export function parseCurrencyInput(display: string, currencyCode: CurrencyCode = "USD"): number {
  const cleaned = display.replace(/[^0-9.-]/g, "");
  const value = parseFloat(cleaned);

  if (Number.isNaN(value)) return 0;

  return isZeroDecimal(currencyCode) ? Math.round(value) : Math.round(value * 100);
}

export function centsToDisplay(cents: number, currencyCode: CurrencyCode = "USD"): string {
  if (isZeroDecimal(currencyCode)) {
    return cents.toString();
  }
  const value = cents / 100;
  return value.toFixed(2);
}

export function formatExchangeRate(rateInt: number): string {
  return (rateInt / 10000).toFixed(4);
}

export function formatDate(
  date: Date | string,
  style: "short" | "long",
  locale = "en-US",
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions =
    style === "short"
      ? { month: "short", day: "numeric", year: "numeric" }
      : {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        };

  return new Intl.DateTimeFormat(locale, options).format(d);
}
