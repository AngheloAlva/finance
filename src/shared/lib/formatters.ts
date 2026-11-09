import type { CurrencyCode } from "./constants";

const ZERO_DECIMAL_CURRENCIES = ["JPY", "CLP"] as const;

function isZeroDecimal(currencyCode: CurrencyCode): boolean {
  return (ZERO_DECIMAL_CURRENCIES as readonly string[]).includes(currencyCode);
}

/** How many stored units make one unit of the currency: 100 cents per dollar, 1 per peso. */
export function minorUnitsPerUnit(currencyCode: string): number {
  return (ZERO_DECIMAL_CURRENCIES as readonly string[]).includes(currencyCode) ? 1 : 100;
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
      // Spanish skips the separator for four-digit amounts by default ("3800").
      useGrouping: "always",
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

/** Short form for chart axes ("1 M CLP", "$750K"); tooltips keep the exact amount. */
export function formatCompactCurrency(
  cents: number,
  currencyCode: CurrencyCode,
  locale = "en-US",
): string {
  const amount = isZeroDecimal(currencyCode) ? cents : cents / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
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

function dateFormatOptions(style: "short" | "long"): Intl.DateTimeFormatOptions {
  return style === "short"
    ? { month: "short", day: "numeric", year: "numeric" }
    : {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      };
}

/** Formats a moment in time in the viewer's time zone (expiry, last update). */
export function formatDate(
  date: Date | string,
  style: "short" | "long",
  locale = "en-US",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, dateFormatOptions(style)).format(d);
}

/**
 * Formats a calendar day: a date picked without a time (a transaction's date,
 * a goal's deadline). Those are stored as UTC midnight, so they are read in
 * UTC; the viewer's time zone would show the previous day west of UTC.
 */
export function formatCalendarDate(
  date: Date | string,
  style: "short" | "long",
  locale = "en-US",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { ...dateFormatOptions(style), timeZone: "UTC" }).format(d);
}

/** The viewer's current calendar day as "yyyy-MM-dd", for date inputs. */
export function todayDateInput(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
