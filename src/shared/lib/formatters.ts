import type { CurrencyCode } from "./constants";

const ZERO_DECIMAL_CURRENCIES = ["JPY", "CLP"] as const;

function isZeroDecimal(currencyCode: CurrencyCode): boolean {
  return (ZERO_DECIMAL_CURRENCIES as readonly string[]).includes(currencyCode);
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currencyCode: CurrencyCode): Intl.NumberFormat {
  let formatter = formatterCache.get(currencyCode);
  if (!formatter) {
    const zeroDecimal = isZeroDecimal(currencyCode);
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: zeroDecimal ? 0 : 2,
      maximumFractionDigits: zeroDecimal ? 0 : 2,
    });
    formatterCache.set(currencyCode, formatter);
  }
  return formatter;
}

export function formatCurrency(
  cents: number,
  currencyCode: CurrencyCode,
): string {
  const amount = isZeroDecimal(currencyCode) ? cents : cents / 100;
  return getCurrencyFormatter(currencyCode).format(amount);
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

export function formatDate(
  date: Date | string,
  style: "short" | "long",
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

  return new Intl.DateTimeFormat("en-US", options).format(d);
}
