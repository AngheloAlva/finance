import { describe, expect, it } from "vitest"
import {
  clampDateRange,
  computeHealthSubScore,
  formatDateRange,
  getDateRangePresets,
  parseDateRange,
} from "@/features/analytics/lib/analytics.utils"

describe("computeHealthSubScore", () => {
  const thresholds = [
    { threshold: 100, score: 100 },
    { threshold: 50, score: 60 },
    { threshold: 0, score: 0 },
  ]

  it("returns top score when value matches the highest threshold", () => {
    expect(computeHealthSubScore(120, thresholds)).toBe(100)
    expect(computeHealthSubScore(100, thresholds)).toBe(100)
  })

  it("returns lowest score when value is below the lowest threshold", () => {
    expect(computeHealthSubScore(-50, thresholds)).toBe(0)
  })

  it("interpolates linearly between thresholds", () => {
    // value=75 → halfway between 50 (score 60) and 100 (score 100) → 80
    expect(computeHealthSubScore(75, thresholds)).toBe(80)
  })

  it("does not require pre-sorted thresholds", () => {
    const unsorted = [
      { threshold: 50, score: 60 },
      { threshold: 100, score: 100 },
      { threshold: 0, score: 0 },
    ]
    expect(computeHealthSubScore(75, unsorted)).toBe(80)
  })
})

describe("getDateRangePresets", () => {
  it("returns the 5 expected preset values in order", () => {
    expect(getDateRangePresets().map((p) => p.value)).toEqual([
      "30d",
      "3m",
      "6m",
      "12m",
      "ytd",
    ])
  })

  it("ytd preset starts on Jan 1 of current year", () => {
    const ytd = getDateRangePresets().find((p) => p.value === "ytd")!
    expect(ytd.from.getMonth()).toBe(0)
    expect(ytd.from.getDate()).toBe(1)
  })
})

describe("formatDateRange", () => {
  it("formats both endpoints with month-day-year", () => {
    const out = formatDateRange(new Date(2026, 0, 5), new Date(2026, 2, 10), "en-US")
    expect(out).toMatch(/Jan 5, 2026/)
    expect(out).toMatch(/Mar 10, 2026/)
    expect(out).toContain(" - ")
  })
})

describe("clampDateRange", () => {
  it("returns range unchanged when within max", () => {
    const from = new Date(2026, 0, 1)
    const to = new Date(2026, 0, 15)
    const clamped = clampDateRange(from, to, 30)
    expect(clamped.from).toBe(from)
    expect(clamped.to).toBe(to)
  })

  it("rolls from-back from to when range exceeds max", () => {
    const from = new Date(2026, 0, 1)
    const to = new Date(2026, 5, 1)
    const clamped = clampDateRange(from, to, 30)
    const diffMs = clamped.to.getTime() - clamped.from.getTime()
    expect(diffMs).toBe(30 * 24 * 60 * 60 * 1000)
    expect(clamped.to).toBe(to)
  })
})

describe("parseDateRange", () => {
  it("matches a known preset string", () => {
    const out = parseDateRange({ preset: "30d" })
    expect(out.preset).toBe("30d")
  })

  it("returns custom preset when explicit from/to are valid", () => {
    const out = parseDateRange({ from: "2026-01-01", to: "2026-02-01" })
    expect(out.preset).toBe("custom")
    expect(out.from.toISOString().startsWith("2026-01-01")).toBe(true)
  })

  it("falls back to 12m default when nothing parseable is provided", () => {
    const out = parseDateRange({})
    expect(out.preset).toBe("12m")
  })

  it("ignores invalid dates and falls back to default", () => {
    const out = parseDateRange({ from: "not-a-date", to: "also-bad" })
    expect(out.preset).toBe("12m")
  })

  it("ignores unknown preset and falls back to default when no custom dates", () => {
    const out = parseDateRange({ preset: "999y" })
    expect(out.preset).toBe("12m")
  })
})
