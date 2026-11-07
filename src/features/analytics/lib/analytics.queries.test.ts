import { describe, expect, it } from "vitest"
import {
  detectRisingTrends,
  getBudgetVsActual,
  getCategoryComparison,
  getDailySpending,
  getFinancialHealthScore,
  getIncomeVsExpensesTrend,
  getMonthComparison,
  getNetWorthTimeline,
} from "@/features/analytics/lib/analytics.queries"
import {
  createCategory,
  createCreditCard,
  createInvestment,
  createInvestmentSnapshot,
  createTransaction,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"

const NO_FILTERS = { categoryIds: [], paymentMethod: null, creditCardId: null, tagId: null }
const utc = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day))

describe("getIncomeVsExpensesTrend", () => {
  it("returns one zero point per day for a short range without transactions", async () => {
    const user = await createUser()
    const trend = await getIncomeVsExpensesTrend(
      user.id,
      { from: utc(2026, 1, 1), to: utc(2026, 1, 7) },
      NO_FILTERS,
    )
    expect(trend.granularity).toBe("day")
    expect(trend.points).toHaveLength(7)
    expect(trend.points.every((p) => p.income === 0 && p.expenses === 0)).toBe(true)
  })

  it("buckets income and expenses by month for long ranges, including the last day", async () => {
    const user = await createUser()
    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(1000),
      impactDate: utc(2026, 3, 5),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(400),
      impactDate: utc(2026, 3, 31),
    })

    const trend = await getIncomeVsExpensesTrend(
      user.id,
      { from: utc(2026, 1, 1), to: utc(2026, 3, 31) },
      NO_FILTERS,
    )
    expect(trend.granularity).toBe("month")
    const march = trend.points[trend.points.length - 1]
    expect(march.key).toBe("2026-03-01")
    expect(march.income).toBe(dollars(1000))
    expect(march.expenses).toBe(dollars(400))
    expect(march.netSavings).toBe(dollars(600))
  })

  it("only counts transactions matching the filters", async () => {
    const user = await createUser()
    const food = await createCategory(user.id, { name: "Food" })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(30),
      categoryId: food.id,
      impactDate: utc(2026, 1, 3),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(70),
      impactDate: utc(2026, 1, 3),
    })

    const trend = await getIncomeVsExpensesTrend(
      user.id,
      { from: utc(2026, 1, 1), to: utc(2026, 1, 7) },
      { ...NO_FILTERS, categoryIds: [food.id] },
    )
    expect(trend.points[2].expenses).toBe(dollars(30))
  })
})

describe("getCategoryComparison", () => {
  it("returns category-level deltas and sorts by max(period) desc", async () => {
    const user = await createUser()
    const food = await createCategory(user.id, { name: "Food" })
    const fun = await createCategory(user.id, { name: "Fun" })

    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      categoryId: food.id,
      impactDate: utc(2026, 1, 31),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(150),
      categoryId: food.id,
      impactDate: utc(2026, 2, 15),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(20),
      categoryId: fun.id,
      impactDate: utc(2026, 2, 15),
    })

    const items = await getCategoryComparison(
      user.id,
      { from: utc(2026, 1, 1), to: utc(2026, 1, 31) },
      { from: utc(2026, 2, 1), to: utc(2026, 2, 28) },
      "en",
      NO_FILTERS,
    )

    expect(items[0].categoryName).toBe("Food")
    expect(items[0].period1Total).toBe(dollars(100))
    expect(items[0].period2Total).toBe(dollars(150))
    expect(items[0].change).toBe(50)
  })

  it("only counts expenses paid with the filtered credit card", async () => {
    const user = await createUser()
    const card = await createCreditCard(user.id)
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(40),
      creditCardId: card.id,
      impactDate: utc(2026, 2, 10),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(60),
      impactDate: utc(2026, 2, 10),
    })

    const items = await getCategoryComparison(
      user.id,
      { from: utc(2026, 1, 1), to: utc(2026, 1, 31) },
      { from: utc(2026, 2, 1), to: utc(2026, 2, 28) },
      "en",
      { ...NO_FILTERS, creditCardId: card.id },
    )

    expect(items).toHaveLength(1)
    expect(items[0].period2Total).toBe(dollars(40))
  })
})

describe("getDailySpending", () => {
  it("aggregates EXPENSE per day sorted ascending, including the last day", async () => {
    const user = await createUser()
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(10),
      impactDate: utc(2026, 1, 5),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(20),
      impactDate: utc(2026, 1, 5),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
      impactDate: utc(2026, 1, 31),
    })

    const days = await getDailySpending(
      user.id,
      { from: utc(2026, 1, 1), to: utc(2026, 1, 31) },
      NO_FILTERS,
    )

    expect(days).toHaveLength(2)
    expect(days[0]).toMatchObject({ date: "2026-01-05", total: dollars(30), count: 2 })
    expect(days[1]).toMatchObject({ date: "2026-01-31", total: dollars(50), count: 1 })
  })
})

describe("getNetWorthTimeline", () => {
  const wholeYear = { from: utc(2026, 1, 1), to: utc(2026, 12, 31) }

  it("returns empty when no investment snapshots exist", async () => {
    const user = await createUser()
    const timeline = await getNetWorthTimeline(user.id, wholeYear)
    expect(timeline).toEqual([])
  })

  it("groups asset snapshots by month", async () => {
    const user = await createUser()
    const inv = await createInvestment(user.id, {
      initialAmount: dollars(1000),
      currentValue: dollars(1200),
    })
    await createInvestmentSnapshot(inv.id, {
      date: new Date(2026, 0, 15),
      value: dollars(1100),
    })
    await createInvestmentSnapshot(inv.id, {
      date: new Date(2026, 1, 15),
      value: dollars(1200),
    })

    const timeline = await getNetWorthTimeline(user.id, wholeYear)
    expect(timeline.map((p) => p.date)).toEqual(["2026-01", "2026-02"])
    expect(timeline[0].assets).toBe(dollars(1100))
    expect(timeline[1].assets).toBe(dollars(1200))
  })

  it("leaves out months outside the range", async () => {
    const user = await createUser()
    const inv = await createInvestment(user.id, {
      initialAmount: dollars(1000),
      currentValue: dollars(1200),
    })
    await createInvestmentSnapshot(inv.id, { date: utc(2025, 12, 15), value: dollars(900) })
    await createInvestmentSnapshot(inv.id, { date: utc(2026, 2, 15), value: dollars(1200) })

    const timeline = await getNetWorthTimeline(user.id, {
      from: utc(2026, 2, 10),
      to: utc(2026, 3, 9),
    })
    expect(timeline.map((p) => p.date)).toEqual(["2026-02"])
  })
})

describe("getBudgetVsActual", () => {
  it("only returns categories with alertThreshold set", async () => {
    const user = await createUser()
    const tracked = await createCategory(user.id, {
      name: "Tracked",
      alertThreshold: dollars(100),
    })
    await createCategory(user.id, { name: "Untracked", alertThreshold: null })

    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
      categoryId: tracked.id,
      impactDate: new Date(2026, 3, 15),
    })

    const items = await getBudgetVsActual(user.id, 4, 2026, "en")
    expect(items).toHaveLength(1)
    expect(items[0].budget).toBe(dollars(100))
    expect(items[0].actual).toBe(dollars(50))
    expect(items[0].percentage).toBe(50)
  })
})

describe("getMonthComparison", () => {
  it("computes overall direction and sorts items by abs change desc", async () => {
    const user = await createUser()
    const food = await createCategory(user.id, { name: "Food" })
    const fun = await createCategory(user.id, { name: "Fun" })

    // March 2026 (previous)
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      categoryId: food.id,
      impactDate: new Date(2026, 2, 15),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(200),
      categoryId: fun.id,
      impactDate: new Date(2026, 2, 15),
    })
    // April 2026 (current)
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(300),
      categoryId: food.id,
      impactDate: new Date(2026, 3, 15),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(180),
      categoryId: fun.id,
      impactDate: new Date(2026, 3, 15),
    })

    const result = await getMonthComparison(user.id, 4, 2026, "en")

    expect(result.totalCurrentMonth).toBe(dollars(480))
    expect(result.totalPreviousMonth).toBe(dollars(300))
    expect(result.overallDirection).toBe("up")
    // Food: +200% absChange beats Fun: -10%
    expect(result.items[0].categoryName).toBe("Food")
  })
})

describe("detectRisingTrends", () => {
  it("flags only categories with strict ascending spending across 3 months", async () => {
    const user = await createUser()
    const rising = await createCategory(user.id, { name: "Rising" })
    const flat = await createCategory(user.id, { name: "Flat" })

    // 3 months of data: months -2, -1, 0 relative to April 2026
    const amountsRising = [dollars(50), dollars(80), dollars(120)]
    const amountsFlat = [dollars(50), dollars(50), dollars(50)]

    for (let i = 0; i < 3; i++) {
      const monthOffset = i // 0 → February, 1 → March, 2 → April
      const date = new Date(2026, 1 + monthOffset, 15)
      await createTransaction(user.id, {
        type: "EXPENSE",
        amount: amountsRising[i],
        categoryId: rising.id,
        impactDate: date,
      })
      await createTransaction(user.id, {
        type: "EXPENSE",
        amount: amountsFlat[i],
        categoryId: flat.id,
        impactDate: date,
      })
    }

    const trends = await detectRisingTrends(user.id, 4, 2026, "en")

    expect(trends.map((t) => t.categoryName)).toEqual(["Rising"])
    expect(trends[0].totalIncreasePercent).toBe(140)
  })
})

describe("getFinancialHealthScore", () => {
  it("returns Insufficient Data when fewer than 2 months of transactions exist", async () => {
    const user = await createUser()
    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(1000),
      impactDate: new Date(),
    })

    const score = await getFinancialHealthScore(user.id)
    expect(score.hasEnoughData).toBe(false)
    expect(score.label).toBe("Insufficient Data")
    expect(score.overall).toBe(0)
  })
})
