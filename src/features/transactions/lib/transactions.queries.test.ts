import { describe, expect, it } from "vitest"
import {
  getTransactions,
  parseSearchParams,
} from "@/features/transactions/lib/transactions.queries"
import { prisma } from "@/shared/lib/prisma"
import {
  createCategory,
  createCreditCard,
  createTag,
  createTransaction,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"

describe("parseSearchParams", () => {
  it("returns sensible defaults when nothing is provided", () => {
    const { filters, pagination } = parseSearchParams({})
    expect(filters.sortBy).toBe("date")
    expect(filters.sortDir).toBe("desc")
    expect(pagination).toEqual({ page: 1, pageSize: 20 })
  })

  it("clamps pageSize to [1, 100] and page to >= 1", () => {
    const big = parseSearchParams({ pageSize: "9999", page: "0" })
    expect(big.pagination.pageSize).toBe(100)
    expect(big.pagination.page).toBe(1)
  })

  it("ignores invalid scalar arrays", () => {
    const { filters } = parseSearchParams({ type: ["EXPENSE"] })
    expect(filters.type).toBeUndefined()
  })
})

describe("getTransactions", () => {
  it("returns paginated empty result for users with no transactions", async () => {
    const user = await createUser()
    const result = await getTransactions(
      user.id,
      { sortBy: "date", sortDir: "desc" },
      { page: 1, pageSize: 20 },
    )
    expect(result.data).toEqual([])
    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(1)
  })

  it("excludes templates from results", async () => {
    const user = await createUser()
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      isTemplate: true,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(50),
    })

    const result = await getTransactions(
      user.id,
      { sortBy: "date", sortDir: "desc" },
      { page: 1, pageSize: 20 },
    )
    expect(result.total).toBe(1)
    expect(result.data[0].amount).toBe(dollars(50))
  })

  it("filters by type, categoryId, creditCardId and tagId", async () => {
    const user = await createUser()
    const cat = await createCategory(user.id, { name: "Food" })
    const card = await createCreditCard(user.id)
    const tag = await createTag(user.id, { name: "marker" })

    await createTransaction(user.id, {
      type: "INCOME",
      amount: dollars(1000),
    })
    const food = await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(40),
      categoryId: cat.id,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(80),
      creditCardId: card.id,
    })
    await prisma.transactionTag.create({
      data: {
        transaction: { connect: { id: food.id } },
        tag: { connect: { id: tag.id } },
      },
    })

    const byType = await getTransactions(user.id, { type: "INCOME" }, { page: 1, pageSize: 20 })
    expect(byType.total).toBe(1)

    const byCategory = await getTransactions(
      user.id,
      { categoryId: cat.id },
      { page: 1, pageSize: 20 },
    )
    expect(byCategory.total).toBe(1)

    const byCard = await getTransactions(
      user.id,
      { creditCardId: card.id },
      { page: 1, pageSize: 20 },
    )
    expect(byCard.total).toBe(1)

    const byTag = await getTransactions(
      user.id,
      { tagId: tag.id },
      { page: 1, pageSize: 20 },
    )
    expect(byTag.total).toBe(1)
    expect(byTag.data[0].id).toBe(food.id)
  })

  it("filters by dateFrom/dateTo on the date field", async () => {
    const user = await createUser()
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(10),
      date: new Date(2026, 0, 1),
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(20),
      date: new Date(2026, 5, 1),
    })

    const result = await getTransactions(
      user.id,
      { dateFrom: "2026-03-01", dateTo: "2026-12-31" },
      { page: 1, pageSize: 20 },
    )
    expect(result.total).toBe(1)
    expect(result.data[0].amount).toBe(dollars(20))
  })

  it("paginates correctly without overlap", async () => {
    const user = await createUser()
    for (let i = 0; i < 5; i++) {
      await createTransaction(user.id, {
        type: "EXPENSE",
        amount: dollars(i + 1),
        date: new Date(2026, 0, i + 1),
      })
    }

    const page1 = await getTransactions(user.id, {}, { page: 1, pageSize: 2 })
    const page2 = await getTransactions(user.id, {}, { page: 2, pageSize: 2 })

    expect(page1.data).toHaveLength(2)
    expect(page2.data).toHaveLength(2)
    expect(page1.totalPages).toBe(3)
    const ids1 = page1.data.map((t) => t.id)
    const ids2 = page2.data.map((t) => t.id)
    expect(ids1.some((id) => ids2.includes(id))).toBe(false)
  })

  it("isolates per user", async () => {
    const userA = await createUser()
    const userB = await createUser()
    await createTransaction(userA.id, { type: "EXPENSE", amount: dollars(10) })

    const b = await getTransactions(userB.id, {}, { page: 1, pageSize: 20 })
    expect(b.total).toBe(0)
  })
})
