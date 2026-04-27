import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  checkCategoryThreshold,
  checkCreditCardAlerts,
  checkExcessiveInstallments,
  checkGoalCompleted,
  checkGoalDeadlineApproaching,
  checkGoalMilestone,
  checkInvestmentSignificantChange,
  checkNegativeBalanceRisk,
  checkSpendingSpike,
  generateAlertsForTransaction,
} from "@/features/alerts/lib/alert-generation"
import { prisma } from "@/shared/lib/prisma"
import {
  createBudget,
  createCategory,
  createCreditCard,
  createGoal,
  createInvestment,
  createTransaction,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"

function monthsAgo(n: number, day = 15): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - n, day)
}

function thisMonth(day = 15): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), day)
}

describe("checkCategoryThreshold", () => {
  it("does nothing when category has no alertThreshold", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id, { alertThreshold: null })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(500),
      categoryId: cat.id,
      impactDate: thisMonth(),
    })

    await checkCategoryThreshold({
      userId: user.id,
      categoryId: cat.id,
      impactDate: thisMonth(),
    })

    expect(await prisma.alert.count({ where: { userId: user.id } })).toBe(0)
  })

  it("does nothing when current sum is below threshold", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id, { alertThreshold: dollars(100) })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
      categoryId: cat.id,
      impactDate: thisMonth(),
    })

    await checkCategoryThreshold({
      userId: user.id,
      categoryId: cat.id,
      impactDate: thisMonth(),
    })

    expect(await prisma.alert.count({ where: { userId: user.id } })).toBe(0)
  })

  it("emits CATEGORY_THRESHOLD_EXCEEDED when current sum exceeds the threshold", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id, { alertThreshold: dollars(100) })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(150),
      categoryId: cat.id,
      impactDate: thisMonth(),
    })

    await checkCategoryThreshold({
      userId: user.id,
      categoryId: cat.id,
      impactDate: thisMonth(),
    })

    const alert = await prisma.alert.findFirstOrThrow({
      where: { userId: user.id },
    })
    expect(alert.type).toBe("CATEGORY_THRESHOLD_EXCEEDED")
  })
})

describe("checkSpendingSpike", () => {
  it("does nothing when there is less than 3 months of historical data", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id, { alertThreshold: dollars(50) })
    // Only current month + 1 historical month
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(500),
      categoryId: cat.id,
      impactDate: thisMonth(),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
      categoryId: cat.id,
      impactDate: monthsAgo(1),
    })

    await checkSpendingSpike({
      userId: user.id,
      categoryId: cat.id,
      impactDate: thisMonth(),
    })

    expect(await prisma.alert.count({ where: { userId: user.id } })).toBe(0)
  })

  it("emits CATEGORY_SPENDING_SPIKE when current > 1.5x avg of last 3 months", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id, { alertThreshold: dollars(50) })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(1000),
      categoryId: cat.id,
      impactDate: thisMonth(),
    })
    for (let i = 1; i <= 3; i++) {
      await createTransaction(user.id, {
        type: "EXPENSE",
        amount: dollars(100),
        categoryId: cat.id,
        impactDate: monthsAgo(i),
      })
    }

    await checkSpendingSpike({
      userId: user.id,
      categoryId: cat.id,
      impactDate: thisMonth(),
    })

    const alert = await prisma.alert.findFirstOrThrow({
      where: { userId: user.id, type: "CATEGORY_SPENDING_SPIKE" },
    })
    expect(alert.severity).toBe("CRITICAL")
  })
})

describe("checkCreditCardAlerts", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("emits CREDIT_CARD_HIGH_USAGE when usage > 95% of limit", async () => {
    vi.setSystemTime(new Date(2026, 3, 15)) // April 15, 2026
    const user = await createUser()
    const card = await createCreditCard(user.id, {
      closingDay: 20,
      paymentDay: 10,
      totalLimit: dollars(1000),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(960),
      creditCardId: card.id,
      date: new Date(2026, 3, 12),
    })

    await checkCreditCardAlerts(
      [
        {
          id: card.id,
          name: card.name,
          totalLimit: card.totalLimit,
          closingDay: card.closingDay,
          paymentDay: card.paymentDay,
        },
      ],
      user.id,
    )

    const high = await prisma.alert.findFirst({
      where: { userId: user.id, type: "CREDIT_CARD_HIGH_USAGE" },
    })
    expect(high).not.toBeNull()
  })

  it("emits CREDIT_CARD_PAYMENT_DUE when payment day is within 3 days and balance > 0", async () => {
    vi.setSystemTime(new Date(2026, 3, 8)) // April 8 — payment day is the 10th
    const user = await createUser()
    const card = await createCreditCard(user.id, {
      closingDay: 20,
      paymentDay: 10,
      totalLimit: dollars(1000),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      creditCardId: card.id,
      date: new Date(2026, 3, 5),
    })

    await checkCreditCardAlerts(
      [
        {
          id: card.id,
          name: card.name,
          totalLimit: card.totalLimit,
          closingDay: card.closingDay,
          paymentDay: card.paymentDay,
        },
      ],
      user.id,
    )

    const due = await prisma.alert.findFirst({
      where: { userId: user.id, type: "CREDIT_CARD_PAYMENT_DUE" },
    })
    expect(due).not.toBeNull()
  })
})

describe("goal alerts", () => {
  it("emits GOAL_MILESTONE alerts for crossed thresholds (25/50/75)", async () => {
    const user = await createUser()
    const goal = await createGoal(user.id, { targetAmount: dollars(1000) })

    await checkGoalMilestone({
      goalId: goal.id,
      userId: user.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      totalContributed: dollars(600), // 60% → fires 25 + 50
      targetDate: null,
      status: "ACTIVE",
    })

    const alerts = await prisma.alert.findMany({
      where: { userId: user.id, type: "GOAL_MILESTONE" },
    })
    expect(alerts).toHaveLength(2)
    expect(alerts.map((a) => a.deduplicationKey).sort()).toEqual([
      "milestone-25",
      "milestone-50",
    ])
  })

  it("emits GOAL_COMPLETED when totalContributed reaches target", async () => {
    const user = await createUser()
    const goal = await createGoal(user.id, { targetAmount: dollars(500) })

    await checkGoalCompleted({
      goalId: goal.id,
      userId: user.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      totalContributed: dollars(500),
      targetDate: null,
      status: "ACTIVE",
    })

    const alert = await prisma.alert.findFirstOrThrow({
      where: { userId: user.id, type: "GOAL_COMPLETED" },
    })
    expect(alert.severity).toBe("INFO")
  })

  it("emits GOAL_DEADLINE_APPROACHING within 7 days for ACTIVE goals", async () => {
    const user = await createUser()
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 5)
    const goal = await createGoal(user.id, {
      targetAmount: dollars(1000),
      targetDate,
    })

    await checkGoalDeadlineApproaching({
      goalId: goal.id,
      userId: user.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      totalContributed: 0,
      targetDate,
      status: "ACTIVE",
    })

    const alert = await prisma.alert.findFirst({
      where: { userId: user.id, type: "GOAL_DEADLINE_APPROACHING" },
    })
    expect(alert).not.toBeNull()
  })

  it("does NOT emit GOAL_DEADLINE_APPROACHING for COMPLETED goals", async () => {
    const user = await createUser()
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 5)
    const goal = await createGoal(user.id, {
      targetAmount: dollars(1000),
      targetDate,
      status: "COMPLETED",
    })

    await checkGoalDeadlineApproaching({
      goalId: goal.id,
      userId: user.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      totalContributed: 0,
      targetDate,
      status: "COMPLETED",
    })

    expect(await prisma.alert.count({ where: { userId: user.id } })).toBe(0)
  })
})

describe("checkInvestmentSignificantChange", () => {
  it("emits INFO severity when investment gains > 10%", async () => {
    const user = await createUser()
    const inv = await createInvestment(user.id, {
      initialAmount: dollars(1000),
      currentValue: dollars(1200), // +20%
    })

    await checkInvestmentSignificantChange({
      investmentId: inv.id,
      userId: user.id,
      investmentName: inv.name,
      initialAmount: inv.initialAmount,
      currentValue: inv.currentValue,
    })

    const alert = await prisma.alert.findFirstOrThrow({
      where: { userId: user.id, type: "INVESTMENT_SIGNIFICANT_CHANGE" },
    })
    expect(alert.severity).toBe("INFO")
    expect(alert.message).toContain("gained")
  })

  it("emits WARNING severity when investment loses > 10%", async () => {
    const user = await createUser()
    const inv = await createInvestment(user.id, {
      initialAmount: dollars(1000),
      currentValue: dollars(800), // -20%
    })

    await checkInvestmentSignificantChange({
      investmentId: inv.id,
      userId: user.id,
      investmentName: inv.name,
      initialAmount: inv.initialAmount,
      currentValue: inv.currentValue,
    })

    const alert = await prisma.alert.findFirstOrThrow({
      where: { userId: user.id },
    })
    expect(alert.severity).toBe("WARNING")
    expect(alert.message).toContain("lost")
  })

  it("does nothing when change is within ±10%", async () => {
    const user = await createUser()
    const inv = await createInvestment(user.id, {
      initialAmount: dollars(1000),
      currentValue: dollars(1050), // +5%
    })

    await checkInvestmentSignificantChange({
      investmentId: inv.id,
      userId: user.id,
      investmentName: inv.name,
      initialAmount: inv.initialAmount,
      currentValue: inv.currentValue,
    })

    expect(await prisma.alert.count({ where: { userId: user.id } })).toBe(0)
  })
})

describe("checkNegativeBalanceRisk", () => {
  it("emits NEGATIVE_BALANCE_RISK when avg net is negative across last 3 months", async () => {
    const user = await createUser()
    for (let i = 1; i <= 3; i++) {
      await createTransaction(user.id, {
        type: "INCOME",
        amount: dollars(1000),
        impactDate: monthsAgo(i),
      })
      await createTransaction(user.id, {
        type: "EXPENSE",
        amount: dollars(2000),
        impactDate: monthsAgo(i),
      })
    }

    await checkNegativeBalanceRisk(user.id)

    const alert = await prisma.alert.findFirstOrThrow({
      where: { userId: user.id, type: "NEGATIVE_BALANCE_RISK" },
    })
    expect(alert.severity).toBe("CRITICAL")
  })

  it("does NOT emit when avg net is positive", async () => {
    const user = await createUser()
    for (let i = 1; i <= 3; i++) {
      await createTransaction(user.id, {
        type: "INCOME",
        amount: dollars(2000),
        impactDate: monthsAgo(i),
      })
      await createTransaction(user.id, {
        type: "EXPENSE",
        amount: dollars(1000),
        impactDate: monthsAgo(i),
      })
    }

    await checkNegativeBalanceRisk(user.id)

    expect(await prisma.alert.count({ where: { userId: user.id } })).toBe(0)
  })
})

describe("checkExcessiveInstallments", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("emits EXCESSIVE_INSTALLMENTS when monthly installments exceed 40% of avg income", async () => {
    vi.setSystemTime(new Date(2026, 5, 15)) // June 15, 2026
    const user = await createUser()

    // Income for last 3 months
    for (let i = 1; i <= 3; i++) {
      await createTransaction(user.id, {
        type: "INCOME",
        amount: dollars(1000),
        impactDate: new Date(2026, 5 - i, 15),
      })
    }

    // Installment payment this month — 50% of income
    const parent = await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(500),
      impactDate: new Date(2026, 5, 10),
      totalInstallments: 3,
      installmentNumber: 1,
    })
    expect(parent.id).toBeDefined()

    await checkExcessiveInstallments(user.id)

    const alert = await prisma.alert.findFirst({
      where: { userId: user.id, type: "EXCESSIVE_INSTALLMENTS" },
    })
    expect(alert).not.toBeNull()
  })
})

describe("generateAlertsForTransaction (orchestration)", () => {
  it("runs category, spike, and budget checks together without throwing", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id, { alertThreshold: dollars(100) })
    await createBudget(user.id, {
      amount: dollars(100),
      month: thisMonth().getMonth() + 1,
      year: thisMonth().getFullYear(),
      categoryId: cat.id,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(150),
      categoryId: cat.id,
      impactDate: thisMonth(),
    })

    await generateAlertsForTransaction({
      userId: user.id,
      categoryId: cat.id,
      impactDate: thisMonth(),
    })

    const alerts = await prisma.alert.findMany({ where: { userId: user.id } })
    const types = alerts.map((a) => a.type)
    expect(types).toContain("CATEGORY_THRESHOLD_EXCEEDED")
    expect(types).toContain("BUDGET_EXCEEDED")
  })
})
