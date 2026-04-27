import { describe, expect, it } from "vitest"
import { computeSavingsGoal } from "@/features/simulations/lib/savings-projection.compute"
import type {
  FinancialSnapshot,
  GoalSnapshot,
} from "@/features/simulations/types/simulations.types"

function goal(overrides: Partial<GoalSnapshot> = {}): GoalSnapshot {
  return {
    id: "g1",
    name: "Emergency",
    targetAmount: 1_000_000,
    currentAmount: 100_000,
    targetDate: null,
    remaining: 900_000,
    ...overrides,
  }
}

function snapshot(overrides: Partial<FinancialSnapshot> = {}): FinancialSnapshot {
  return {
    monthlyIncome: 600_000,
    monthlyExpenses: 500_000,
    expensesByCategory: [],
    creditCards: [],
    outstandingInstallments: [],
    recurringObligations: [],
    goals: [],
    totalInvestmentValue: 0,
    dataMonths: 6,
    isLimitedData: false,
    ...overrides,
  }
}

describe("computeSavingsGoal", () => {
  it("returns Unknown Goal placeholder when goalId does not match", () => {
    const result = computeSavingsGoal(snapshot(), { goalId: "missing" })

    expect(result.goalName).toBe("Unknown Goal")
    expect(result.timeline).toEqual([])
  })

  it("flags goalAlreadyMet when remaining is 0", () => {
    const result = computeSavingsGoal(
      snapshot({ goals: [goal({ remaining: 0 })] }),
      { goalId: "g1" },
    )

    expect(result.goalAlreadyMet).toBe(true)
    expect(result.currentMonthsToGoal).toBe(0)
    expect(result.onTrack).toBe(true)
    expect(result.timeline).toEqual([])
  })

  it("computes monthsToGoal at the current savings rate", () => {
    const result = computeSavingsGoal(
      snapshot({ monthlyIncome: 600_000, monthlyExpenses: 500_000, goals: [goal()] }),
      { goalId: "g1" },
    )

    // savings = 100k, remaining = 900k → 9 months
    expect(result.currentMonthlySavings).toBe(100_000)
    expect(result.currentMonthsToGoal).toBe(9)
    expect(result.adjustedMonthsToGoal).toBe(9)
  })

  it("uses adjustedMonthlyContribution when provided", () => {
    const result = computeSavingsGoal(
      snapshot({ goals: [goal()] }),
      { goalId: "g1", adjustedMonthlyContribution: 300_000 },
    )

    expect(result.adjustedMonthsToGoal).toBe(3)
  })

  it("returns null monthsToGoal when savings <= 0", () => {
    const result = computeSavingsGoal(
      snapshot({ monthlyIncome: 100_000, monthlyExpenses: 100_000, goals: [goal()] }),
      { goalId: "g1" },
    )

    expect(result.currentMonthsToGoal).toBeNull()
    expect(result.adjustedMonthsToGoal).toBeNull()
  })

  it("flags onTrack=true when projected target date is on or before goal targetDate", () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 5)

    const result = computeSavingsGoal(
      snapshot({ goals: [goal({ targetDate: future })] }),
      { goalId: "g1" },
    )

    expect(result.onTrack).toBe(true)
  })

  it("flags onTrack=false when targetDate is sooner than projection", () => {
    const soon = new Date()
    soon.setMonth(soon.getMonth() + 1)

    const result = computeSavingsGoal(
      snapshot({ goals: [goal({ targetDate: soon })] }),
      { goalId: "g1" },
    )

    expect(result.onTrack).toBe(false)
  })

  it("caps timeline at 36 months", () => {
    const result = computeSavingsGoal(
      snapshot({
        monthlyIncome: 100_001,
        monthlyExpenses: 100_000,
        goals: [goal({ remaining: 100_000_000 })],
      }),
      { goalId: "g1" },
    )

    expect(result.timeline.length).toBeLessThanOrEqual(36)
  })

  it("clamps projected and adjusted timeline values to targetAmount", () => {
    const result = computeSavingsGoal(
      snapshot({
        monthlyIncome: 1_500_000,
        monthlyExpenses: 500_000,
        goals: [goal({ targetAmount: 200_000, currentAmount: 100_000, remaining: 100_000 })],
      }),
      { goalId: "g1" },
    )

    expect(result.timeline.every((m) => m.projected <= 200_000)).toBe(true)
    expect(result.timeline.every((m) => m.adjusted <= 200_000)).toBe(true)
  })
})
