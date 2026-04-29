import { describe, expect, it } from "vitest"
import {
  getCategoryBreakdown,
  getMonthlyFlow,
  getMonthlyOverview,
  getPortfolioSummary,
  getRecentTransactions,
} from "@/features/dashboard/lib/dashboard.queries"
import { prisma } from "@/shared/lib/prisma"
import {
  createCategory,
  createInvestment,
  createTransaction,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"

const APRIL_2026 = new Date(2026, 3, 15)
const MARCH_2026 = new Date(2026, 2, 10)

describe("getMonthlyOverview", () => {
  it("returns zeros when there are no transactions", async () => {
    const user = await createUser()
    const overview = await getMonthlyOverview(user.id, 4, 2026)
    expect(overview).toEqual({
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      transactionCount: 0,
    })
  })

  it("sums income and expenses for the month and computes balance", async () => {
    const user = await createUser()
    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(1000),
      impactDate: APRIL_2026,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(300),
      impactDate: APRIL_2026,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(200),
      impactDate: APRIL_2026,
    })

    const overview = await getMonthlyOverview(user.id, 4, 2026)
    expect(overview.totalIncome).toBe(dollars(1000))
    expect(overview.totalExpenses).toBe(dollars(500))
    expect(overview.balance).toBe(dollars(500))
    expect(overview.transactionCount).toBe(3)
  })

  it("ignores templates and transactions outside the month", async () => {
    const user = await createUser()
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(900),
      impactDate: MARCH_2026,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(900),
      impactDate: APRIL_2026,
      isTemplate: true,
    })
    const overview = await getMonthlyOverview(user.id, 4, 2026)
    expect(overview).toEqual({
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      transactionCount: 0,
    })
  })

  it("scopes per user", async () => {
    const a = await createUser()
    const b = await createUser()
    await createTransaction(a.id, {
      type: "INCOME",
      amount: dollars(500),
      impactDate: APRIL_2026,
    })
    const overview = await getMonthlyOverview(b.id, 4, 2026)
    expect(overview.totalIncome).toBe(0)
  })
})

describe("getCategoryBreakdown", () => {
  it("returns an empty array when no expenses exist", async () => {
    const user = await createUser()
    const result = await getCategoryBreakdown(user.id, 4, 2026)
    expect(result).toEqual([])
  })

  it("groups expenses by category and computes percentage, sorted desc by total", async () => {
    const user = await createUser()
    const food = await createCategory(user.id, { name: "Food" })
    const fun = await createCategory(user.id, { name: "Fun" })

    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(80),
      categoryId: food.id,
      impactDate: APRIL_2026,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(20),
      categoryId: fun.id,
      impactDate: APRIL_2026,
    })

    const result = await getCategoryBreakdown(user.id, 4, 2026)
    expect(result).toHaveLength(2)
    expect(result[0].categoryName).toBe("Food")
    expect(result[0].total).toBe(dollars(80))
    expect(result[0].percentage).toBe(80)
    expect(result[1].categoryName).toBe("Fun")
    expect(result[1].percentage).toBe(20)
  })

  it("ignores income, templates and other months", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id, { name: "X" })
    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(100),
      categoryId: cat.id,
      impactDate: APRIL_2026,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      categoryId: cat.id,
      impactDate: APRIL_2026,
      isTemplate: true,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      categoryId: cat.id,
      impactDate: MARCH_2026,
    })
    const result = await getCategoryBreakdown(user.id, 4, 2026)
    expect(result).toEqual([])
  })
})

describe("getMonthlyFlow", () => {
  it("returns N months ending at endMonth/endYear with zero buckets when empty", async () => {
    const user = await createUser()
    const flow = await getMonthlyFlow(user.id, 4, 2026, 3)
    expect(flow).toHaveLength(3)
    expect(flow.map((f) => f.month)).toEqual(["2026-02", "2026-03", "2026-04"])
    for (const item of flow) {
      expect(item.income).toBe(0)
      expect(item.expenses).toBe(0)
    }
  })

  it("buckets income and expenses by month", async () => {
    const user = await createUser()
    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(1000),
      impactDate: APRIL_2026,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(400),
      impactDate: APRIL_2026,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(200),
      impactDate: MARCH_2026,
    })

    const flow = await getMonthlyFlow(user.id, 4, 2026, 3)
    const byMonth = Object.fromEntries(flow.map((f) => [f.month, f]))
    expect(byMonth["2026-04"].income).toBe(dollars(1000))
    expect(byMonth["2026-04"].expenses).toBe(dollars(400))
    expect(byMonth["2026-03"].expenses).toBe(dollars(200))
    expect(byMonth["2026-02"]).toEqual({
      month: "2026-02",
      label: "2026-02",
      income: 0,
      expenses: 0,
    })
  })

  it("crosses year boundaries correctly", async () => {
    const user = await createUser()
    const flow = await getMonthlyFlow(user.id, 2, 2026, 4)
    expect(flow.map((f) => f.month)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ])
  })
})

describe("getPortfolioSummary", () => {
  it("returns zero summary when no investments exist", async () => {
    const user = await createUser()
    const summary = await getPortfolioSummary(user.id, "USD")
    expect(summary).toEqual({
      totalInvested: 0,
      totalCurrentValue: 0,
      absoluteReturn: 0,
      returnPercentage: 0,
      count: 0,
    })
  })

  it("aggregates same-currency investments without conversion", async () => {
    const user = await createUser()
    await createInvestment(user.id, {
      initialAmount: dollars(1000),
      currentValue: dollars(1200),
    })
    await createInvestment(user.id, {
      initialAmount: dollars(500),
      currentValue: dollars(600),
    })
    const summary = await getPortfolioSummary(user.id, "USD")
    expect(summary.totalInvested).toBe(dollars(1500))
    expect(summary.totalCurrentValue).toBe(dollars(1800))
    expect(summary.absoluteReturn).toBe(dollars(300))
    expect(summary.returnPercentage).toBe(20)
    expect(summary.count).toBe(2)
  })

  it("converts foreign-currency investments using stored exchange rates", async () => {
    const user = await createUser()
    // convertToBaseCurrency = round(amountCents * rate / 10000)
    // rate=5000 → factor 0.5; rate=6000 → factor 0.6
    await prisma.investment.create({
      data: {
        type: "STOCKS",
        name: "EUR Stock",
        institution: "Test",
        initialAmount: 100_000,
        currentValue: 200_000,
        currency: "EUR",
        purchaseExchangeRate: 5000,
        currentExchangeRate: 6000,
        startDate: new Date(),
        user: { connect: { id: user.id } },
      },
    })
    const summary = await getPortfolioSummary(user.id, "USD")
    expect(summary.totalInvested).toBe(50_000) // 100_000 * 0.5
    expect(summary.totalCurrentValue).toBe(120_000) // 200_000 * 0.6
    expect(summary.count).toBe(1)
  })

  it("ignores inactive investments", async () => {
    const user = await createUser()
    const inv = await createInvestment(user.id, {
      initialAmount: dollars(100),
      currentValue: dollars(200),
    })
    await prisma.investment.update({
      where: { id: inv.id },
      data: { isActive: false },
    })
    const summary = await getPortfolioSummary(user.id, "USD")
    expect(summary.count).toBe(0)
  })
})

describe("getRecentTransactions", () => {
  it("returns the most recent non-template transactions ordered by date desc", async () => {
    const user = await createUser()
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(10),
      date: new Date(2026, 3, 1),
      description: "old",
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(20),
      date: new Date(2026, 3, 20),
      description: "newest",
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(30),
      date: new Date(2026, 3, 10),
      description: "mid",
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(99),
      date: new Date(2026, 3, 25),
      description: "skip-template",
      isTemplate: true,
    })

    const recent = await getRecentTransactions(user.id, 5)
    expect(recent.map((t) => t.description)).toEqual(["newest", "mid", "old"])
  })

  it("respects the limit parameter", async () => {
    const user = await createUser()
    for (let i = 0; i < 4; i++) {
      await createTransaction(user.id, {
        type: "EXPENSE",
        amount: dollars(10),
        date: new Date(2026, 3, 1 + i),
      })
    }
    const recent = await getRecentTransactions(user.id, 2)
    expect(recent).toHaveLength(2)
  })
})
