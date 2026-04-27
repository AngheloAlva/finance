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

import { createTransactionAction } from "@/features/transactions/actions/create-transaction.action"
import { updateTransactionAction } from "@/features/transactions/actions/update-transaction.action"
import { deleteTransactionAction } from "@/features/transactions/actions/delete-transaction.action"
import { createInstallmentPurchaseAction } from "@/features/transactions/actions/create-installment.action"
import { deleteInstallmentGroupAction } from "@/features/transactions/actions/delete-installment-group.action"
import { prisma } from "@/shared/lib/prisma"
import {
  createCategory,
  createCreditCard,
  createTag,
  createTransaction,
  createUser,
  dollars,
} from "../../../../tests/helpers/factories"
import { formData, setSessionUser } from "../../../../tests/helpers/action-test"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createTransactionAction", () => {
  it("creates a transaction and links provided tags", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)
    const tag = await createTag(user.id, { name: "groceries" })

    const result = await createTransactionAction(
      { success: true, data: undefined },
      formData({
        amount: "5000",
        description: "Lunch",
        date: "2026-04-15",
        type: "EXPENSE",
        paymentMethod: "DEBIT",
        categoryId: cat.id,
        tagIds: [tag.id],
      }),
    )

    expect(result.success).toBe(true)
    const tx = await prisma.transaction.findFirstOrThrow({
      where: { userId: user.id, isTemplate: false },
      include: { tags: true },
    })
    expect(tx.amount).toBe(5000)
    expect(tx.tags).toHaveLength(1)
    expect(tx.tags[0].tagId).toBe(tag.id)
  })

  it("rejects when category belongs to another user", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const cat = await createCategory(owner.id)

    const result = await createTransactionAction(
      { success: true, data: undefined },
      formData({
        amount: "5000",
        description: "x",
        date: "2026-04-15",
        type: "EXPENSE",
        paymentMethod: "CASH",
        categoryId: cat.id,
      }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("CATEGORY_ACCESS_DENIED")
  })

  it("returns VALIDATION_ERROR for missing required fields", async () => {
    const user = await createUser()
    setSessionUser(user.id)

    const result = await createTransactionAction(
      { success: true, data: undefined },
      formData({ amount: "", description: "", date: "", type: "", paymentMethod: "", categoryId: "" }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
  })
})

describe("updateTransactionAction", () => {
  it("updates the transaction and replaces tag links", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)
    const tagA = await createTag(user.id, { name: "a" })
    const tagB = await createTag(user.id, { name: "b" })

    const tx = await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(10),
      categoryId: cat.id,
    })
    await prisma.transactionTag.create({
      data: { transaction: { connect: { id: tx.id } }, tag: { connect: { id: tagA.id } } },
    })

    const result = await updateTransactionAction(
      { success: true, data: undefined },
      formData({
        id: tx.id,
        amount: "20000",
        description: "Updated",
        date: "2026-04-20",
        type: "EXPENSE",
        paymentMethod: "DEBIT",
        categoryId: cat.id,
        tagIds: [tagB.id],
      }),
    )

    expect(result.success).toBe(true)
    const updated = await prisma.transaction.findUniqueOrThrow({
      where: { id: tx.id },
      include: { tags: true },
    })
    expect(updated.amount).toBe(20000)
    expect(updated.tags.map((t) => t.tagId)).toEqual([tagB.id])
  })

  it("blocks amount/date changes on installment children", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)
    const tx = await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      categoryId: cat.id,
      date: new Date(2026, 0, 10),
      totalInstallments: 3,
      installmentNumber: 1,
    })

    const result = await updateTransactionAction(
      { success: true, data: undefined },
      formData({
        id: tx.id,
        amount: "99999",
        description: "x",
        date: "2026-01-10",
        type: "EXPENSE",
        paymentMethod: "DEBIT",
        categoryId: cat.id,
      }),
    )

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRANSACTION_INSTALLMENT_IMMUTABLE")
  })
})

describe("deleteTransactionAction", () => {
  it("deletes the owner's transaction", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const tx = await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(10),
    })

    const result = await deleteTransactionAction(
      { success: true, data: undefined },
      formData({ id: tx.id }),
    )

    expect(result.success).toBe(true)
    expect(await prisma.transaction.findUnique({ where: { id: tx.id } })).toBeNull()
  })

  it("returns TRANSACTION_NOT_OWNED for another user's transaction", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const tx = await createTransaction(owner.id, {
      type: "EXPENSE",
      amount: dollars(10),
    })

    const result = await deleteTransactionAction(
      { success: true, data: undefined },
      formData({ id: tx.id }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRANSACTION_NOT_OWNED")
  })
})

describe("createInstallmentPurchaseAction", () => {
  it("creates parent + N-1 children with billing-cycle aware impactDate", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)
    const card = await createCreditCard(user.id, { closingDay: 20, paymentDay: 10 })

    const result = await createInstallmentPurchaseAction(
      { success: true, data: undefined },
      formData({
        amount: "120000",
        description: "Laptop",
        date: "2026-04-15",
        type: "EXPENSE",
        paymentMethod: "CREDIT",
        categoryId: cat.id,
        totalInstallments: "3",
        creditCardId: card.id,
      }),
    )

    expect(result.success).toBe(true)
    const all = await prisma.transaction.findMany({
      where: { userId: user.id, isTemplate: false },
    })
    expect(all).toHaveLength(3)
    expect(all.every((t) => t.totalInstallments === 3)).toBe(true)
    expect(all.reduce((sum, t) => sum + t.amount, 0)).toBe(120000)
  })

  it("returns CREDIT_CARD_NOT_FOUND when card does not belong to user", async () => {
    const owner = await createUser()
    const other = await createUser()
    setSessionUser(other.id)
    const cat = await createCategory(other.id)
    const card = await createCreditCard(owner.id, { closingDay: 20, paymentDay: 10 })

    const result = await createInstallmentPurchaseAction(
      { success: true, data: undefined },
      formData({
        amount: "60000",
        description: "x",
        date: "2026-04-15",
        type: "EXPENSE",
        paymentMethod: "CREDIT",
        categoryId: cat.id,
        totalInstallments: "3",
        creditCardId: card.id,
      }),
    )
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("CREDIT_CARD_NOT_FOUND")
  })
})

describe("deleteInstallmentGroupAction", () => {
  it("deletes parent and all children of an installment group", async () => {
    const user = await createUser()
    setSessionUser(user.id)
    const cat = await createCategory(user.id)
    const parent = await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      categoryId: cat.id,
      totalInstallments: 3,
      installmentNumber: 1,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      categoryId: cat.id,
      totalInstallments: 3,
      installmentNumber: 2,
      parentTransactionId: parent.id,
    })
    await createTransaction(user.id, {
      type: "EXPENSE",
      amount: dollars(100),
      categoryId: cat.id,
      totalInstallments: 3,
      installmentNumber: 3,
      parentTransactionId: parent.id,
    })

    const result = await deleteInstallmentGroupAction(
      { success: true, data: undefined },
      formData({ parentTransactionId: parent.id }),
    )

    expect(result.success).toBe(true)
    const remaining = await prisma.transaction.count({ where: { userId: user.id } })
    expect(remaining).toBe(0)
  })
})
