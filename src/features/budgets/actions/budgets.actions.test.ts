import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const e = new Error("NEXT_REDIRECT") as Error & { digest: string }
    e.digest = `NEXT_REDIRECT;replace;${url};307;`
    throw e
  }),
}))
vi.mock("@/shared/lib/auth", () => ({
  requireSession: vi.fn(),
  getSession: vi.fn(),
}))

import { upsertBudgetAction } from "@/features/budgets/actions/upsert-budget.action"
import { deleteBudgetAction } from "@/features/budgets/actions/delete-budget.action"
import { copyBudgetsAction } from "@/features/budgets/actions/copy-budgets.action"
import { prisma } from "@/shared/lib/prisma"
import {
  createBudget,
  createCategory,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"
import { formData, setSessionUser } from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("upsertBudgetAction", () => {
  it("creates a new budget on first call", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)

    const result = await upsertBudgetAction(
      { success: true, data: undefined },
      formData({
        categoryId: cat.id,
        amount: "50000",
        month: "4",
        year: "2026",
      }),
    )

    expect(result.success).toBe(true)
    const budgets = await prisma.budget.findMany({ where: { userId: user.id } })
    expect(budgets).toHaveLength(1)
    expect(budgets[0].amount).toBe(50000)
  })

  it("updates the existing budget when called with same category/month/year", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)
    await createBudget(user.id, {
      amount: dollars(100),
      month: 4,
      year: 2026,
      categoryId: cat.id,
    })

    await upsertBudgetAction(
      { success: true, data: undefined },
      formData({
        categoryId: cat.id,
        amount: "75000",
        month: "4",
        year: "2026",
      }),
    )

    const budgets = await prisma.budget.findMany({ where: { userId: user.id } })
    expect(budgets).toHaveLength(1)
    expect(budgets[0].amount).toBe(75000)
  })

  it("rejects when category belongs to another user", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const cat = await createCategory(owner.id)

    const result = await upsertBudgetAction(
      { success: true, data: undefined },
      formData({
        categoryId: cat.id,
        amount: "5000",
        month: "4",
        year: "2026",
      }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("CATEGORY_ACCESS_DENIED")
  })
})

describe("deleteBudgetAction", () => {
  it("deletes the owner's budget", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)
    const budget = await createBudget(user.id, {
      amount: dollars(100),
      month: 4,
      year: 2026,
      categoryId: cat.id,
    })

    const result = await deleteBudgetAction(
      { success: true, data: undefined },
      formData({ id: budget.id }),
    )
    expect(result.success).toBe(true)
    expect(await prisma.budget.findUnique({ where: { id: budget.id } })).toBeNull()
  })

  it("rejects another user's budget", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const cat = await createCategory(owner.id)
    const budget = await createBudget(owner.id, {
      amount: dollars(100),
      month: 4,
      year: 2026,
      categoryId: cat.id,
    })

    const result = await deleteBudgetAction(
      { success: true, data: undefined },
      formData({ id: budget.id }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("BUDGET_NOT_OWNED")
  })
})

describe("copyBudgetsAction", () => {
  it("copies previous month budgets that don't already exist in target month", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat1 = await createCategory(user.id, { name: "A" })
    const cat2 = await createCategory(user.id, { name: "B" })

    // Previous month (March 2026): 2 budgets
    await createBudget(user.id, { amount: dollars(100), month: 3, year: 2026, categoryId: cat1.id })
    await createBudget(user.id, { amount: dollars(200), month: 3, year: 2026, categoryId: cat2.id })

    // Target month (April 2026): 1 already-existing budget for cat1
    await createBudget(user.id, { amount: dollars(999), month: 4, year: 2026, categoryId: cat1.id })

    const result = await copyBudgetsAction(
      { success: true, data: 0 },
      formData({ month: "4", year: "2026" }),
    )

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe(1) // only cat2 copied
    const aprilBudgets = await prisma.budget.findMany({
      where: { userId: user.id, month: 4, year: 2026 },
    })
    expect(aprilBudgets).toHaveLength(2)
  })

  it("returns BUDGET_COPY_NO_PREVIOUS when no budgets exist for the previous month", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await copyBudgetsAction(
      { success: true, data: 0 },
      formData({ month: "4", year: "2026" }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("BUDGET_COPY_NO_PREVIOUS")
  })
})
