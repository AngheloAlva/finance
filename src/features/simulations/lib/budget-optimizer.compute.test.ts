import { describe, expect, it } from "vitest"
import { computeBudgetOptimizer } from "@/features/simulations/lib/budget-optimizer.compute"
import type {
  CategoryExpense,
  FinancialSnapshot,
} from "@/features/simulations/types/simulations.types"

function category(overrides: Partial<CategoryExpense> = {}): CategoryExpense {
  return {
    categoryId: "cat-x",
    categoryName: "X",
    categoryColor: "#000",
    categoryIcon: "x",
    isAvoidable: false,
    isRecurring: false,
    alertThreshold: null,
    monthlyAverage: 0,
    ...overrides,
  }
}

function snapshot(overrides: Partial<FinancialSnapshot> = {}): FinancialSnapshot {
  return {
    monthlyIncome: 1_000_000,
    monthlyExpenses: 600_000,
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

describe("computeBudgetOptimizer", () => {
  it("separates avoidable from non-avoidable expenses", () => {
    const result = computeBudgetOptimizer(
      snapshot({
        expensesByCategory: [
          category({ categoryId: "rent", isAvoidable: false, monthlyAverage: 400_000 }),
          category({ categoryId: "eating", isAvoidable: true, monthlyAverage: 200_000 }),
        ],
      }),
    )

    expect(result.avoidableExpenses).toBe(200_000)
    expect(result.nonAvoidableExpenses).toBe(400_000)
  })

  it("sorts avoidable categories first, then by amount desc", () => {
    const result = computeBudgetOptimizer(
      snapshot({
        expensesByCategory: [
          category({ categoryId: "a", isAvoidable: false, monthlyAverage: 500_000 }),
          category({ categoryId: "b", isAvoidable: true, monthlyAverage: 100_000 }),
          category({ categoryId: "c", isAvoidable: true, monthlyAverage: 300_000 }),
        ],
      }),
    )

    expect(result.categories.map((c) => c.categoryId)).toEqual(["c", "b", "a"])
  })

  it("computes percentOfTotal with 2-decimal rounding", () => {
    const result = computeBudgetOptimizer(
      snapshot({
        monthlyExpenses: 300_000,
        expensesByCategory: [
          category({ categoryId: "a", monthlyAverage: 100_000 }),
        ],
      }),
    )

    expect(result.categories[0].percentOfTotal).toBeCloseTo(33.33, 2)
  })

  it("flags exceedsThreshold when alertThreshold is set and surpassed", () => {
    const result = computeBudgetOptimizer(
      snapshot({
        expensesByCategory: [
          category({ categoryId: "a", monthlyAverage: 50_000, alertThreshold: 40_000 }),
          category({ categoryId: "b", monthlyAverage: 30_000, alertThreshold: 50_000 }),
          category({ categoryId: "c", monthlyAverage: 999, alertThreshold: null }),
        ],
      }),
    )

    expect(result.categories.find((c) => c.categoryId === "a")?.exceedsThreshold).toBe(true)
    expect(result.categories.find((c) => c.categoryId === "b")?.exceedsThreshold).toBe(false)
    expect(result.categories.find((c) => c.categoryId === "c")?.exceedsThreshold).toBe(false)
  })

  it("only suggests savings on avoidable categories with spend > 0", () => {
    const result = computeBudgetOptimizer(
      snapshot({
        expensesByCategory: [
          category({ categoryId: "a", isAvoidable: true, monthlyAverage: 100_000 }),
          category({ categoryId: "b", isAvoidable: false, monthlyAverage: 200_000 }),
          category({ categoryId: "c", isAvoidable: true, monthlyAverage: 0 }),
        ],
      }),
    )

    expect(result.categories.find((c) => c.categoryId === "a")?.suggestion).toContain("50000")
    expect(result.categories.find((c) => c.categoryId === "b")?.suggestion).toBeNull()
    expect(result.categories.find((c) => c.categoryId === "c")?.suggestion).toBeNull()
  })

  it("emits 4 reduction scenarios that scale linearly with avoidable", () => {
    const result = computeBudgetOptimizer(
      snapshot({
        expensesByCategory: [
          category({ categoryId: "a", isAvoidable: true, monthlyAverage: 200_000 }),
        ],
      }),
    )

    expect(result.reductionScenarios.map((s) => s.percent)).toEqual([25, 50, 75, 100])
    expect(result.reductionScenarios.map((s) => s.monthlySavings)).toEqual([
      50_000, 100_000, 150_000, 200_000,
    ])
  })

  it("handles zero income without dividing by zero", () => {
    const result = computeBudgetOptimizer(
      snapshot({ monthlyIncome: 0, monthlyExpenses: 0, expensesByCategory: [] }),
    )

    expect(result.savingsRate).toBe(0)
    expect(result.potentialSavingsRate).toBe(0)
    expect(result.reductionScenarios.every((s) => s.newSavingsRate === 0)).toBe(true)
  })
})
