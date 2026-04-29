import { describe, expect, it } from "vitest"
import {
  centsToDisplay,
  formatCurrency,
  formatDate,
  formatExchangeRate,
  parseCurrencyInput,
} from "@/shared/lib/formatters"

describe("formatCurrency", () => {
  it("converts cents to dollars for standard currencies", () => {
    const result = formatCurrency(150000, "USD", "en-US")
    expect(result).toBe("$1,500.00")
  })

  it("treats amount as whole units for zero-decimal currencies (JPY)", () => {
    const result = formatCurrency(1500, "JPY", "en-US")
    expect(result).toContain("1,500")
    expect(result).not.toContain(".")
  })

  it("treats amount as whole units for zero-decimal currencies (CLP)", () => {
    const result = formatCurrency(5000, "CLP", "es-CL")
    expect(result).toContain("5.000")
  })

  it("formats EUR correctly", () => {
    const result = formatCurrency(99900, "EUR", "en-US")
    expect(result).toBe("€999.00")
  })

  it("formats ARS with locale es-AR", () => {
    const result = formatCurrency(100000, "ARS", "es-AR")
    expect(result).toContain("1.000")
  })

  it("returns two decimals for standard currency with odd cents", () => {
    const result = formatCurrency(101, "USD", "en-US")
    expect(result).toBe("$1.01")
  })
})

describe("parseCurrencyInput", () => {
  it("converts a display string to cents for standard currencies", () => {
    expect(parseCurrencyInput("15.00", "USD")).toBe(1500)
  })

  it("strips currency symbols and punctuation before parsing", () => {
    expect(parseCurrencyInput("$1,500.00", "USD")).toBe(150000)
  })

  it("returns whole number for zero-decimal currencies (JPY)", () => {
    expect(parseCurrencyInput("1500", "JPY")).toBe(1500)
  })

  it("rounds to integer for zero-decimal currencies", () => {
    expect(parseCurrencyInput("1500.9", "CLP")).toBe(1501)
  })

  it("returns 0 for non-numeric input", () => {
    expect(parseCurrencyInput("abc", "USD")).toBe(0)
  })

  it("returns 0 for empty string", () => {
    expect(parseCurrencyInput("", "USD")).toBe(0)
  })

  it("handles negative values", () => {
    expect(parseCurrencyInput("-10.00", "USD")).toBe(-1000)
  })
})

describe("centsToDisplay", () => {
  it("returns two-decimal string for standard currencies", () => {
    expect(centsToDisplay(150000, "USD")).toBe("1500.00")
  })

  it("returns whole number string for zero-decimal currencies (JPY)", () => {
    expect(centsToDisplay(1500, "JPY")).toBe("1500")
  })

  it("defaults to USD when no currency is provided", () => {
    expect(centsToDisplay(500)).toBe("5.00")
  })

  it("handles zero correctly", () => {
    expect(centsToDisplay(0, "USD")).toBe("0.00")
    expect(centsToDisplay(0, "JPY")).toBe("0")
  })
})

describe("formatExchangeRate", () => {
  it("divides by 10000 and returns four decimal places", () => {
    expect(formatExchangeRate(10000)).toBe("1.0000")
    expect(formatExchangeRate(15423)).toBe("1.5423")
    expect(formatExchangeRate(9850)).toBe("0.9850")
  })
})

describe("formatDate", () => {
  const date = new Date("2025-06-15T00:00:00Z")

  it("formats short style in en-US", () => {
    const result = formatDate(date, "short", "en-US")
    expect(result).toContain("Jun")
    expect(result).toContain("2025")
  })

  it("formats long style in en-US", () => {
    const result = formatDate(date, "long", "en-US")
    expect(result).toContain("June")
    expect(result).toContain("2025")
    expect(result).toMatch(/Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday/)
  })

  it("accepts a string date", () => {
    const result = formatDate("2025-06-15", "short", "en-US")
    expect(result).toContain("2025")
  })

  it("formats with es-AR locale", () => {
    const result = formatDate(date, "short", "es-AR")
    expect(result).toContain("2025")
  })
})
