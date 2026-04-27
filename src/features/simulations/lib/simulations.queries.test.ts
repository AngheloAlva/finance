import { describe, expect, it } from "vitest"
import { getFinancialSnapshot } from "@/features/simulations/lib/simulations.queries"
import { prisma } from "@/shared/lib/prisma"
import {
  createCategory,
  createCreditCard,
  createGoal,
  createGoalContribution,
  createInvestment,
  createRecurringTemplate,
  createTransaction,
  createUser,
  daysFromNow,
  dollars,
  today,
} from "../../../../tests/helpers/factories"

describe("getFinancialSnapshot", () => {
  it("returns zero/empty snapshot for a user with no data", async () => {
    const user = await createUser()
    const snap = await getFinancialSnapshot(user.id)

    expect(snap.monthlyIncome).toBe(0)
    expect(snap.monthlyExpenses).toBe(0)
    expect(snap.expensesByCategory).toEqual([])
    expect(snap.creditCards).toEqual([])
    expect(snap.outstandingInstallments).toEqual([])
    expect(snap.recurringObligations).toEqual([])
    expect(snap.goals).toEqual([])
    expect(snap.totalInvestmentValue).toBe(0)
    expect(snap.isLimitedData).toBe(true)
  })

  it("computes monthlyIncome and expensesByCategory from last 3 months", async () => {
    const user = await createUser()
    const food = await createCategory(user.id, { name: "Food" })

    // Spread across 2 distinct months → divisor = 2
    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(1000),
      date: daysFromNow(-10),
    })
    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(1000),
      date: daysFromNow(-40),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(200),
      categoryId: food.id,
      date: daysFromNow(-10),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(200),
      categoryId: food.id,
      date: daysFromNow(-40),
    })

    const snap = await getFinancialSnapshot(user.id)

    expect(snap.monthlyIncome).toBe(dollars(1000))
    expect(snap.monthlyExpenses).toBe(dollars(200))
    expect(snap.expensesByCategory).toHaveLength(1)
    expect(snap.expensesByCategory[0].categoryName).toBe("Food")
    expect(snap.expensesByCategory[0].monthlyAverage).toBe(dollars(200))
  })

  it("groups outstanding installments by parentTransactionId", async () => {
    const user = await createUser()
    const parent = await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(300),
      description: "Laptop",
      date: today(),
      impactDate: daysFromNow(-1),
    })
    // 3 future installment children pointing to parent
    for (let i = 1; i <= 3; i++) {
      await createTransaction(user.id, {
        type: "EXPENSE",
        amount: dollars(100),
        description: `Laptop (${i}/3)`,
        impactDate: daysFromNow(i * 30),
        parentTransactionId: parent.id,
        installmentNumber: i,
        totalInstallments: 3,
      })
    }

    const snap = await getFinancialSnapshot(user.id)

    expect(snap.outstandingInstallments).toHaveLength(1)
    expect(snap.outstandingInstallments[0]).toEqual(
      expect.objectContaining({
        parentTransactionId: parent.id,
        remainingPayments: 3,
        monthlyAmount: dollars(100),
        totalRemaining: dollars(300),
      }),
    )
  })

  it("normalizes recurring obligations to monthly amounts", async () => {
    const user = await createUser()
    await createRecurringTemplate(user.id, {
      type: "EXPENSE",
      amount: dollars(10),
      frequency: "WEEKLY",
      generationMode: "AUTO",
      nextGenerationDate: daysFromNow(7),
    })
    await createRecurringTemplate(user.id, {
      type: "EXPENSE",
      amount: dollars(60),
      frequency: "ANNUAL",
      generationMode: "AUTO",
      nextGenerationDate: daysFromNow(7),
    })

    const snap = await getFinancialSnapshot(user.id)

    const weekly = snap.recurringObligations.find((r) => r.monthlyAmount > dollars(40))
    const annual = snap.recurringObligations.find((r) => r.monthlyAmount === dollars(5))
    // WEEKLY: 10 * 52/12 ≈ 43.33
    expect(weekly?.monthlyAmount).toBe(Math.round(dollars(10) * (52 / 12)))
    // ANNUAL: 60 / 12 = 5
    expect(annual?.monthlyAmount).toBe(dollars(5))
  })

  it("computes goals with summed contributions and remaining", async () => {
    const user = await createUser()
    const goal = await createGoal(user.id, {
      name: "Emergency",
      targetAmount: dollars(1000),
    })
    await createGoalContribution(user.id, goal.id, { amount: dollars(200) })
    await createGoalContribution(user.id, goal.id, { amount: dollars(100) })

    const snap = await getFinancialSnapshot(user.id)

    expect(snap.goals).toHaveLength(1)
    expect(snap.goals[0].currentAmount).toBe(dollars(300))
    expect(snap.goals[0].remaining).toBe(dollars(700))
  })

  it("aggregates active investments and inactive credit cards are excluded", async () => {
    const user = await createUser()
    await createInvestment(user.id, {
      initialAmount: dollars(500),
      currentValue: dollars(700),
    })
    const card = await createCreditCard(user.id)
    // Deactivate to exclude from snapshot
    await prisma.creditCard.update({
      where: { id: card.id },
      data: { isActive: false },
    })

    const snap = await getFinancialSnapshot(user.id)

    expect(snap.totalInvestmentValue).toBe(dollars(700))
    expect(snap.creditCards).toEqual([])
  })
})
