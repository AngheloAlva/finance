import { describe, expect, it } from "vitest"
import { computeDebtPayoff } from "@/features/simulations/lib/debt-payoff.compute"
import type {
  FinancialSnapshot,
  OutstandingInstallment,
} from "@/features/simulations/types/simulations.types"

function snapshot(overrides: Partial<FinancialSnapshot> = {}): FinancialSnapshot {
  return {
    monthlyIncome: 1_000_000,
    monthlyExpenses: 0,
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

function inst(o: Partial<OutstandingInstallment> = {}): OutstandingInstallment {
  return {
    parentTransactionId: "p",
    description: "Item",
    creditCardId: null,
    remainingPayments: 6,
    monthlyAmount: 10_000,
    totalRemaining: 60_000,
    ...o,
  }
}

describe("computeDebtPayoff", () => {
  it("returns zeros and null debtFreeDate when there are no installments", () => {
    const result = computeDebtPayoff(snapshot())

    expect(result.totalDebt).toBe(0)
    expect(result.monthlyObligation).toBe(0)
    expect(result.debtFreeDate).toBeNull()
    expect(result.installmentGroups).toEqual([])
    expect(result.highDebtRatio).toBe(false)
  })

  it("aggregates totalDebt and monthlyObligation across all groups", () => {
    const result = computeDebtPayoff(
      snapshot({
        outstandingInstallments: [
          inst({ parentTransactionId: "a", monthlyAmount: 10_000, totalRemaining: 30_000 }),
          inst({ parentTransactionId: "b", monthlyAmount: 25_000, totalRemaining: 100_000 }),
        ],
      }),
    )

    expect(result.totalDebt).toBe(130_000)
    expect(result.monthlyObligation).toBe(35_000)
    expect(result.totalCost).toBe(130_000)
  })

  it("picks debtFreeDate as the latest projected payoff", () => {
    const result = computeDebtPayoff(
      snapshot({
        outstandingInstallments: [
          inst({ parentTransactionId: "a", remainingPayments: 3 }),
          inst({ parentTransactionId: "b", remainingPayments: 18 }),
          inst({ parentTransactionId: "c", remainingPayments: 9 }),
        ],
      }),
    )

    const longest = result.installmentGroups.find((g) => g.remainingPayments === 18)
    expect(result.debtFreeDate?.getTime()).toBe(longest?.projectedPayoffDate.getTime())
  })

  it("flags highDebtRatio when monthlyObligation > 30% of income", () => {
    const result = computeDebtPayoff(
      snapshot({
        monthlyIncome: 1_000_000,
        outstandingInstallments: [
          inst({ monthlyAmount: 350_000, totalRemaining: 700_000, remainingPayments: 2 }),
        ],
      }),
    )

    expect(result.debtCoverageRatio).toBeCloseTo(0.35, 2)
    expect(result.highDebtRatio).toBe(true)
  })

  it("clamps debtCoverageRatio to 0 when income is 0", () => {
    const result = computeDebtPayoff(
      snapshot({
        monthlyIncome: 0,
        outstandingInstallments: [inst({ monthlyAmount: 50_000 })],
      }),
    )

    expect(result.debtCoverageRatio).toBe(0)
    expect(result.highDebtRatio).toBe(false)
  })
})
