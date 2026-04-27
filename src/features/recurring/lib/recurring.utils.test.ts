import { describe, expect, it } from "vitest"
import {
  computeNextDate,
  generateDueInstances,
} from "@/features/recurring/lib/recurring.utils"

describe("computeNextDate", () => {
  it("DAILY adds interval days", () => {
    const next = computeNextDate(new Date(2026, 0, 10), "DAILY", 3)
    expect(next).toEqual(new Date(2026, 0, 13))
  })

  it("WEEKLY adds interval * 7 days", () => {
    const next = computeNextDate(new Date(2026, 0, 1), "WEEKLY", 2)
    expect(next).toEqual(new Date(2026, 0, 15))
  })

  it("BIWEEKLY adds interval * 14 days", () => {
    const next = computeNextDate(new Date(2026, 0, 1), "BIWEEKLY", 1)
    expect(next).toEqual(new Date(2026, 0, 15))
  })

  it("MONTHLY adds interval months", () => {
    const next = computeNextDate(new Date(2026, 0, 15), "MONTHLY", 2)
    expect(next).toEqual(new Date(2026, 2, 15))
  })

  it("BIMONTHLY adds interval * 2 months", () => {
    const next = computeNextDate(new Date(2026, 0, 15), "BIMONTHLY", 1)
    expect(next).toEqual(new Date(2026, 2, 15))
  })

  it("QUARTERLY adds interval * 3 months", () => {
    const next = computeNextDate(new Date(2026, 0, 1), "QUARTERLY", 1)
    expect(next).toEqual(new Date(2026, 3, 1))
  })

  it("SEMIANNUAL adds interval * 6 months", () => {
    const next = computeNextDate(new Date(2026, 0, 1), "SEMIANNUAL", 1)
    expect(next).toEqual(new Date(2026, 6, 1))
  })

  it("ANNUAL adds interval years", () => {
    const next = computeNextDate(new Date(2026, 5, 15), "ANNUAL", 2)
    expect(next).toEqual(new Date(2028, 5, 15))
  })

  it("MONTHLY clamps day-31 to last valid day of target month", () => {
    const next = computeNextDate(new Date(2026, 0, 31), "MONTHLY", 1) // Jan 31 → Feb
    expect(next.getMonth()).toBe(1)
    expect(next.getDate()).toBe(28) // 2026 is not a leap year
  })

  it("ANNUAL clamps Feb 29 leap year to Feb 28 in non-leap year", () => {
    const next = computeNextDate(new Date(2024, 1, 29), "ANNUAL", 1)
    expect(next.getFullYear()).toBe(2025)
    expect(next.getMonth()).toBe(1)
    expect(next.getDate()).toBe(28)
  })

  it("MONTHLY rolls over to next year when month overflows", () => {
    const next = computeNextDate(new Date(2026, 11, 10), "MONTHLY", 1)
    expect(next.getFullYear()).toBe(2027)
    expect(next.getMonth()).toBe(0)
  })
})

describe("generateDueInstances", () => {
  it("collects every overdue date up to today (inclusive)", () => {
    const today = new Date(2026, 4, 15) // May 15
    const dates = generateDueInstances(
      {
        nextGenerationDate: new Date(2026, 1, 15),
        frequency: "MONTHLY",
        interval: 1,
        endDate: null,
      },
      today,
    )

    expect(dates.map((d) => d.toISOString())).toEqual([
      new Date(2026, 1, 15).toISOString(),
      new Date(2026, 2, 15).toISOString(),
      new Date(2026, 3, 15).toISOString(),
      new Date(2026, 4, 15).toISOString(),
    ])
  })

  it("returns empty when nextGenerationDate is in the future", () => {
    const today = new Date(2026, 0, 1)
    const dates = generateDueInstances(
      {
        nextGenerationDate: new Date(2026, 5, 1),
        frequency: "MONTHLY",
        interval: 1,
        endDate: null,
      },
      today,
    )

    expect(dates).toEqual([])
  })

  it("stops at endDate even if today is later", () => {
    const today = new Date(2026, 11, 31)
    const dates = generateDueInstances(
      {
        nextGenerationDate: new Date(2026, 0, 15),
        frequency: "MONTHLY",
        interval: 1,
        endDate: new Date(2026, 2, 15), // March 15
      },
      today,
    )

    expect(dates).toHaveLength(3) // Jan, Feb, Mar
    expect(dates[dates.length - 1]).toEqual(new Date(2026, 2, 15))
  })
})
