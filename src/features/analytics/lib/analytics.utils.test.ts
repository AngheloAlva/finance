import { describe, expect, it } from "vitest"
import { computeHealthSubScore } from "@/features/analytics/lib/analytics.utils"

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

describe("negative savings rate", () => {
  // Exact production table from analytics.queries.ts:583-590
  const table = [
    { threshold: 0.2, score: 100 },
    { threshold: 0.15, score: 80 },
    { threshold: 0.1, score: 60 },
    { threshold: 0.05, score: 40 },
    { threshold: 0, score: 20 },
    { threshold: -Infinity, score: 0 },
  ]

  it("returns a finite 0 for a moderately negative savings rate", () => {
    const result = computeHealthSubScore(-0.5, table)
    expect(Number.isFinite(result)).toBe(true)
    expect(result).toBe(0)
  })

  it("returns a finite 0 for a severely negative savings rate", () => {
    const result = computeHealthSubScore(-10, table)
    expect(Number.isFinite(result)).toBe(true)
    expect(result).toBe(0)
  })

  it("still interpolates normally between finite thresholds", () => {
    // value=0.02 is strictly between 0 (score 20) and 0.05 (score 40)
    const result = computeHealthSubScore(0.02, table)
    expect(result).toBeGreaterThan(20)
    expect(result).toBeLessThan(40)
  })
})
