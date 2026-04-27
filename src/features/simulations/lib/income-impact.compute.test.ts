import { describe, expect, it } from "vitest"
import { computeIncomeChange } from "@/features/simulations/lib/income-impact.compute"
import type { FinancialSnapshot } from "@/features/simulations/types/simulations.types"

function snapshot(overrides: Partial<FinancialSnapshot> = {}): FinancialSnapshot {
  return {
    monthlyIncome: 1_000_000,
    monthlyExpenses: 700_000,
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

describe("computeIncomeChange", () => {
  it("scales projected income by changePercent", () => {
    const result = computeIncomeChange(snapshot(), { changePercent: 20 })

    expect(result.projectedIncome).toBe(1_200_000)
    expect(result.projectedMonthlySavings).toBe(500_000)
    expect(result.deficit).toBe(false)
  })

  it("handles negative changePercent and flags deficit when projected savings < 0", () => {
    const result = computeIncomeChange(
      snapshot({ monthlyIncome: 800_000, monthlyExpenses: 700_000 }),
      { changePercent: -50 },
    )

    expect(result.projectedIncome).toBe(400_000)
    expect(result.projectedMonthlySavings).toBe(-300_000)
    expect(result.deficit).toBe(true)
  })

  it("computes goal impact months for income increase (faster) and decrease (slower)", () => {
    const goalSnap = snapshot({
      monthlyIncome: 1_000_000,
      monthlyExpenses: 700_000,
      goals: [
        {
          id: "g1",
          name: "Trip",
          targetAmount: 1_000_000,
          currentAmount: 100_000,
          targetDate: null,
          remaining: 900_000,
        },
      ],
    })

    const faster = computeIncomeChange(goalSnap, { changePercent: 100 })
    expect(faster.goalImpacts[0].currentMonthsToGoal).toBe(3)
    expect(faster.goalImpacts[0].projectedMonthsToGoal).toBe(1)
    expect(faster.goalImpacts[0].changeMonths).toBeLessThan(0)

    const slower = computeIncomeChange(goalSnap, { changePercent: -20 })
    expect(slower.goalImpacts[0].changeMonths).toBeGreaterThan(0)
  })

  it("filters out already-met goals (remaining <= 0)", () => {
    const result = computeIncomeChange(
      snapshot({
        goals: [
          { id: "g1", name: "Done", targetAmount: 100, currentAmount: 100, targetDate: null, remaining: 0 },
          { id: "g2", name: "Open", targetAmount: 200_000, currentAmount: 0, targetDate: null, remaining: 200_000 },
        ],
      }),
      { changePercent: 0 },
    )

    expect(result.goalImpacts.map((g) => g.goalName)).toEqual(["Open"])
  })

  it("returns null months when savings collapse to <= 0", () => {
    const result = computeIncomeChange(
      snapshot({
        monthlyIncome: 1_000_000,
        monthlyExpenses: 1_000_000,
        goals: [
          { id: "g", name: "Stuck", targetAmount: 100, currentAmount: 0, targetDate: null, remaining: 100 },
        ],
      }),
      { changePercent: -10 },
    )

    expect(result.goalImpacts[0].currentMonthsToGoal).toBeNull()
    expect(result.goalImpacts[0].projectedMonthsToGoal).toBeNull()
    expect(result.goalImpacts[0].changeMonths).toBe(0)
  })
})
