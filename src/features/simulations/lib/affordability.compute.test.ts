import { describe, expect, it } from "vitest"
import { computeAffordability } from "@/features/simulations/lib/affordability.compute"
import type { FinancialSnapshot } from "@/features/simulations/types/simulations.types"

function snapshot(overrides: Partial<FinancialSnapshot> = {}): FinancialSnapshot {
  return {
    monthlyIncome: 500_000,
    monthlyExpenses: 300_000,
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

describe("computeAffordability", () => {
  it("treats single payment as full purchase amount in month 0 only", () => {
    const result = computeAffordability(snapshot(), {
      purchaseAmount: 100_000,
      installments: 1,
    })

    expect(result.monthlyImpact).toBe(100_000)
    expect(result.cashFlowProjection[0].expenses).toBe(400_000)
    expect(result.cashFlowProjection[1].expenses).toBe(300_000)
    expect(result.cashFlowProjection[2].expenses).toBe(300_000)
  })

  it("spreads installments across the cash flow window", () => {
    const result = computeAffordability(snapshot(), {
      purchaseAmount: 90_000,
      installments: 3,
    })

    expect(result.monthlyImpact).toBe(30_000)
    expect(result.cashFlowProjection.every((m) => m.expenses === 330_000)).toBe(true)
  })

  it("flags canAfford=false when monthly impact exceeds spare income", () => {
    const result = computeAffordability(snapshot(), {
      purchaseAmount: 300_000,
      installments: 1,
    })

    expect(result.currentMonthlyBalance).toBe(200_000)
    expect(result.projectedMonthlyBalance).toBe(-100_000)
    expect(result.canAfford).toBe(false)
    expect(result.budgetWarning).toBe(true)
  })

  it("computes credit card utilization and detects limit overflow", () => {
    const result = computeAffordability(
      snapshot({
        creditCards: [
          {
            id: "card-1",
            name: "Visa",
            lastFourDigits: "1234",
            totalLimit: 1_000_000,
            usedLimit: 800_000,
            availableLimit: 200_000,
            closingDay: 20,
            paymentDay: 10,
          },
        ],
      }),
      { purchaseAmount: 300_000, installments: 1, creditCardId: "card-1" },
    )

    expect(result.creditCardImpact).toEqual({
      cardName: "Visa",
      currentUtilization: 80,
      projectedUtilization: 110,
      exceedsLimit: true,
    })
  })

  it("returns null creditCardImpact when card id is unknown", () => {
    const result = computeAffordability(snapshot(), {
      purchaseAmount: 1000,
      installments: 1,
      creditCardId: "missing",
    })

    expect(result.creditCardImpact).toBeNull()
  })

  it("returns 0 utilization when totalLimit is 0", () => {
    const result = computeAffordability(
      snapshot({
        creditCards: [
          {
            id: "c",
            name: "Zero",
            lastFourDigits: "0000",
            totalLimit: 0,
            usedLimit: 0,
            availableLimit: 0,
            closingDay: 1,
            paymentDay: 10,
          },
        ],
      }),
      { purchaseAmount: 1000, installments: 1, creditCardId: "c" },
    )

    expect(result.creditCardImpact?.currentUtilization).toBe(0)
    expect(result.creditCardImpact?.projectedUtilization).toBe(0)
    expect(result.creditCardImpact?.exceedsLimit).toBe(true)
  })
})
