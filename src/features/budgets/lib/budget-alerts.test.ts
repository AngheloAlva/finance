import { describe, expect, it } from "vitest"
import { checkBudgetThresholds } from "@/features/budgets/lib/budget-alerts"
import { prisma } from "@/shared/lib/prisma"
import {
  createBudget,
  createCategory,
  createTransaction,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"

const APRIL_2026 = new Date(2026, 3, 15)

async function setupBudgetCase(amountSpent: number, budgetAmount: number) {
  const user = await createUser()
  const category = await createCategory(user.id, { name: "Food" })
  await createBudget(user.id, {
    amount: budgetAmount,
    month: 4,
    year: 2026,
    categoryId: category.id,
  })
  const transaction =
    amountSpent > 0
      ? await createTransaction(user.id, {
          type: "EXPENSE",
          amount: amountSpent,
          categoryId: category.id,
          impactDate: APRIL_2026,
        })
      : null
  return { user, category, transaction }
}

describe("checkBudgetThresholds", () => {
  it("does nothing when there is no budget for the category/month", async () => {
    const user = await createUser()
    const category = await createCategory(user.id)
    const tx = await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      categoryId: category.id,
      impactDate: APRIL_2026,
    })

    await checkBudgetThresholds({
      userId: user.id,
      categoryId: category.id,
      impactDate: APRIL_2026,
      transactionId: tx.id,
      amount: tx.amount,
      type: tx.type,
      paymentMethod: tx.paymentMethod,
      creditCardId: tx.creditCardId,
    })

    const alerts = await prisma.alert.count({ where: { userId: user.id } })
    expect(alerts).toBe(0)
  })

  it("does not create an alert when spending is under 80%", async () => {
    const { user, category, transaction: tx } = await setupBudgetCase(
      dollars(50),
      dollars(100),
    )
    if (!tx) throw new Error("expected a transaction to be created")

    await checkBudgetThresholds({
      userId: user.id,
      categoryId: category.id,
      impactDate: APRIL_2026,
      transactionId: tx.id,
      amount: tx.amount,
      type: tx.type,
      paymentMethod: tx.paymentMethod,
      creditCardId: tx.creditCardId,
    })

    const alerts = await prisma.alert.count({ where: { userId: user.id } })
    expect(alerts).toBe(0)
  })

  it("creates a BUDGET_WARNING when spending is between 80% and 99%", async () => {
    const { user, category, transaction: tx } = await setupBudgetCase(
      dollars(85),
      dollars(100),
    )
    if (!tx) throw new Error("expected a transaction to be created")

    await checkBudgetThresholds({
      userId: user.id,
      categoryId: category.id,
      impactDate: APRIL_2026,
      transactionId: tx.id,
      amount: tx.amount,
      type: tx.type,
      paymentMethod: tx.paymentMethod,
      creditCardId: tx.creditCardId,
    })

    const alert = await prisma.alert.findFirstOrThrow({
      where: { userId: user.id },
    })
    expect(alert.type).toBe("BUDGET_WARNING")
    expect(alert.severity).toBe("WARNING")
    expect(alert.referenceType).toBe("budget")
  })

  it("creates a BUDGET_EXCEEDED when spending is at or over 100%", async () => {
    const { user, category, transaction: tx } = await setupBudgetCase(
      dollars(110),
      dollars(100),
    )
    if (!tx) throw new Error("expected a transaction to be created")

    await checkBudgetThresholds({
      userId: user.id,
      categoryId: category.id,
      impactDate: APRIL_2026,
      transactionId: tx.id,
      amount: tx.amount,
      type: tx.type,
      paymentMethod: tx.paymentMethod,
      creditCardId: tx.creditCardId,
    })

    const alert = await prisma.alert.findFirstOrThrow({
      where: { userId: user.id },
    })
    expect(alert.type).toBe("BUDGET_EXCEEDED")
    expect(alert.severity).toBe("CRITICAL")
  })

  it("upserts on the same dedup key (re-running does not duplicate)", async () => {
    const { user, category, transaction: tx } = await setupBudgetCase(
      dollars(110),
      dollars(100),
    )
    if (!tx) throw new Error("expected a transaction to be created")

    await checkBudgetThresholds({
      userId: user.id,
      categoryId: category.id,
      impactDate: APRIL_2026,
      transactionId: tx.id,
      amount: tx.amount,
      type: tx.type,
      paymentMethod: tx.paymentMethod,
      creditCardId: tx.creditCardId,
    })
    await checkBudgetThresholds({
      userId: user.id,
      categoryId: category.id,
      impactDate: APRIL_2026,
      transactionId: tx.id,
      amount: tx.amount,
      type: tx.type,
      paymentMethod: tx.paymentMethod,
      creditCardId: tx.creditCardId,
    })

    const alerts = await prisma.alert.count({ where: { userId: user.id } })
    expect(alerts).toBe(1)
  })

  it("ignores transactions outside the budget month", async () => {
    const user = await createUser()
    const category = await createCategory(user.id)
    await createBudget(user.id, {
      amount: dollars(100),
      month: 4,
      year: 2026,
      categoryId: category.id,
    })
    // Spent in March, not April
    const tx = await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(200),
      categoryId: category.id,
      impactDate: new Date(2026, 2, 15),
    })

    await checkBudgetThresholds({
      userId: user.id,
      categoryId: category.id,
      impactDate: APRIL_2026,
      transactionId: tx.id,
      amount: tx.amount,
      type: tx.type,
      paymentMethod: tx.paymentMethod,
      creditCardId: tx.creditCardId,
    })

    const alerts = await prisma.alert.count({ where: { userId: user.id } })
    expect(alerts).toBe(0)
  })

  it("ignores template transactions and INCOME transactions", async () => {
    const user = await createUser()
    const category = await createCategory(user.id)
    await createBudget(user.id, {
      amount: dollars(100),
      month: 4,
      year: 2026,
      categoryId: category.id,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(500),
      categoryId: category.id,
      impactDate: APRIL_2026,
      isTemplate: true,
    })
    const incomeTx = await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(500),
      categoryId: category.id,
      impactDate: APRIL_2026,
    })

    await checkBudgetThresholds({
      userId: user.id,
      categoryId: category.id,
      impactDate: APRIL_2026,
      transactionId: incomeTx.id,
      amount: incomeTx.amount,
      type: incomeTx.type,
      paymentMethod: incomeTx.paymentMethod,
      creditCardId: incomeTx.creditCardId,
    })

    const alerts = await prisma.alert.count({ where: { userId: user.id } })
    expect(alerts).toBe(0)
  })
})
