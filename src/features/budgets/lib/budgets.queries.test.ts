import { describe, expect, it } from "vitest"
import {
  getBudgetSummary,
  getBudgetsWithSpending,
} from "@/features/budgets/lib/budgets.queries"
import {
  createBudget,
  createCategory,
  createTransaction,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"

const APRIL_2026 = new Date(2026, 3, 15)

describe("getBudgetsWithSpending", () => {
  it("returns empty array when no budgets exist for the month", async () => {
    const user = await createUser()
    const result = await getBudgetsWithSpending(user.id, 4, 2026)
    expect(result).toEqual([])
  })

  it("computes percentage and OK status when actual is well below budget", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id)
    await createBudget(user.id, {
      amount: dollars(100),
      month: 4,
      year: 2026,
      categoryId: cat.id,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(40),
      categoryId: cat.id,
      impactDate: APRIL_2026,
    })

    const result = await getBudgetsWithSpending(user.id, 4, 2026)

    expect(result).toHaveLength(1)
    expect(result[0].actual).toBe(dollars(40))
    expect(result[0].percentage).toBe(40)
    expect(result[0].status).toBe("ok")
  })

  it("flags WARNING status between 80% and 99%", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id)
    await createBudget(user.id, {
      amount: dollars(100),
      month: 4,
      year: 2026,
      categoryId: cat.id,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(85),
      categoryId: cat.id,
      impactDate: APRIL_2026,
    })

    const result = await getBudgetsWithSpending(user.id, 4, 2026)
    expect(result[0].status).toBe("warning")
  })

  it("flags EXCEEDED status at or over 100%", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id)
    await createBudget(user.id, {
      amount: dollars(100),
      month: 4,
      year: 2026,
      categoryId: cat.id,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(120),
      categoryId: cat.id,
      impactDate: APRIL_2026,
    })

    const result = await getBudgetsWithSpending(user.id, 4, 2026)
    expect(result[0].status).toBe("exceeded")
  })

  it("ignores transactions outside the month and template/INCOME txs", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id)
    await createBudget(user.id, {
      amount: dollars(100),
      month: 4,
      year: 2026,
      categoryId: cat.id,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(500),
      categoryId: cat.id,
      impactDate: new Date(2026, 2, 15), // March
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(500),
      categoryId: cat.id,
      impactDate: APRIL_2026,
      isTemplate: true,
    })
    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(500),
      categoryId: cat.id,
      impactDate: APRIL_2026,
    })

    const result = await getBudgetsWithSpending(user.id, 4, 2026)
    expect(result[0].actual).toBe(0)
  })
})

describe("getBudgetSummary", () => {
  it("returns zeros when there are no budgets", async () => {
    const user = await createUser()
    const summary = await getBudgetSummary(user.id, 4, 2026)
    expect(summary).toEqual({
      totalBudgeted: 0,
      totalSpent: 0,
      categoriesOnTrack: 0,
      categoriesWarning: 0,
      categoriesExceeded: 0,
      totalCategories: 0,
    })
  })

  it("sums totals and counts categories per status", async () => {
    const user = await createUser()
    const ok = await createCategory(user.id, { name: "ok" })
    const warn = await createCategory(user.id, { name: "warn" })
    const ex = await createCategory(user.id, { name: "ex" })
    for (const cat of [ok, warn, ex]) {
      await createBudget(user.id, {
        amount: dollars(100),
        month: 4,
        year: 2026,
        categoryId: cat.id,
      })
    }
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(20),
      categoryId: ok.id,
      impactDate: APRIL_2026,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(85),
      categoryId: warn.id,
      impactDate: APRIL_2026,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(150),
      categoryId: ex.id,
      impactDate: APRIL_2026,
    })

    const summary = await getBudgetSummary(user.id, 4, 2026)

    expect(summary.totalBudgeted).toBe(dollars(300))
    expect(summary.totalSpent).toBe(dollars(255))
    expect(summary.categoriesOnTrack).toBe(1)
    expect(summary.categoriesWarning).toBe(1)
    expect(summary.categoriesExceeded).toBe(1)
    expect(summary.totalCategories).toBe(3)
  })
})
