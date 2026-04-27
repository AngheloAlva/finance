import { describe, expect, it } from "vitest"
import {
  clampDay,
  computeStatementDates,
  getInstallmentImpactDate,
} from "@/features/credit-cards/lib/billing-cycle.utils"

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

describe("clampDay", () => {
  it("returns the day unchanged when the month has enough days", () => {
    expect(clampDay(15, 2025, 1)).toBe(15)
  })

  it("clamps day 31 down to 28 in a non-leap February", () => {
    expect(clampDay(31, 2025, 1)).toBe(28)
  })

  it("clamps day 31 down to 29 in a leap February", () => {
    expect(clampDay(31, 2024, 1)).toBe(29)
  })

  it("clamps day 31 down to 30 in 30-day months", () => {
    expect(clampDay(31, 2025, 3)).toBe(30)
    expect(clampDay(31, 2025, 5)).toBe(30)
    expect(clampDay(31, 2025, 8)).toBe(30)
    expect(clampDay(31, 2025, 10)).toBe(30)
  })

  it("leaves day 31 alone in 31-day months", () => {
    expect(clampDay(31, 2025, 0)).toBe(31)
    expect(clampDay(31, 2025, 6)).toBe(31)
    expect(clampDay(31, 2025, 11)).toBe(31)
  })
})

describe("computeStatementDates", () => {
  it("places a purchase BEFORE the closing day in the current month's cycle", () => {
    const result = computeStatementDates(20, 10, new Date(2025, 2, 15))

    expect(ymd(result.cycleEnd)).toBe("2025-03-20")
    expect(ymd(result.cycleStart)).toBe("2025-02-21")
    expect(ymd(result.paymentDueDate)).toBe("2025-04-10")
  })

  it("places a purchase AFTER the closing day in the next month's cycle", () => {
    const result = computeStatementDates(20, 10, new Date(2025, 2, 25))

    expect(ymd(result.cycleEnd)).toBe("2025-04-20")
    expect(ymd(result.cycleStart)).toBe("2025-03-21")
    expect(ymd(result.paymentDueDate)).toBe("2025-05-10")
  })

  it("includes a purchase made ON the closing day in the current cycle", () => {
    const result = computeStatementDates(20, 10, new Date(2025, 2, 20))

    expect(ymd(result.cycleEnd)).toBe("2025-03-20")
    expect(ymd(result.paymentDueDate)).toBe("2025-04-10")
  })

  it("wraps the year forward when reference is in December after closing", () => {
    const result = computeStatementDates(20, 10, new Date(2025, 11, 25))

    expect(ymd(result.cycleEnd)).toBe("2026-01-20")
    expect(ymd(result.paymentDueDate)).toBe("2026-02-10")
  })

  it("wraps the year backward when cycleEnd is January (cycleStart in previous December)", () => {
    const result = computeStatementDates(20, 10, new Date(2026, 0, 5))

    expect(ymd(result.cycleEnd)).toBe("2026-01-20")
    expect(ymd(result.cycleStart)).toBe("2025-12-21")
  })

  it("clamps a 31-day closing to Feb 28 in a non-leap year", () => {
    const result = computeStatementDates(31, 10, new Date(2025, 1, 20))

    expect(ymd(result.cycleEnd)).toBe("2025-02-28")
    expect(ymd(result.paymentDueDate)).toBe("2025-03-10")
  })

  it("clamps a 31-day closing to Feb 29 in a leap year", () => {
    const result = computeStatementDates(31, 10, new Date(2024, 1, 20))

    expect(ymd(result.cycleEnd)).toBe("2024-02-29")
  })

  it("clamps a 31-day payment day to the last day of a 30-day month", () => {
    const result = computeStatementDates(15, 31, new Date(2025, 2, 10))

    expect(ymd(result.cycleEnd)).toBe("2025-03-15")
    expect(ymd(result.paymentDueDate)).toBe("2025-04-30")
  })

  it("clamps a 31-day payment day to Feb 28 when the payment month is February", () => {
    const result = computeStatementDates(15, 31, new Date(2025, 0, 10))

    expect(ymd(result.cycleEnd)).toBe("2025-01-15")
    expect(ymd(result.paymentDueDate)).toBe("2025-02-28")
  })

  it("computes cycleStart as the day after the previous closing, even across month-end clamping", () => {
    const result = computeStatementDates(31, 10, new Date(2025, 2, 5))

    expect(ymd(result.cycleEnd)).toBe("2025-03-31")
    expect(ymd(result.cycleStart)).toBe("2025-03-01")
  })
})

describe("getInstallmentImpactDate", () => {
  it("returns the first cycle's payment date for installment index 0", () => {
    const purchase = new Date(2025, 2, 10)
    const cycle = computeStatementDates(20, 10, purchase)
    const impact = getInstallmentImpactDate(20, 10, purchase, 0)

    expect(ymd(impact)).toBe(ymd(cycle.paymentDueDate))
  })

  it("adds one month per installment index", () => {
    const purchase = new Date(2025, 2, 10)

    expect(ymd(getInstallmentImpactDate(20, 10, purchase, 0))).toBe("2025-04-10")
    expect(ymd(getInstallmentImpactDate(20, 10, purchase, 1))).toBe("2025-05-10")
    expect(ymd(getInstallmentImpactDate(20, 10, purchase, 5))).toBe("2025-09-10")
  })

  it("wraps the year forward when installments cross December", () => {
    const purchase = new Date(2025, 9, 10)

    expect(ymd(getInstallmentImpactDate(20, 10, purchase, 0))).toBe("2025-11-10")
    expect(ymd(getInstallmentImpactDate(20, 10, purchase, 2))).toBe("2026-01-10")
    expect(ymd(getInstallmentImpactDate(20, 10, purchase, 14))).toBe("2027-01-10")
  })

  it("clamps the payment day per target month (e.g. day 31 → Feb 28)", () => {
    const purchase = new Date(2025, 0, 5)
    const impact = getInstallmentImpactDate(15, 31, purchase, 0)

    expect(ymd(impact)).toBe("2025-02-28")
  })
})
