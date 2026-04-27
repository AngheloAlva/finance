import { describe, expect, it } from "vitest"
import {
  calculateAllocation,
  calculateReturn,
  convertToBaseCurrency,
  displayToRate,
  rateToDisplay,
} from "@/features/investments/lib/investments.utils"
import type { Investment } from "@/features/investments/types/investments.types"

describe("convertToBaseCurrency", () => {
  it("returns amount unchanged when rate is null", () => {
    expect(convertToBaseCurrency(123_456, null)).toBe(123_456)
  })

  it("multiplies amount by rate / 10000 and rounds", () => {
    // 100 USD * 950.25 CLP/USD = 95025
    expect(convertToBaseCurrency(100, 9_502_500)).toBe(95_025)
  })
})

describe("rateToDisplay / displayToRate", () => {
  it("rateToDisplay divides stored int by 10000", () => {
    expect(rateToDisplay(9_502_500)).toBe(950.25)
  })

  it("displayToRate multiplies float by 10000 and rounds", () => {
    expect(displayToRate(950.25)).toBe(9_502_500)
    expect(displayToRate(1.234567)).toBe(12_346)
  })

  it("round-trips display → stored → display", () => {
    expect(rateToDisplay(displayToRate(123.45))).toBe(123.45)
  })
})

describe("calculateReturn", () => {
  it("computes absolute and percentage return when no fees", () => {
    const start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const result = calculateReturn(100_000, 120_000, start)

    expect(result.absoluteReturn).toBe(20_000)
    expect(result.percentageReturn).toBe(20)
    expect(result.annualizedReturn).not.toBeNull()
    // Roughly 20%/yr since startDate is ~1 year ago
    expect(result.annualizedReturn!).toBeGreaterThan(15)
    expect(result.annualizedReturn!).toBeLessThan(25)
  })

  it("subtracts fees from absolute and percentage return", () => {
    const start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const result = calculateReturn(100_000, 120_000, start, 5_000)

    expect(result.absoluteReturn).toBe(15_000)
    expect(result.percentageReturn).toBe(15)
  })

  it("returns null annualized when initial is 0", () => {
    const start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const result = calculateReturn(0, 100, start)
    expect(result.annualizedReturn).toBeNull()
    expect(result.percentageReturn).toBe(0)
  })

  it("returns null annualized when startDate is today", () => {
    const result = calculateReturn(100_000, 110_000, new Date())
    expect(result.annualizedReturn).toBeNull()
  })
})

describe("calculateAllocation", () => {
  function inv(o: Partial<Investment> & Pick<Investment, "type" | "currentValue">): Investment {
    return {
      id: "i",
      name: "Inv",
      type: o.type,
      currency: "USD",
      initialAmount: 0,
      currentValue: o.currentValue,
      currentExchangeRate: null,
      initialExchangeRate: null,
      totalFees: 0,
      startDate: new Date(),
      userId: "u",
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: null,
      ...o,
    } as Investment
  }

  it("returns empty when totalValue is 0", () => {
    expect(calculateAllocation([], "USD")).toEqual([])
  })

  it("groups by type, computes percentage, and sorts by baseCurrencyValue desc", () => {
    const investments = [
      inv({ id: "a", type: "STOCKS", currency: "USD", currentValue: 100_000 }),
      inv({ id: "b", type: "STOCKS", currency: "USD", currentValue: 50_000 }),
      inv({ id: "c", type: "CRYPTO", currency: "USD", currentValue: 200_000 }),
    ]
    const allocation = calculateAllocation(investments, "USD")

    expect(allocation).toHaveLength(2)
    expect(allocation[0].type).toBe("CRYPTO")
    expect(allocation[0].baseCurrencyValue).toBe(200_000)
    expect(allocation[1].type).toBe("STOCKS")
    expect(allocation[1].baseCurrencyValue).toBe(150_000)

    const totalPct = allocation.reduce((s, a) => s + a.percentage, 0)
    expect(totalPct).toBeCloseTo(100, 1)
  })

  it("converts non-base-currency values using stored exchange rate", () => {
    const investments = [
      inv({
        id: "a",
        type: "FUND",
        currency: "EUR",
        currentValue: 100,
        currentExchangeRate: 11_000, // 1 EUR = 1.10 USD
      }),
    ]
    const allocation = calculateAllocation(investments, "USD")
    expect(allocation[0].baseCurrencyValue).toBe(110)
    expect(allocation[0].totalValue).toBe(100)
  })
})
